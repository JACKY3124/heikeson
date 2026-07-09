package com.hackathon.controller.contract;

import com.hackathon.dto.*;
import com.hackathon.entity.*;
import com.hackathon.repository.*;
import com.hackathon.service.comment.CommentService;
import com.hackathon.service.registration.RegistrationService;
import com.hackathon.service.submission.SubmissionService;
import com.hackathon.service.ranking.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 契约兼容路由控制器
 * 按照 api-contract.md 的路由定义，将请求转发到现有 Service
 * 与旧路由并存，两者都能正常使用
 */
@RestController
@RequiredArgsConstructor
public class ContractCompatController {

    private final RegistrationService registrationService;
    private final SubmissionService submissionService;
    private final RankingService rankingService;
    private final CommentService commentService;
    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;
    private final CompetitionRepository competitionRepository;

    // ======================== 二、赛事模块（Competition） ========================
    // GET /api/competitions 和 GET /api/competitions/{id} 已在 CompetitionController 中实现
    // 不再重复映射，避免路由冲突

    // ======================== 三、报名模块（Registration） ========================

    /** 契约: POST /api/competitions/{id}/register — 报名赛事 */
    @PostMapping("/api/competitions/{id}/register")
    public ApiResponse<RegistrationResponseDTO> register(
            @PathVariable Long id,
            @RequestBody PlayerRegistrationRequest request) {
        request.setCompetitionId(id);
        return ApiResponse.success(registrationService.register(request));
    }

    /** 契约: GET /api/competitions/{id}/registration/status — 获取报名状态 */
    @GetMapping("/api/competitions/{id}/registration/status")
    public ApiResponse<RegistrationResponseDTO> getRegistrationStatus(@PathVariable Long id) {
        return ApiResponse.success(registrationService.getMyRegistrationStatus(id));
    }

    /** 契约: POST /api/competitions/{id}/registration/withdraw — 退赛 */
    @PostMapping("/api/competitions/{id}/registration/withdraw")
    public ApiResponse<Void> withdrawRegistration(@PathVariable Long id) {
        registrationService.withdrawRegistration(id);
        return ApiResponse.success(null);
    }

    // ======================== 四、作品提交模块（Submission） ========================

    /** 契约: POST /api/competitions/{id}/submissions — 提交作品 */
    @PostMapping("/api/competitions/{id}/submissions")
    public ApiResponse<SubmissionResponseDTO> createSubmission(
            @PathVariable Long id,
            @RequestBody PlayerSubmissionRequest request) {
        request.setCompetitionId(String.valueOf(id));
        return ApiResponse.success(submissionService.createDraft(request));
    }

    /** 契约: GET /api/competitions/{id}/submissions — 获取我的提交列表 */
    @GetMapping("/api/competitions/{id}/submissions")
    public ApiResponse<List<SubmissionResponseDTO>> listMySubmissions(@PathVariable Long id) {
        return ApiResponse.success(submissionService.listMySubmissionsByCompetition(id));
    }

    // ======================== 五、评分模块（Scoring） ========================

    /** 契约: GET /api/submissions/{id}/scores — 获取作品评分 */
    @GetMapping("/api/submissions/{id}/scores")
    public ApiResponse<ScoreResponseDTO> getScores(@PathVariable Long id) {
        // 评分由组员3(专家端)开发，这里返回基础结构
        ScoreResponseDTO dto = new ScoreResponseDTO();
        dto.setSubmissionId(id);
        return ApiResponse.success(dto);
    }

    // ======================== 六、排名模块（Ranking） ========================

    /** 契约: GET /api/competitions/{id}/rankings — 获取排行榜 */
    @GetMapping("/api/competitions/{id}/rankings")
    public ApiResponse<List<RankingResponseDTO>> listRankings(
            @PathVariable Long id,
            @RequestParam(required = false) String type) {
        return ApiResponse.success(rankingService.listCompetitionRanking(id));
    }

    // ======================== 七、评论模块（Comment） ========================

    /** 契约: GET /api/submissions/{id}/comments — 获取评论列表 */
    @GetMapping("/api/submissions/{id}/comments")
    public ApiResponse<List<CommentResponseDTO>> listComments(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(commentService.listComments(id, page, size));
    }

    /** 契约: POST /api/submissions/{id}/comments — 发表评论 */
    @PostMapping("/api/submissions/{id}/comments")
    public ApiResponse<CommentResponseDTO> createComment(
            @PathVariable Long id,
            @RequestBody CommentRequest request) {
        request.setSubmissionId(id);
        return ApiResponse.success(commentService.createComment(request));
    }

    // ======================== 八、公告模块（Announcement） ========================

    /** 契约: GET /api/announcements — 获取公告列表 */
    @GetMapping("/api/announcements")
    public ApiResponse<List<AnnouncementResponseDTO>> listAnnouncements() {
        List<Announcement> announcements = announcementRepository.findByStatus(1);
        List<AnnouncementResponseDTO> dtos = announcements.stream()
                .filter(a -> a.getStatus() == 1)
                .sorted((a, b) -> {
                    int cmp = b.getPriority().compareTo(a.getPriority());
                    if (cmp != 0) return cmp;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .map(this::toAnnouncementDTO)
                .collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    // ======================== DTO 转换 ========================

    private AnnouncementResponseDTO toAnnouncementDTO(Announcement a) {
        AnnouncementResponseDTO dto = new AnnouncementResponseDTO();
        dto.setId(a.getId());
        dto.setTitle(a.getTitle());
        dto.setContent(a.getContent());
        dto.setCompetitionId(a.getCompetitionId());
        dto.setPriority(a.getPriority());
        dto.setStatus(a.getStatus());
        dto.setCreatedBy(a.getCreatedBy());
        dto.setCreatedAt(a.getCreatedAt());
        dto.setUpdatedAt(a.getUpdatedAt());

        if (a.getCompetitionId() != null) {
            competitionRepository.findById(a.getCompetitionId())
                    .ifPresent(c -> dto.setCompetitionTitle(c.getTitle()));
        }
        if (a.getCreatedBy() != null) {
            userRepository.findById(a.getCreatedBy())
                    .ifPresent(u -> dto.setCreatedByName(u.getNickname()));
        }
        return dto;
    }
}
