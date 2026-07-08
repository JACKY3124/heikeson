package com.hackathon.controller.admin;

import com.hackathon.dto.ApiResponse;
import com.hackathon.dto.SubmissionResponseDTO;
import com.hackathon.service.submission.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 管理员端 · 作品管理接口
 * 所有接口要求 ROLE_ADMIN
 *
 * 路由前缀: /api/admin/submissions
 */
@RestController
@RequestMapping("/api/admin/submissions")
@RequiredArgsConstructor
public class AdminSubmissionController {

    private final SubmissionService submissionService;

    /** 查某赛事所有已提交作品 */
    @GetMapping("/competition/{competitionId}")
    public ApiResponse<List<SubmissionResponseDTO>> listByCompetition(@PathVariable Long competitionId) {
        return ApiResponse.success(submissionService.listByCompetition(competitionId));
    }

    /** 查某赛事所有作品（含草稿） */
    @GetMapping("/competition/{competitionId}/all")
    public ApiResponse<List<SubmissionResponseDTO>> listAllByCompetition(@PathVariable Long competitionId) {
        return ApiResponse.success(submissionService.listAllByCompetition(competitionId));
    }

    /** 查作品详情 */
    @GetMapping("/{id}")
    public ApiResponse<SubmissionResponseDTO> getDetail(@PathVariable Long id) {
        return ApiResponse.success(submissionService.getSubmissionDetail(id));
    }
}
