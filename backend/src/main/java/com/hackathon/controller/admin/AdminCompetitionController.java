package com.hackathon.controller.admin;

import com.hackathon.dto.*;
import com.hackathon.service.admin.AdminCompetitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 管理员端 · 赛事管理接口
 * 所有接口要求 ROLE_ADMIN
 *
 * 路由前缀: /api/admin/competitions
 */
@RestController
@RequestMapping("/api/admin/competitions")
@RequiredArgsConstructor
public class AdminCompetitionController {

    private final AdminCompetitionService adminCompetitionService;

    // ===== 赛事 CRUD =====

    /** 创建赛事 */
    @PostMapping
    public ApiResponse<CompetitionResponseDTO> createCompetition(
            @Valid @RequestBody CompetitionCreateRequest request) {
        return ApiResponse.success(adminCompetitionService.createCompetition(request));
    }

    /** 编辑赛事 */
    @PutMapping("/{id}")
    public ApiResponse<CompetitionResponseDTO> updateCompetition(
            @PathVariable Long id,
            @RequestBody CompetitionUpdateRequest request) {
        return ApiResponse.success(adminCompetitionService.updateCompetition(id, request));
    }

    /** 变更赛事状态 */
    @PatchMapping("/{id}/status")
    public ApiResponse<CompetitionResponseDTO> changeStatus(
            @PathVariable Long id,
            @RequestBody CompetitionStatusRequest request) {
        return ApiResponse.success(adminCompetitionService.changeStatus(id, request));
    }

    /** 删除赛事 */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCompetition(@PathVariable Long id) {
        adminCompetitionService.deleteCompetition(id);
        return ApiResponse.success(null);
    }

    /** 获取赛事详情（含统计） */
    @GetMapping("/{id}")
    public ApiResponse<CompetitionResponseDTO> getCompetitionDetail(@PathVariable Long id) {
        return ApiResponse.success(adminCompetitionService.getCompetitionDetail(id));
    }

    /** 分页搜索赛事列表 */
    @GetMapping
    public ApiResponse<PageResponse<CompetitionResponseDTO>> listCompetitions(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(adminCompetitionService.listCompetitions(keyword, status, page, size));
    }

    /** 获取所有赛事（不分页） */
    @GetMapping("/all")
    public ApiResponse<List<CompetitionResponseDTO>> listAllCompetitions() {
        return ApiResponse.success(adminCompetitionService.listAllCompetitions());
    }

    // ===== 赛题管理 =====

    /** 为赛事添加赛题 */
    @PostMapping("/{competitionId}/problems")
    public ApiResponse<ProblemResponseDTO> addProblem(
            @PathVariable Long competitionId,
            @Valid @RequestBody ProblemRequest request) {
        return ApiResponse.success(adminCompetitionService.addProblem(competitionId, request));
    }

    /** 编辑赛题 */
    @PutMapping("/problems/{id}")
    public ApiResponse<ProblemResponseDTO> updateProblem(
            @PathVariable Long id,
            @Valid @RequestBody ProblemRequest request) {
        return ApiResponse.success(adminCompetitionService.updateProblem(id, request));
    }

    /** 删除赛题 */
    @DeleteMapping("/problems/{id}")
    public ApiResponse<Void> deleteProblem(@PathVariable Long id) {
        adminCompetitionService.deleteProblem(id);
        return ApiResponse.success(null);
    }

    /** 查赛事下所有赛题 */
    @GetMapping("/{competitionId}/problems")
    public ApiResponse<List<ProblemResponseDTO>> listProblems(@PathVariable Long competitionId) {
        return ApiResponse.success(adminCompetitionService.listProblems(competitionId));
    }
}
