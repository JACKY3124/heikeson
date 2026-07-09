package com.hackathon.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SubmissionResponseDTO {

    private Long id;
    private Long userId;
    private String username;
    private String nickname;          // 新增：用户昵称
    private Long competitionId;
    private String competitionTitle;
    private Long teamId;
    private String teamName;          // 新增：团队名
    private Long problemId;
    private String problemTitle;      // 新增：赛题标题
    private String problemDifficulty; // 新增：赛题难度
    private String title;
    private String description;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private String status;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** 统计字段 */
    private long commentCount;
    private long likeCount;
    private boolean liked;          // 当前登录用户是否已点赞
}
