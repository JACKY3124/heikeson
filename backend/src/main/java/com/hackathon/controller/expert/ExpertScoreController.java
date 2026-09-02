package com.hackathon.controller.expert;

import com.hackathon.dto.ApiResponse;
import com.hackathon.dto.AiScoreResponseDTO;
import com.hackathon.dto.ExpertScoreRequest;
import com.hackathon.dto.ExpertScoreResponseDTO;
import com.hackathon.dto.PendingReviewDTO;
import com.hackathon.service.scoring.AiScoringService;
import com.hackathon.service.scoring.ExpertScoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 专家端 · 评审打分接口
 * 所有接口要求 ROLE_EXPERT
 *
 * 路由前缀: /api/expert
 */
@RestController
@RequestMapping("/api/expert")
@RequiredArgsConstructor
public class ExpertScoreController {

    private final ExpertScoreService expertScoreService;
    private final AiScoringService aiScoringService;

    /** 我的待评审作品列表（按管理员分配的赛事过滤） */
    @GetMapping("/reviews")
    public ApiResponse<List<PendingReviewDTO>> listMyReviews() {
        return ApiResponse.success(expertScoreService.listMyReviews());
    }

    /** 提交/更新评分（同一作品同一维度重复提交视为修改） */
    @PostMapping("/scores")
    public ApiResponse<ExpertScoreResponseDTO> submitScore(@Valid @RequestBody ExpertScoreRequest request) {
        return ApiResponse.success(expertScoreService.submitScore(request));
    }

    /** 查询我对某作品的全部评分 */
    @GetMapping("/submissions/{submissionId}/my-scores")
    public ApiResponse<List<ExpertScoreResponseDTO>> getMyScores(@PathVariable Long submissionId) {
        return ApiResponse.success(expertScoreService.getMyScoresForSubmission(submissionId));
    }

    /** 查询某作品的全部专家评分（所有专家） */
    @GetMapping("/submissions/{submissionId}/scores")
    public ApiResponse<List<ExpertScoreResponseDTO>> getAllScores(@PathVariable Long submissionId) {
        return ApiResponse.success(expertScoreService.getScoresForSubmission(submissionId));
    }

    /** 查询某作品的AI评分明细（供专家参考） */
    @GetMapping("/submissions/{submissionId}/ai-scores")
    public ApiResponse<List<AiScoreResponseDTO>> getAiScores(@PathVariable Long submissionId) {
        return ApiResponse.success(aiScoringService.getAiScores(submissionId));
    }
}
