package com.hackathon.service.like;

import com.hackathon.config.SecurityUtils;
import com.hackathon.dto.LikeResponseDTO;
import com.hackathon.entity.LikeRecord;
import com.hackathon.entity.Submission;
import com.hackathon.exception.BusinessException;
import com.hackathon.repository.LikeRecordRepository;
import com.hackathon.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class LikeService {

    private final LikeRecordRepository likeRecordRepository;
    private final SubmissionRepository submissionRepository;
    private final SecurityUtils securityUtils;

    // ======================== 点赞/取消点赞（toggle） ========================

    @Transactional
    public LikeResponseDTO toggleLike(Long submissionId) {
        Long userId = securityUtils.getCurrentUserId();

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new BusinessException("作品不存在"));

        if (!"submitted".equals(submission.getStatus())) {
            throw new BusinessException("作品未提交，不可点赞");
        }

        Optional<LikeRecord> existing = likeRecordRepository.findBySubmissionIdAndUserId(submissionId, userId);

        LikeResponseDTO response = new LikeResponseDTO();
        response.setSubmissionId(submissionId);

        if (existing.isPresent()) {
            // 已点赞 → 取消
            likeRecordRepository.delete(existing.get());
            response.setLiked(false);
            log.info("选手 {} 取消点赞作品 {}", userId, submissionId);
        } else {
            // 未点赞 → 点赞
            LikeRecord record = new LikeRecord();
            record.setSubmissionId(submissionId);
            record.setUserId(userId);
            likeRecordRepository.save(record);
            response.setLiked(true);
            log.info("选手 {} 点赞作品 {}", userId, submissionId);
        }

        response.setLikeCount(likeRecordRepository.countBySubmissionId(submissionId));
        return response;
    }

    // ======================== 查询点赞状态 ========================

    public LikeResponseDTO getLikeStatus(Long submissionId) {
        Long userId = securityUtils.getCurrentUserId();

        LikeResponseDTO response = new LikeResponseDTO();
        response.setSubmissionId(submissionId);
        response.setLikeCount(likeRecordRepository.countBySubmissionId(submissionId));
        response.setLiked(likeRecordRepository.findBySubmissionIdAndUserId(submissionId, userId).isPresent());

        return response;
    }

    // ======================== 公开查询点赞数（无需登录） ========================

    public long getLikeCount(Long submissionId) {
        return likeRecordRepository.countBySubmissionId(submissionId);
    }
}
