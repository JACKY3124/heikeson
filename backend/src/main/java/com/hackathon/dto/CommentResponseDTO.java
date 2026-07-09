package com.hackathon.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Data
public class CommentResponseDTO {

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private Long id;
    private Long submissionId;
    private String content;
    private Long parentId;

    // 契约: user 对象（包含 id, username, nickname）
    private CommentUserInfo user;

    // 契约: createdAt 格式化
    private String createdAt;

    // 契约: likes 计数
    private Long likes;

    // 契约: 嵌套回复
    private List<CommentResponseDTO> replies;

    // 保留旧字段兼容
    private Long userId;
    private String nickname;
    private LocalDateTime createdAtRaw;

    @Data
    public static class CommentUserInfo {
        private Long id;
        private String username;
        private String nickname;
    }
}
