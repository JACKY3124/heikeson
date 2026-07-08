package com.hackathon.controller.player;

import com.hackathon.dto.ApiResponse;
import com.hackathon.dto.LikeResponseDTO;
import com.hackathon.service.like.LikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 选手端 · 点赞接口（toggle 模式：重复调用自动切换）
 */
@RestController
@RequestMapping("/api/player/submissions/{submissionId}/like")
@RequiredArgsConstructor
public class PlayerLikeController {

    private final LikeService likeService;

    /** 点赞/取消点赞（toggle） */
    @PostMapping
    public ApiResponse<LikeResponseDTO> toggleLike(@PathVariable Long submissionId) {
        return ApiResponse.success(likeService.toggleLike(submissionId));
    }

    /** 查询当前用户对该作品的点赞状态 */
    @GetMapping
    public ApiResponse<LikeResponseDTO> getLikeStatus(@PathVariable Long submissionId) {
        return ApiResponse.success(likeService.getLikeStatus(submissionId));
    }
}
