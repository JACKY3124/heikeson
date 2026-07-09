package com.hackathon.service.comment;

import com.hackathon.config.SecurityUtils;
import com.hackathon.dto.CommentRequest;
import com.hackathon.dto.CommentResponseDTO;
import com.hackathon.entity.Comment;
import com.hackathon.entity.Submission;
import com.hackathon.entity.User;
import com.hackathon.exception.BusinessException;
import com.hackathon.repository.CommentRepository;
import com.hackathon.repository.SubmissionRepository;
import com.hackathon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    // ======================== 发表评论 ========================

    @Transactional
    public CommentResponseDTO createComment(CommentRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Long userId = currentUser.getId();

        Submission submission = submissionRepository.findById(request.getSubmissionId())
                .orElseThrow(() -> new BusinessException("作品不存在"));

        // 作品必须已提交才能评论
        if (!"submitted".equals(submission.getStatus())) {
            throw new BusinessException("作品未提交，不可评论");
        }

        // 不能评论自己的作品
        if (submission.getUserId().equals(userId)) {
            throw new BusinessException("不能评论自己的作品");
        }

        // 如果有父评论，校验存在且属于同一作品
        if (request.getParentId() != null) {
            Comment parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new BusinessException("父评论不存在"));
            if (!parent.getSubmissionId().equals(request.getSubmissionId())) {
                throw new BusinessException("父评论与作品不匹配");
            }
        }

        Comment comment = new Comment();
        comment.setSubmissionId(request.getSubmissionId());
        comment.setUserId(userId);
        comment.setContent(request.getContent());
        comment.setParentId(request.getParentId());
        comment = commentRepository.save(comment);

        log.info("选手 {} 评论作品 {}", userId, request.getSubmissionId());
        return toDTO(comment);
    }

    // ======================== 查询作品评论列表 ========================

    public List<CommentResponseDTO> listComments(Long submissionId, int page, int size) {
        submissionRepository.findById(submissionId)
                .orElseThrow(() -> new BusinessException("作品不存在"));

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        Page<Comment> commentPage = commentRepository.findBySubmissionIdOrderByCreatedAtAsc(submissionId, pageRequest);

        List<CommentResponseDTO> allComments = commentPage.getContent().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        // 构建树形结构（顶级评论 + 回复）
        List<CommentResponseDTO> topLevel = allComments.stream()
                .filter(c -> c.getParentId() == null)
                .collect(Collectors.toList());

        for (CommentResponseDTO top : topLevel) {
            List<CommentResponseDTO> replies = allComments.stream()
                    .filter(c -> top.getId().equals(c.getParentId()))
                    .collect(Collectors.toList());
            top.setReplies(replies);
        }

        return topLevel;
    }

    // ======================== 删除评论 ========================

    @Transactional
    public void deleteComment(Long commentId) {
        Long userId = securityUtils.getCurrentUserId();

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException("评论不存在"));

        if (!comment.getUserId().equals(userId)) {
            throw new BusinessException("只能删除自己的评论");
        }

        // 删除子评论（如果有）
        List<Comment> childComments = commentRepository.findBySubmissionIdOrderByCreatedAtAsc(
                comment.getSubmissionId(), PageRequest.of(0, Integer.MAX_VALUE))
                .getContent()
                .stream()
                .filter(c -> commentId.equals(c.getParentId()))
                .collect(Collectors.toList());

        if (!childComments.isEmpty()) {
            commentRepository.deleteAll(childComments);
        }

        commentRepository.delete(comment);
        log.info("评论 {} 已删除", commentId);
    }

    // ======================== DTO 转换 ========================

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private CommentResponseDTO toDTO(Comment comment) {
        CommentResponseDTO dto = new CommentResponseDTO();
        dto.setId(comment.getId());
        dto.setSubmissionId(comment.getSubmissionId());
        dto.setContent(comment.getContent());
        dto.setParentId(comment.getParentId());
        dto.setCreatedAtRaw(comment.getCreatedAt());
        dto.setCreatedAt(comment.getCreatedAt() != null ? comment.getCreatedAt().format(DTF) : null);

        // 契约: user 对象
        userRepository.findById(comment.getUserId())
                .ifPresent(u -> {
                    CommentResponseDTO.CommentUserInfo userInfo = new CommentResponseDTO.CommentUserInfo();
                    userInfo.setId(u.getId());
                    userInfo.setUsername(u.getUsername());
                    userInfo.setNickname(u.getNickname());
                    dto.setUser(userInfo);
                    // 旧接口兼容
                    dto.setNickname(u.getNickname());
                });

        // 旧接口兼容
        dto.setUserId(comment.getUserId());

        return dto;
    }
}
