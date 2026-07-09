package com.hackathon.controller.admin;

import com.hackathon.dto.ApiResponse;
import com.hackathon.dto.RegistrationResponseDTO;
import com.hackathon.service.registration.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 管理员端 · 报名管理接口
 * 所有接口要求 ROLE_ADMIN
 *
 * 路由前缀: /api/admin/registrations
 */
@RestController
@RequestMapping("/api/admin/registrations")
@RequiredArgsConstructor
public class AdminRegistrationController {

    private final RegistrationService registrationService;

    /** 查某赛事所有报名列表 */
    @GetMapping("/competition/{competitionId}")
    public ApiResponse<List<RegistrationResponseDTO>> listByCompetition(@PathVariable Long competitionId) {
        return ApiResponse.success(registrationService.listByCompetition(competitionId));
    }

    /** 查某赛事已通过/待审核/已拒绝的报名列表 */
    @GetMapping("/competition/{competitionId}/status/{status}")
    public ApiResponse<List<RegistrationResponseDTO>> listByCompetitionAndStatus(
            @PathVariable Long competitionId,
            @PathVariable String status) {
        return ApiResponse.success(registrationService.listByCompetitionAndStatus(competitionId, status));
    }

    /** 审批通过报名 */
    @PutMapping("/{id}/approve")
    public ApiResponse<RegistrationResponseDTO> approve(@PathVariable Long id) {
        return ApiResponse.success(registrationService.approveOrReject(id, "approved"));
    }

    /** 审批拒绝报名 */
    @PutMapping("/{id}/reject")
    public ApiResponse<RegistrationResponseDTO> reject(@PathVariable Long id) {
        return ApiResponse.success(registrationService.approveOrReject(id, "rejected"));
    }

    /** 批量审批通过 */
    @PutMapping("/batch/approve")
    public ApiResponse<List<RegistrationResponseDTO>> batchApprove(@RequestBody List<Long> ids) {
        List<RegistrationResponseDTO> results = ids.stream()
                .map(id -> registrationService.approveOrReject(id, "approved"))
                .toList();
        return ApiResponse.success(results);
    }

    /** 批量审批拒绝 */
    @PutMapping("/batch/reject")
    public ApiResponse<List<RegistrationResponseDTO>> batchReject(@RequestBody List<Long> ids) {
        List<RegistrationResponseDTO> results = ids.stream()
                .map(id -> registrationService.approveOrReject(id, "rejected"))
                .toList();
        return ApiResponse.success(results);
    }
}
