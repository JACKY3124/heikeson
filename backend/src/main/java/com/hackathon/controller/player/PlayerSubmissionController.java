package com.hackathon.controller.player;

import com.hackathon.dto.ApiResponse;
import com.hackathon.dto.PlayerSubmissionRequest;
import com.hackathon.dto.SubmissionResponseDTO;
import com.hackathon.service.submission.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 选手端 · 作品提交接口
 * 所有接口要求 ROLE_PLAYER，userId 从 JWT 自动获取
 */
@RestController
@RequestMapping("/api/player/submissions")
@RequiredArgsConstructor
public class PlayerSubmissionController {

    private final SubmissionService submissionService;

    /** 创建草稿 */
    @PostMapping
    public ApiResponse<SubmissionResponseDTO> createDraft(@Valid @RequestBody PlayerSubmissionRequest request) {
        return ApiResponse.success(submissionService.createDraft(request));
    }

    /** 更新草稿（继续编辑） */
    @PutMapping("/{id}")
    public ApiResponse<SubmissionResponseDTO> updateDraft(@PathVariable Long id,
                                                           @RequestBody PlayerSubmissionRequest request) {
        return ApiResponse.success(submissionService.updateDraft(id, request));
    }

    /** 正式提交（draft → submitted） */
    @PutMapping("/{id}/submit")
    public ApiResponse<SubmissionResponseDTO> submit(@PathVariable Long id) {
        return ApiResponse.success(submissionService.submit(id));
    }

    /** 撤回已提交作品（submitted → draft），截止时间前可撤回 */
    @PutMapping("/{id}/withdraw")
    public ApiResponse<SubmissionResponseDTO> withdraw(@PathVariable Long id) {
        return ApiResponse.success(submissionService.withdraw(id));
    }

    /** 删除草稿（已提交的作品不可删除，需先撤回） */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDraft(@PathVariable Long id) {
        submissionService.deleteDraft(id);
        return ApiResponse.success(null);
    }

    /** 上传文件并关联到草稿 */
    @PostMapping("/{id}/file")
    public ApiResponse<SubmissionResponseDTO> uploadFile(@PathVariable Long id,
                                                          @RequestParam("file") MultipartFile file) {
        return ApiResponse.success(submissionService.uploadFileToSubmission(id, file));
    }

    /** 查我的所有作品 */
    @GetMapping("/me")
    public ApiResponse<List<SubmissionResponseDTO>> listMySubmissions() {
        return ApiResponse.success(submissionService.listMySubmissions());
    }

    /** 查我在某赛事的作品 */
    @GetMapping("/competition/{competitionId}")
    public ApiResponse<List<SubmissionResponseDTO>> listByCompetition(@PathVariable Long competitionId) {
        return ApiResponse.success(submissionService.listMySubmissionsByCompetition(competitionId));
    }

    /** 查作品详情 */
    @GetMapping("/{id}")
    public ApiResponse<SubmissionResponseDTO> getDetail(@PathVariable Long id) {
        return ApiResponse.success(submissionService.getSubmissionDetail(id));
    }
}
