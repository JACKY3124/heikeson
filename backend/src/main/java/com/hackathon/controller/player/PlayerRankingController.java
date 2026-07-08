package com.hackathon.controller.player;

import com.hackathon.dto.ApiResponse;
import com.hackathon.dto.RankingResponseDTO;
import com.hackathon.service.ranking.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 选手端 · 成绩查询接口
 * 所有接口要求 ROLE_PLAYER，userId 从 JWT 自动获取
 */
@RestController
@RequestMapping("/api/player/rankings")
@RequiredArgsConstructor
public class PlayerRankingController {

    private final RankingService rankingService;

    /** 查我所有赛事的成绩 */
    @GetMapping("/me")
    public ApiResponse<List<RankingResponseDTO>> listMyRankings() {
        return ApiResponse.success(rankingService.listMyRankings());
    }

    /** 查我在某赛事的成绩排名 */
    @GetMapping("/competition/{competitionId}")
    public ApiResponse<RankingResponseDTO> getMyRanking(@PathVariable Long competitionId) {
        return ApiResponse.success(rankingService.getMyRanking(competitionId));
    }
}
