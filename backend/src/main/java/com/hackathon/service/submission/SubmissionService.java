package com.hackathon.service.submission;

import com.hackathon.config.SecurityUtils;
import com.hackathon.dto.PlayerSubmissionRequest;
import com.hackathon.dto.SubmissionResponseDTO;
import com.hackathon.entity.*;
import com.hackathon.exception.BusinessException;
import com.hackathon.repository.*;
import com.hackathon.service.upload.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final CompetitionRepository competitionRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProblemRepository problemRepository;
    private final CommentRepository commentRepository;
    private final LikeRecordRepository likeRecordRepository;
    private final SecurityUtils securityUtils;
    private final FileUploadService fileUploadService;

    // ======================== 创建草稿 ========================

    /**
     * 创建草稿
     * - 自动取当前登录用户
     * - 校验赛事存在且状态为 ongoing
     * - 校验已报名且已通过审批
     * - 校验提交时间窗口
     * - 团队赛校验团队成员身份
     * - 校验赛题属于该赛事
     * - 同一赛题不可有多个草稿
     */
    @Transactional
    public SubmissionResponseDTO createDraft(PlayerSubmissionRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Long userId = currentUser.getId();
        Long competitionId = Long.parseLong(request.getCompetitionId());

        // 校验赛事存在
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new BusinessException("赛事不存在"));

        // 校验赛事状态
        if (!"ongoing".equals(competition.getStatus())) {
            throw new BusinessException("赛事当前状态为 " + competition.getStatus() + "，无法提交作品");
        }

        // 校验已报名且已通过审批
        boolean isApproved = registrationRepository.findByUserIdAndCompetitionId(userId, competitionId)
                .filter(r -> "approved".equals(r.getStatus()))
                .isPresent();
        if (!isApproved) {
            throw new BusinessException("您未报名该赛事或报名未通过审批，无法提交作品");
        }

        // 校验提交时间窗口
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(competition.getSubmitStart())) {
            throw new BusinessException("提交窗口尚未开启，开始时间：" + competition.getSubmitStart());
        }

        // 团队赛校验
        if ("team".equals(competition.getCompetitionType()) && request.getTeamId() != null) {
            // 校验团队成员身份
            boolean isTeamMember = teamMemberRepository.findByTeamIdAndUserId(request.getTeamId(), userId)
                    .isPresent();
            if (!isTeamMember) {
                throw new BusinessException("您不是该团队的成员，无法以该团队提交作品");
            }
        }

        // 个人赛不允许传 teamId
        if ("individual".equals(competition.getCompetitionType()) && request.getTeamId() != null) {
            throw new BusinessException("该赛事为个人赛，无需选择团队");
        }

        // 校验赛题属于该赛事
        if (request.getProblemId() != null) {
            Problem problem = problemRepository.findById(request.getProblemId())
                    .orElseThrow(() -> new BusinessException("赛题不存在"));
            if (!problem.getCompetitionId().equals(competitionId)) {
                throw new BusinessException("该赛题不属于此赛事");
            }
        }

        // 同一赛题不可重复提交：已有草稿或已提交的作品都不可再建草稿
        if (request.getProblemId() != null) {
            Optional<Submission> existingDraft = submissionRepository
                    .findByUserIdAndCompetitionIdAndProblemIdAndStatus(userId, competitionId, request.getProblemId(), "draft");
            if (existingDraft.isPresent()) {
                throw new BusinessException("您已有该赛题的草稿，请直接编辑而非新建");
            }
            Optional<Submission> existingSubmitted = submissionRepository
                    .findByUserIdAndCompetitionIdAndProblemIdAndStatus(userId, competitionId, request.getProblemId(), "submitted");
            if (existingSubmitted.isPresent()) {
                throw new BusinessException("您已提交该赛题的作品，如需修改请先撤回");
            }
        }

        // 创建草稿
        Submission submission = new Submission();
        submission.setUserId(userId);
        submission.setCompetitionId(competitionId);
        submission.setTeamId(request.getTeamId());
        submission.setProblemId(request.getProblemId());
        submission.setTitle(request.getTitle());
        submission.setDescription(request.getDescription());
        submission.setFileName(request.getFileName());
        submission.setFileUrl(request.getFileUrl());
        submission.setFileSize(request.getFileSize());
        submission.setStatus("draft");

        Submission saved = submissionRepository.save(submission);
        log.info("草稿创建成功: userId={}, competitionId={}, submissionId={}", userId, competitionId, saved.getId());
        return toResponseDTO(saved, currentUser, competition);
    }

    // ======================== 更新草稿 ========================

    /**
     * 更新草稿（继续编辑）
     * - 只能操作自己的草稿
     * - 已提交/已评分的作品不可编辑
     * - 团队赛：队长和成员均可编辑
     */
    @Transactional
    public SubmissionResponseDTO updateDraft(Long id, PlayerSubmissionRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Long userId = currentUser.getId();

        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("作品不存在"));

        // 权限校验：自己的作品 或 团队成员的作品
        if (!isOwnerOrTeamMember(submission, userId)) {
            throw new BusinessException("只能编辑自己（或所在团队）的作品");
        }

        // 只有草稿状态可编辑
        if (!"draft".equals(submission.getStatus())) {
            throw new BusinessException("作品状态为 " + submission.getStatus() + "，不可编辑（只有草稿可编辑）");
        }

        // 更新字段（只更新非空字段）
        if (request.getTitle() != null) submission.setTitle(request.getTitle());
        if (request.getDescription() != null) submission.setDescription(request.getDescription());
        if (request.getFileName() != null) submission.setFileName(request.getFileName());
        if (request.getFileUrl() != null) submission.setFileUrl(request.getFileUrl());
        if (request.getFileSize() != null) submission.setFileSize(request.getFileSize());
        if (request.getProblemId() != null) {
            // 校验赛题属于该赛事
            Problem problem = problemRepository.findById(request.getProblemId())
                    .orElseThrow(() -> new BusinessException("赛题不存在"));
            if (!problem.getCompetitionId().equals(submission.getCompetitionId())) {
                throw new BusinessException("该赛题不属于此赛事");
            }
            submission.setProblemId(request.getProblemId());
        }

        Submission saved = submissionRepository.save(submission);
        Competition competition = competitionRepository.findById(saved.getCompetitionId()).orElse(null);
        return toResponseDTO(saved, currentUser, competition);
    }

    // ======================== 正式提交 ========================

    /**
     * 正式提交作品（draft → submitted）
     * - 校验提交截止时间
     * - 校验必填字段
     * - 同一赛题不可重复提交（已有 submitted 状态的）
     * - 团队赛：队长提交，或团队成员提交
     */
    @Transactional
    public SubmissionResponseDTO submit(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        Long userId = currentUser.getId();

        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("作品不存在"));

        // 权限校验
        if (!isOwnerOrTeamMember(submission, userId)) {
            throw new BusinessException("只能提交自己（或所在团队）的作品");
        }

        // 只有草稿状态可以提交
        if (!"draft".equals(submission.getStatus())) {
            throw new BusinessException("作品状态为 " + submission.getStatus() + "，不可再次提交");
        }

        // 校验赛事提交截止时间
        Competition competition = competitionRepository.findById(submission.getCompetitionId())
                .orElseThrow(() -> new BusinessException("赛事不存在"));
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(competition.getSubmitEnd())) {
            throw new BusinessException("提交已截止，截止时间：" + competition.getSubmitEnd());
        }

        // 校验必填字段
        if (submission.getTitle() == null || submission.getTitle().isBlank()) {
            throw new BusinessException("作品标题不能为空");
        }
        if (submission.getFileUrl() == null || submission.getFileUrl().isBlank()) {
            throw new BusinessException("请先上传作品文件");
        }

        // 同一赛题不可重复提交
        if (submission.getProblemId() != null) {
            Optional<Submission> existingSubmitted = submissionRepository
                    .findByUserIdAndCompetitionIdAndProblemIdAndStatus(
                            userId, submission.getCompetitionId(), submission.getProblemId(), "submitted");
            if (existingSubmitted.isPresent()) {
                throw new BusinessException("您已提交该赛题的作品，不可重复提交");
            }
        }

        // 状态流转 draft → submitted
        submission.setStatus("submitted");
        submission.setSubmittedAt(LocalDateTime.now());

        Submission saved = submissionRepository.save(submission);
        log.info("作品正式提交: userId={}, competitionId={}, submissionId={}", userId, competition.getId(), saved.getId());
        return toResponseDTO(saved, currentUser, competition);
    }

    // ======================== 撤回作品 ========================

    /**
     * 撤回已提交的作品（submitted → draft）
     * - 只能在提交截止时间前撤回
     * - 已经被评分的作品不可撤回
     * - 撤回后可以重新编辑并再次提交
     */
    @Transactional
    public SubmissionResponseDTO withdraw(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        Long userId = currentUser.getId();

        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("作品不存在"));

        // 权限校验
        if (!isOwnerOrTeamMember(submission, userId)) {
            throw new BusinessException("只能撤回自己（或所在团队）的作品");
        }

        // 只有 submitted 状态可撤回
        if (!"submitted".equals(submission.getStatus())) {
            throw new BusinessException("只有已提交的作品可撤回，当前状态：" + submission.getStatus());
        }

        // 校验提交截止时间前可撤回
        Competition competition = competitionRepository.findById(submission.getCompetitionId())
                .orElseThrow(() -> new BusinessException("赛事不存在"));
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(competition.getSubmitEnd())) {
            throw new BusinessException("提交已截止，无法撤回作品");
        }

        // 已经被评分的作品不可撤回（status=scored）
        // 注：评分功能还未实现，这里预留检查

        // 状态流转 submitted → draft
        submission.setStatus("draft");
        submission.setSubmittedAt(null);

        Submission saved = submissionRepository.save(submission);
        log.info("作品撤回: userId={}, submissionId={}, 重新变为草稿", userId, saved.getId());
        return toResponseDTO(saved, currentUser, competition);
    }

    // ======================== 删除草稿 ========================

    /**
     * 删除草稿
     * - 只能删除自己的草稿
     * - 已提交的作品不可删除（需先撤回）
     * - 同时删除已上传的文件
     */
    @Transactional
    public void deleteDraft(Long id) {
        Long userId = securityUtils.getCurrentUserId();

        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("作品不存在"));

        // 权限校验
        if (!isOwnerOrTeamMember(submission, userId)) {
            throw new BusinessException("只能删除自己（或所在团队）的作品");
        }

        // 只有草稿可删除
        if (!"draft".equals(submission.getStatus())) {
            throw new BusinessException("只有草稿可删除，已提交的作品请先撤回");
        }

        // 删除关联文件
        fileUploadService.deleteFile(submission.getFileUrl());

        submissionRepository.delete(submission);
        log.info("草稿删除: userId={}, submissionId={}", userId, id);
    }

    // ======================== 上传文件并关联到草稿 ========================

    /**
     * 上传文件并自动关联到某个草稿
     * - 只有草稿状态可上传
     * - 上传后自动更新 fileName/fileUrl/fileSize
     */
    @Transactional
    public SubmissionResponseDTO uploadFileToSubmission(Long submissionId, org.springframework.web.multipart.MultipartFile file) {
        Long userId = securityUtils.getCurrentUserId();

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new BusinessException("作品不存在"));

        // 权限校验
        if (!isOwnerOrTeamMember(submission, userId)) {
            throw new BusinessException("只能给自己的作品上传文件");
        }

        // 只有草稿可修改
        if (!"draft".equals(submission.getStatus())) {
            throw new BusinessException("只有草稿可上传文件，已提交的作品请先撤回");
        }

        // 如果之前有文件，删除旧文件
        if (submission.getFileUrl() != null && !submission.getFileUrl().isBlank()) {
            fileUploadService.deleteFile(submission.getFileUrl());
        }

        // 上传新文件
        String fileUrl = fileUploadService.uploadFile(file);

        // 更新提交记录
        submission.setFileName(file.getOriginalFilename());
        submission.setFileUrl(fileUrl);
        submission.setFileSize(file.getSize());

        Submission saved = submissionRepository.save(submission);
        User user = userRepository.findById(userId).orElse(null);
        Competition comp = competitionRepository.findById(saved.getCompetitionId()).orElse(null);
        return toResponseDTO(saved, user, comp);
    }

    // ======================== 查询接口 ========================

    /**
     * 查询我的所有作品
     */
    public List<SubmissionResponseDTO> listMySubmissions() {
        Long userId = securityUtils.getCurrentUserId();
        List<Submission> submissions = submissionRepository.findByUserId(userId);
        return submissions.stream()
                .map(s -> {
                    User user = userRepository.findById(s.getUserId()).orElse(null);
                    Competition comp = competitionRepository.findById(s.getCompetitionId()).orElse(null);
                    return toResponseDTO(s, user, comp);
                })
                .collect(Collectors.toList());
    }

    /**
     * 查询我在某赛事的作品列表
     */
    public List<SubmissionResponseDTO> listMySubmissionsByCompetition(Long competitionId) {
        Long userId = securityUtils.getCurrentUserId();
        List<Submission> submissions = submissionRepository.findByUserIdAndCompetitionId(userId, competitionId);
        return submissions.stream()
                .map(s -> {
                    User user = userRepository.findById(s.getUserId()).orElse(null);
                    Competition comp = competitionRepository.findById(s.getCompetitionId()).orElse(null);
                    return toResponseDTO(s, user, comp);
                })
                .collect(Collectors.toList());
    }

    /**
     * 查询作品详情
     * - 草稿只有作者（及团队成员）可看
     * - 已提交的作品所有人可看
     */
    public SubmissionResponseDTO getSubmissionDetail(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("作品不存在"));

        // 草稿只有作者/团队成员可看
        if ("draft".equals(submission.getStatus()) && !isOwnerOrTeamMember(submission, userId)) {
            throw new BusinessException("草稿仅作者及团队成员可查看");
        }

        User user = userRepository.findById(submission.getUserId()).orElse(null);
        Competition comp = competitionRepository.findById(submission.getCompetitionId()).orElse(null);
        return toResponseDTO(submission, user, comp);
    }

    /**
     * 查某赛事所有已提交作品（管理员/专家用）
     */
    public List<SubmissionResponseDTO> listByCompetition(Long competitionId) {
        List<Submission> submissions = submissionRepository.findByCompetitionIdAndStatus(competitionId, "submitted");
        return submissions.stream()
                .map(s -> {
                    User user = userRepository.findById(s.getUserId()).orElse(null);
                    Competition comp = competitionRepository.findById(s.getCompetitionId()).orElse(null);
                    return toResponseDTO(s, user, comp);
                })
                .collect(Collectors.toList());
    }

    /**
     * 查某赛事所有作品（含草稿，管理员用）
     */
    public List<SubmissionResponseDTO> listAllByCompetition(Long competitionId) {
        List<Submission> submissions = submissionRepository.findByCompetitionId(competitionId);
        return submissions.stream()
                .map(s -> {
                    User user = userRepository.findById(s.getUserId()).orElse(null);
                    Competition comp = competitionRepository.findById(s.getCompetitionId()).orElse(null);
                    return toResponseDTO(s, user, comp);
                })
                .collect(Collectors.toList());
    }

    // ======================== 权限辅助方法 ========================

    /**
     * 判断当前用户是否为作品的所有者或团队成员
     * - 个人赛：userId == submission.userId
     * - 团队赛：userId == submission.userId 或 userId 在 submission.teamId 的团队成员列表中
     */
    private boolean isOwnerOrTeamMember(Submission submission, Long userId) {
        // 作品作者本人
        if (submission.getUserId().equals(userId)) {
            return true;
        }
        // 团队赛：检查团队成员
        if (submission.getTeamId() != null) {
            return teamMemberRepository.findByTeamIdAndUserId(submission.getTeamId(), userId).isPresent();
        }
        return false;
    }

    // ======================== DTO 转换 ========================

    private SubmissionResponseDTO toResponseDTO(Submission s, User user, Competition comp) {
        SubmissionResponseDTO dto = new SubmissionResponseDTO();
        dto.setId(s.getId());
        dto.setUserId(s.getUserId());
        dto.setUsername(user != null ? user.getUsername() : null);
        dto.setNickname(user != null ? user.getNickname() : null);
        dto.setCompetitionId(s.getCompetitionId());
        dto.setCompetitionTitle(comp != null ? comp.getTitle() : null);
        dto.setTeamId(s.getTeamId());

        // 团队名
        if (s.getTeamId() != null) {
            dto.setTeamName(teamRepository.findById(s.getTeamId())
                    .map(Team::getName).orElse(null));
        }

        // 赛题信息
        dto.setProblemId(s.getProblemId());
        if (s.getProblemId() != null) {
            problemRepository.findById(s.getProblemId()).ifPresent(p -> {
                dto.setProblemTitle(p.getTitle());
                dto.setProblemDifficulty(p.getDifficulty());
            });
        }

        dto.setTitle(s.getTitle());
        dto.setDescription(s.getDescription());
        dto.setFileName(s.getFileName());
        dto.setFileUrl(s.getFileUrl());
        dto.setFileSize(s.getFileSize());
        dto.setStatus(s.getStatus());
        dto.setSubmittedAt(s.getSubmittedAt());
        dto.setCreatedAt(s.getCreatedAt());
        dto.setUpdatedAt(s.getUpdatedAt());

        // 评论数和点赞数
        dto.setCommentCount(commentRepository.countBySubmissionId(s.getId()));
        dto.setLikeCount(likeRecordRepository.countBySubmissionId(s.getId()));

        // 当前用户是否已点赞（仅已提交作品）
        if ("submitted".equals(s.getStatus())) {
            Long currentUserId = securityUtils.getCurrentUserId();
            dto.setLiked(likeRecordRepository.findBySubmissionIdAndUserId(s.getId(), currentUserId).isPresent());
        }

        return dto;
    }
}
