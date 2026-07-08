package com.hackathon.controller.player;

import com.hackathon.dto.ApiResponse;
import com.hackathon.dto.CommentRequest;
import com.hackathon.dto.CommentResponseDTO;
import com.hackathon.service.comment.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 选手端 · 评论接口
 */
@RestController
@RequestMapping("/api/player/comments")
@RequiredArgsConstructor
public class PlayerCommentController {

    private final CommentService commentService;

    /** 发表评论 */
    @PostMapping
    public ApiResponse<CommentResponseDTO> createComment(@Valid @RequestBody CommentRequest request) {
        return ApiResponse.success(commentService.createComment(request));
    }

    /** 删除评论（仅评论者本人） */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return ApiResponse.success(null);
    }
}
