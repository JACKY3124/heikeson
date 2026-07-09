package com.hackathon.controller.publicapi;

import com.hackathon.dto.*;
import com.hackathon.entity.Competition;
import com.hackathon.entity.Announcement;
import com.hackathon.repository.AnnouncementRepository;
import com.hackathon.repository.CompetitionRepository;
import com.hackathon.repository.UserRepository;
import com.hackathon.service.comment.CommentService;
import com.hackathon.service.like.LikeService;
import com.hackathon.service.team.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 公开接口（无需登录）
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final CompetitionRepository competitionRepository;
    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;
    private final CommentService commentService;
    private final LikeService likeService;
    private final TeamService teamService;

    // ======================== 赛事公开查询 ========================

    /** 赛事列表 */
    @GetMapping("/competitions")
    public ApiResponse<List<CompetitionResponseDTO>> listCompetitions(
            @RequestParam(required = false) String status) {
        List<Competition> competitions;
        if (status != null) {
            competitions = competitionRepository.findByStatus(status);
        } else {
            competitions = competitionRepository.findAll();
        }
        List<CompetitionResponseDTO> dtos = competitions.stream().map(c -> {
            CompetitionResponseDTO dto = new CompetitionResponseDTO();
            dto.setId(c.getId());
            dto.setTitle(c.getTitle());
            dto.setDescription(c.getDescription());
            dto.setCoverImage(c.getCoverImage());
            dto.setRules(c.getRules());
            dto.setCompetitionType(c.getCompetitionType());
            dto.setStatus(c.getStatus());
            dto.fillContractFields(c.getRegisterStart(), c.getRegisterEnd(),
                    c.getSubmitStart(), c.getSubmitEnd(),
                    c.getCreatedAt(), c.getUpdatedAt());
            dto.setMinTeamSize(c.getMinTeamSize());
            dto.setMaxTeamSize(c.getMaxTeamSize());
            dto.setMaxParticipants(c.getMaxParticipants());
            dto.setIsVirtual(c.getIsVirtual());
            dto.setLocation(c.getLocation());
            return dto;
        }).collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    /** 赛事详情 */
    @GetMapping("/competitions/{id}")
    public ApiResponse<CompetitionResponseDTO> getCompetition(@PathVariable Long id) {
        Competition c = competitionRepository.findById(id)
                .orElseThrow(() -> new com.hackathon.exception.BusinessException("赛事不存在"));
        CompetitionResponseDTO dto = new CompetitionResponseDTO();
        dto.setId(c.getId());
        dto.setTitle(c.getTitle());
        dto.setDescription(c.getDescription());
        dto.setCoverImage(c.getCoverImage());
        dto.setRules(c.getRules());
        dto.setCompetitionType(c.getCompetitionType());
        dto.setStatus(c.getStatus());
        dto.fillContractFields(c.getRegisterStart(), c.getRegisterEnd(),
                c.getSubmitStart(), c.getSubmitEnd(),
                c.getCreatedAt(), c.getUpdatedAt());
        dto.setMinTeamSize(c.getMinTeamSize());
        dto.setMaxTeamSize(c.getMaxTeamSize());
        dto.setMaxParticipants(c.getMaxParticipants());
        dto.setIsVirtual(c.getIsVirtual());
        dto.setLocation(c.getLocation());
        return ApiResponse.success(dto);
    }

    /** 赛事下队伍列表 */
    @GetMapping("/competitions/{id}/teams")
    public ApiResponse<List<TeamResponseDTO>> listTeams(@PathVariable Long id) {
        return ApiResponse.success(teamService.listTeamsByCompetition(id));
    }

    // ======================== 评论公开查询 ========================

    /** 作品评论列表 */
    @GetMapping("/submissions/{submissionId}/comments")
    public ApiResponse<List<CommentResponseDTO>> listComments(
            @PathVariable Long submissionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(commentService.listComments(submissionId, page, size));
    }

    // ======================== 点赞公开查询 ========================

    /** 作品点赞数（无需登录） */
    @GetMapping("/submissions/{submissionId}/likes")
    public ApiResponse<LikeResponseDTO> getLikeCount(@PathVariable Long submissionId) {
        LikeResponseDTO dto = new LikeResponseDTO();
        dto.setSubmissionId(submissionId);
        dto.setLikeCount(likeService.getLikeCount(submissionId));
        return ApiResponse.success(dto);
    }

    // ======================== 公告公开查询 ========================

    /** 公告列表（按优先级+时间倒序） */
    @GetMapping("/announcements")
    public ApiResponse<List<AnnouncementResponseDTO>> listAnnouncements(
            @RequestParam(required = false) Long competitionId) {
        List<Announcement> announcements;
        if (competitionId != null) {
            announcements = announcementRepository.findByCompetitionId(competitionId);
        } else {
            announcements = announcementRepository.findByStatus(1);
        }
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

    /** 公告详情 */
    @GetMapping("/announcements/{id}")
    public ApiResponse<AnnouncementResponseDTO> getAnnouncement(@PathVariable Long id) {
        Announcement a = announcementRepository.findById(id)
                .orElseThrow(() -> new com.hackathon.exception.BusinessException("公告不存在"));
        return ApiResponse.success(toAnnouncementDTO(a));
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
        userRepository.findById(a.getCreatedBy())
                .ifPresent(u -> dto.setCreatedByName(u.getNickname()));

        return dto;
    }
}
