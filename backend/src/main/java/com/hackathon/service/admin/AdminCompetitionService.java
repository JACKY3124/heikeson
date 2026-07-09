package com.hackathon.service.admin;

import com.hackathon.config.SecurityUtils;
import com.hackathon.dto.*;
import com.hackathon.entity.Competition;
import com.hackathon.entity.Problem;
import com.hackathon.entity.Registration;
import com.hackathon.entity.User;
import com.hackathon.exception.BusinessException;
import com.hackathon.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminCompetitionService {

    private final CompetitionRepository competitionRepository;
    private final UserRepository userRepository;
    private final RegistrationRepository registrationRepository;
    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final SecurityUtils securityUtils;

    /**
     * 创建赛事
     * - 自动设置 createdBy 为当前管理员
     * - 校验时间逻辑：报名截止 > 报名开始，提交截止 > 提交开始，提交开始 > 报名截止
     */
    @Transactional
    public CompetitionResponseDTO createCompetition(CompetitionCreateRequest request) {
        // 校验时间逻辑
        validateTimeLogic(request.getRegisterStart(), request.getRegisterEnd(),
                request.getSubmitStart(), request.getSubmitEnd());

        Competition competition = new Competition();
        competition.setTitle(request.getTitle());
        competition.setDescription(request.getDescription());
        competition.setCoverImage(request.getCoverImage());
        competition.setRules(request.getRules());
        competition.setCompetitionType(request.getCompetitionType() != null ? request.getCompetitionType() : "individual");
        competition.setStatus(request.getStatus() != null ? request.getStatus() : "pending");
        competition.setRegisterStart(request.getRegisterStart());
        competition.setRegisterEnd(request.getRegisterEnd());
        competition.setSubmitStart(request.getSubmitStart());
        competition.setSubmitEnd(request.getSubmitEnd());
        competition.setCreatedBy(securityUtils.getCurrentUserId());

        Competition saved = competitionRepository.save(competition);
        return toResponseDTO(saved);
    }

    /**
     * 编辑赛事
     * - 只能编辑 pending 状态的赛事（ongoing/finished 不可编辑）
     * - 校验时间逻辑
     */
    @Transactional
    public CompetitionResponseDTO updateCompetition(Long id, CompetitionUpdateRequest request) {
        Competition competition = competitionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("赛事不存在"));

        // 只有 pending 状态可编辑全部字段，ongoing 只可改部分字段
        if ("finished".equals(competition.getStatus()) || "cancelled".equals(competition.getStatus())) {
            throw new BusinessException("已完成或已取消的赛事不可编辑");
        }

        // 如果有时间更新，校验时间逻辑
        LocalDateTime regStart = request.getRegisterStart() != null ? request.getRegisterStart() : competition.getRegisterStart();
        LocalDateTime regEnd = request.getRegisterEnd() != null ? request.getRegisterEnd() : competition.getRegisterEnd();
        LocalDateTime subStart = request.getSubmitStart() != null ? request.getSubmitStart() : competition.getSubmitStart();
        LocalDateTime subEnd = request.getSubmitEnd() != null ? request.getSubmitEnd() : competition.getSubmitEnd();
        validateTimeLogic(regStart, regEnd, subStart, subEnd);

        if (request.getTitle() != null) competition.setTitle(request.getTitle());
        if (request.getDescription() != null) competition.setDescription(request.getDescription());
        if (request.getCoverImage() != null) competition.setCoverImage(request.getCoverImage());
        if (request.getRules() != null) competition.setRules(request.getRules());
        if (request.getCompetitionType() != null) competition.setCompetitionType(request.getCompetitionType());
        if (request.getStatus() != null) competition.setStatus(request.getStatus());
        if (request.getRegisterStart() != null) competition.setRegisterStart(request.getRegisterStart());
        if (request.getRegisterEnd() != null) competition.setRegisterEnd(request.getRegisterEnd());
        if (request.getSubmitStart() != null) competition.setSubmitStart(request.getSubmitStart());
        if (request.getSubmitEnd() != null) competition.setSubmitEnd(request.getSubmitEnd());

        Competition saved = competitionRepository.save(competition);
        return toResponseDTO(saved);
    }

    /**
     * 变更赛事状态
     * - pending → ongoing → finished (正向流转)
     * - 任意状态 → cancelled (可取消)
     */
    @Transactional
    public CompetitionResponseDTO changeStatus(Long id, CompetitionStatusRequest request) {
        Competition competition = competitionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("赛事不存在"));

        String newStatus = request.getStatus();
        String currentStatus = competition.getStatus();

        // 状态流转校验
        validateStatusTransition(currentStatus, newStatus);

        competition.setStatus(newStatus);
        Competition saved = competitionRepository.save(competition);
        return toResponseDTO(saved);
    }

    /**
     * 删除赛事
     * - 只有 pending 状态可删除（有报名/提交的赛事不可删除）
     */
    @Transactional
    public void deleteCompetition(Long id) {
        Competition competition = competitionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("赛事不存在"));

        if (!"pending".equals(competition.getStatus())) {
            throw new BusinessException("只有待发布状态的赛事可删除，当前状态：" + competition.getStatus());
        }

        // 检查是否有报名
        List<Registration> registrations = registrationRepository.findByCompetitionId(id);
        if (!registrations.isEmpty()) {
            throw new BusinessException("该赛事已有 " + registrations.size() + " 人报名，不可删除");
        }

        // 删除赛题
        problemRepository.deleteByCompetitionId(id);
        competitionRepository.deleteById(id);
    }

    /**
     * 获取赛事详情（管理员视角，含统计信息）
     */
    public CompetitionResponseDTO getCompetitionDetail(Long id) {
        Competition competition = competitionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("赛事不存在"));
        return toResponseDTO(competition);
    }

    /**
     * 分页搜索赛事列表
     */
    public PageResponse<CompetitionResponseDTO> listCompetitions(String keyword, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Competition> competitions = competitionRepository.searchCompetitions(keyword, status, pageable);
        Page<CompetitionResponseDTO> dtoPage = competitions.map(this::toResponseDTO);
        return PageResponse.of(dtoPage);
    }

    /**
     * 获取所有赛事（不分页，用于下拉选择等）
     */
    public List<CompetitionResponseDTO> listAllCompetitions() {
        return competitionRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    // ===== 赛题管理 =====

    /**
     * 为赛事添加赛题
     */
    @Transactional
    public ProblemResponseDTO addProblem(Long competitionId, ProblemRequest request) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new BusinessException("赛事不存在"));

        Problem problem = new Problem();
        problem.setCompetitionId(competitionId);
        problem.setProblemId(request.getProblemId());
        problem.setTitle(request.getTitle());
        problem.setDescription(request.getDescription());
        problem.setScore(request.getScore());
        problem.setDifficulty(request.getDifficulty() != null ? request.getDifficulty() : "medium");
        problem.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);

        Problem saved = problemRepository.save(problem);
        return toProblemDTO(saved);
    }

    /**
     * 编辑赛题
     */
    @Transactional
    public ProblemResponseDTO updateProblem(Long id, ProblemRequest request) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new BusinessException("赛题不存在"));

        if (request.getProblemId() != null) problem.setProblemId(request.getProblemId());
        if (request.getTitle() != null) problem.setTitle(request.getTitle());
        if (request.getDescription() != null) problem.setDescription(request.getDescription());
        if (request.getScore() != null) problem.setScore(request.getScore());
        if (request.getDifficulty() != null) problem.setDifficulty(request.getDifficulty());
        if (request.getSortOrder() != null) problem.setSortOrder(request.getSortOrder());

        Problem saved = problemRepository.save(problem);
        return toProblemDTO(saved);
    }

    /**
     * 删除赛题
     */
    @Transactional
    public void deleteProblem(Long id) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new BusinessException("赛题不存在"));

        // 如果赛事已进行中，不允许删除赛题
        Competition competition = competitionRepository.findById(problem.getCompetitionId())
                .orElseThrow(() -> new BusinessException("赛事不存在"));
        if ("ongoing".equals(competition.getStatus())) {
            throw new BusinessException("赛事进行中，不可删除赛题");
        }

        problemRepository.deleteById(id);
    }

    /**
     * 查赛事下所有赛题
     */
    public List<ProblemResponseDTO> listProblems(Long competitionId) {
        return problemRepository.findByCompetitionIdOrderBySortOrder(competitionId)
                .stream()
                .map(this::toProblemDTO)
                .collect(Collectors.toList());
    }

    // ===== 私有方法 =====

    private void validateTimeLogic(LocalDateTime registerStart, LocalDateTime registerEnd,
                                    LocalDateTime submitStart, LocalDateTime submitEnd) {
        if (registerStart != null && registerEnd != null && registerStart.isAfter(registerEnd)) {
            throw new BusinessException("报名开始时间不能晚于报名截止时间");
        }
        if (submitStart != null && submitEnd != null && submitStart.isAfter(submitEnd)) {
            throw new BusinessException("提交开始时间不能晚于提交截止时间");
        }
        if (registerEnd != null && submitStart != null && registerEnd.isAfter(submitStart)) {
            throw new BusinessException("提交开始时间不能早于报名截止时间");
        }
    }

    private void validateStatusTransition(String current, String newStatus) {
        // 允许的流转：pending → ongoing, ongoing → finished, 任意 → cancelled
        // 也允许 pending → pending（重新发布）等自身流转
        switch (current) {
            case "pending":
                if (!"ongoing".equals(newStatus) && !"cancelled".equals(newStatus) && !"pending".equals(newStatus)) {
                    throw new BusinessException("待发布赛事只能变更为进行中或已取消");
                }
                break;
            case "ongoing":
                if (!"finished".equals(newStatus) && !"cancelled".equals(newStatus) && !"ongoing".equals(newStatus)) {
                    throw new BusinessException("进行中赛事只能变更为已完成或已取消");
                }
                break;
            case "finished":
                throw new BusinessException("已完成的赛事不可变更状态");
            case "cancelled":
                throw new BusinessException("已取消的赛事不可变更状态");
        }
    }

    private CompetitionResponseDTO toResponseDTO(Competition c) {
        CompetitionResponseDTO dto = new CompetitionResponseDTO();
        dto.setId(c.getId());
        dto.setTitle(c.getTitle());
        dto.setDescription(c.getDescription());
        dto.setCoverImage(c.getCoverImage());
        dto.setRules(c.getRules());
        dto.setCompetitionType(c.getCompetitionType());
        dto.setStatus(c.getStatus());

        // 使用 fillContractFields 统一设置时间字段（兼容旧字段+契约字段）
        dto.fillContractFields(c.getRegisterStart(), c.getRegisterEnd(),
                c.getSubmitStart(), c.getSubmitEnd(),
                c.getCreatedAt(), c.getUpdatedAt());

        // 契约新增字段
        dto.setMinTeamSize(c.getMinTeamSize());
        dto.setMaxTeamSize(c.getMaxTeamSize());
        dto.setMaxParticipants(c.getMaxParticipants());
        dto.setIsVirtual(c.getIsVirtual());
        dto.setLocation(c.getLocation());
        dto.setCreatedBy(c.getCreatedBy());

        // 创建者名称
        userRepository.findById(c.getCreatedBy()).ifPresent(u -> dto.setCreatedByName(u.getNickname()));

        // 统计数据
        dto.setRegistrationCount((long) registrationRepository.findByCompetitionId(c.getId()).size());
        dto.setApprovedCount((long) registrationRepository.findByCompetitionIdAndStatus(c.getId(), "approved").size());
        dto.setSubmissionCount((long) submissionRepository.findByCompetitionIdAndStatus(c.getId(), "submitted").size());

        return dto;
    }

    private ProblemResponseDTO toProblemDTO(Problem p) {
        ProblemResponseDTO dto = new ProblemResponseDTO();
        dto.setId(p.getId());
        dto.setCompetitionId(p.getCompetitionId());
        dto.setProblemId(p.getProblemId());
        dto.setTitle(p.getTitle());
        dto.setDescription(p.getDescription());
        dto.setScore(p.getScore());
        dto.setDifficulty(p.getDifficulty());
        dto.setSortOrder(p.getSortOrder());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setUpdatedAt(p.getUpdatedAt());
        return dto;
    }
}
