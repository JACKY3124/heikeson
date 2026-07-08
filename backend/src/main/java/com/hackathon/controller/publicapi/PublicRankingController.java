package com.hackathon.controller.publicapi;

import com.hackathon.dto.ApiResponse;
import com.hackathon.dto.RankingResponseDTO;
import com.hackathon.service.ranking.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 公开接口 · 排行榜（无需登录）
 */
@RestController
@RequestMapping("/api/public/rankings")
@RequiredArgsConstructor
public class PublicRankingController {

    private final RankingService rankingService;

    /** 查某赛事排行榜 */
    @GetMapping("/competition/{competitionId}")
    public ApiResponse<List<RankingResponseDTO>> listCompetitionRanking(@PathVariable Long competitionId) {
        return ApiResponse.success(rankingService.listCompetitionRanking(competitionId));
    }
}
