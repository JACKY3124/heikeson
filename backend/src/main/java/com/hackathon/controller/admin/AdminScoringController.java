package com.hackathon.controller.admin;

import com.hackathon.dto.ApiResponse;
import com.hackathon.dto.AiScoreResponseDTO;
import com.hackathon.dto.ExpertScoreResponseDTO;
import com.hackathon.dto.RankingResponseDTO;
import com.hackathon.dto.SubmissionResponseDTO;
import com.hackathon.entity.ScoreDimension;
import com.hackathon.repository.ScoreDimensionRepository;
import com.hackathon.exception.BusinessException;
import com.hackathon.service.ranking.RankingService;
import com.hackathon.service.scoring.AiScoringService;
import com.hackathon.service.scoring.ExpertScoreService;
import com.hackathon.service.submission.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 管理员端 · 打分与榜单管理接口
 * 所有接口要求 ROLE_ADMIN
 *
 * 路由前缀: /api/admin
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminScoringController {

    private final AiScoringService aiScoringService;
    private final ExpertScoreService expertScoreService;
    private final RankingService rankingService;
    private final SubmissionService submissionService;
    private final ScoreDimensionRepository scoreDimensionRepository;

    // ==================== AI打分 ====================

    /** 手动触发某作品的AI打分（幂等，重复执行重新计算） */
    @PostMapping("/submissions/{id}/ai-score")
    public ApiResponse<List<AiScoreResponseDTO>> runAiScore(@PathVariable Long id) {
        return ApiResponse.success(aiScoringService.runAIScoring(id));
    }

    /** 查看某作品的AI评分明细 */
    @GetMapping("/submissions/{id}/ai-scores")
    public ApiResponse<List<AiScoreResponseDTO>> getAiScores(@PathVariable Long id) {
        return ApiResponse.success(aiScoringService.getAiScores(id));
    }

    /** 查看某作品的全部专家评分 */
    @GetMapping("/submissions/{id}/scores")
    public ApiResponse<List<ExpertScoreResponseDTO>> getExpertScores(@PathVariable Long id) {
        return ApiResponse.success(expertScoreService.getScoresForSubmission(id));
    }

    // ==================== 作品审批 ====================

    /** 作品审批：通过/驳回（status: submitted → approved / rejected） */
    @PatchMapping("/submissions/{id}/review")
    public ApiResponse<SubmissionResponseDTO> reviewSubmission(@PathVariable Long id,
                                                               @RequestBody Map<String, String> body) {
        String decision = body.get("decision");
        if (!"approved".equals(decision) && !"rejected".equals(decision)) {
            throw new BusinessException("decision 仅支持 approved / rejected");
        }
        return ApiResponse.success(submissionService.reviewSubmission(id, decision));
    }

    // ==================== 榜单生成 ====================

    /** 生成某赛事的榜单（汇总AI分+专家分加权排名，幂等可重复执行） */
    @PostMapping("/competitions/{competitionId}/rankings/generate")
    public ApiResponse<List<RankingResponseDTO>> generateRankings(@PathVariable Long competitionId) {
        return ApiResponse.success(rankingService.generateRanking(competitionId));
    }

    /** 查看某赛事当前榜单 */
    @GetMapping("/competitions/{competitionId}/rankings")
    public ApiResponse<List<RankingResponseDTO>> getRankings(@PathVariable Long competitionId) {
        return ApiResponse.success(rankingService.listCompetitionRanking(competitionId));
    }

    // ==================== 评分维度管理 ====================

    /** 查看某赛事的评分维度列表 */
    @GetMapping("/competitions/{competitionId}/dimensions")
    public ApiResponse<List<ScoreDimension>> listDimensions(@PathVariable Long competitionId) {
        return ApiResponse.success(scoreDimensionRepository.findByCompetitionId(competitionId));
    }

    /** 创建评分维度 */
    @PostMapping("/competitions/{competitionId}/dimensions")
    public ApiResponse<ScoreDimension> createDimension(@PathVariable Long competitionId,
                                                       @RequestBody ScoreDimension dimension) {
        dimension.setId(null);
        dimension.setCompetitionId(competitionId);
        return ApiResponse.success(scoreDimensionRepository.save(dimension));
    }

    /** 更新评分维度 */
    @PutMapping("/dimensions/{id}")
    public ApiResponse<ScoreDimension> updateDimension(@PathVariable Long id,
                                                       @RequestBody ScoreDimension dimension) {
        ScoreDimension existing = scoreDimensionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("评分维度不存在"));
        if (dimension.getName() != null) existing.setName(dimension.getName());
        if (dimension.getWeight() != null) existing.setWeight(dimension.getWeight());
        if (dimension.getMaxScore() != null) existing.setMaxScore(dimension.getMaxScore());
        if (dimension.getDescription() != null) existing.setDescription(dimension.getDescription());
        if (dimension.getSortOrder() != null) existing.setSortOrder(dimension.getSortOrder());
        return ApiResponse.success(scoreDimensionRepository.save(existing));
    }

    /** 删除评分维度 */
    @DeleteMapping("/dimensions/{id}")
    public ApiResponse<Void> deleteDimension(@PathVariable Long id) {
        if (!scoreDimensionRepository.existsById(id)) {
            throw new BusinessException("评分维度不存在");
        }
        scoreDimensionRepository.deleteById(id);
        return ApiResponse.success(null);
    }
}
