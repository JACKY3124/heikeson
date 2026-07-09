package com.hackathon.controller.admin;

import com.hackathon.dto.*;
import com.hackathon.service.admin.AdminMiscService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 管理员端 · 公告管理 + 专家分配管理接口
 * 所有接口要求 ROLE_ADMIN
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminMiscController {

    private final AdminMiscService adminMiscService;

    // ===== 公告管理 =====

    /** 创建公告 */
    @PostMapping("/announcements")
    public ApiResponse<AnnouncementResponseDTO> createAnnouncement(
            @Valid @RequestBody AnnouncementRequest request) {
        return ApiResponse.success(adminMiscService.createAnnouncement(request));
    }

    /** 编辑公告 */
    @PutMapping("/announcements/{id}")
    public ApiResponse<AnnouncementResponseDTO> updateAnnouncement(
            @PathVariable Long id,
            @RequestBody AnnouncementRequest request) {
        return ApiResponse.success(adminMiscService.updateAnnouncement(id, request));
    }

    /** 删除公告 */
    @DeleteMapping("/announcements/{id}")
    public ApiResponse<Void> deleteAnnouncement(@PathVariable Long id) {
        adminMiscService.deleteAnnouncement(id);
        return ApiResponse.success(null);
    }

    /** 获取公告详情 */
    @GetMapping("/announcements/{id}")
    public ApiResponse<AnnouncementResponseDTO> getAnnouncementDetail(@PathVariable Long id) {
        return ApiResponse.success(adminMiscService.getAnnouncementDetail(id));
    }

    /** 获取某赛事的公告列表 */
    @GetMapping("/announcements/competition/{competitionId}")
    public ApiResponse<List<AnnouncementResponseDTO>> listAnnouncementsByCompetition(
            @PathVariable Long competitionId) {
        return ApiResponse.success(adminMiscService.listAnnouncementsByCompetition(competitionId));
    }

    /** 获取所有公告列表 */
    @GetMapping("/announcements")
    public ApiResponse<List<AnnouncementResponseDTO>> listAllAnnouncements() {
        return ApiResponse.success(adminMiscService.listAllAnnouncements());
    }

    // ===== 专家分配管理 =====

    /** 为赛事分配专家 */
    @PostMapping("/competition-experts")
    public ApiResponse<CompetitionExpertResponseDTO> assignExpert(
            @Valid @RequestBody CompetitionExpertRequest request) {
        return ApiResponse.success(adminMiscService.assignExpert(request));
    }

    /** 移除赛事专家 */
    @DeleteMapping("/competition-experts")
    public ApiResponse<Void> removeExpert(
            @RequestParam Long competitionId,
            @RequestParam Long expertId) {
        adminMiscService.removeExpert(competitionId, expertId);
        return ApiResponse.success(null);
    }

    /** 查询赛事下所有专家 */
    @GetMapping("/competition-experts/competition/{competitionId}")
    public ApiResponse<List<CompetitionExpertResponseDTO>> listExpertsByCompetition(
            @PathVariable Long competitionId) {
        return ApiResponse.success(adminMiscService.listExpertsByCompetition(competitionId));
    }

    /** 获取所有可分配的专家列表 */
    @GetMapping("/experts/available")
    public ApiResponse<List<UserResponseDTO>> listAvailableExperts() {
        return ApiResponse.success(adminMiscService.listAvailableExperts());
    }
}
