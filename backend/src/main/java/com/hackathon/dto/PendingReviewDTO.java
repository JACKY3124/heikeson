package com.hackathon.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 专家待评审作品 DTO
 */
@Data
public class PendingReviewDTO {

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private Long submissionId;
    private Long competitionId;
    private String competitionTitle;
    private String title;
    private String description;
    private String fileName;
    private String fileUrl;
    private Long teamId;
    private String teamName;
    private String authorName;
    private String submittedAt;

    /** 该赛事的评分维度数量 */
    private Integer dimensionCount;

    /** 当前专家已评的维度数量 */
    private Integer scoredDimensions;

    /** 当前专家的加权总分（未评完时为null） */
    private BigDecimal myWeightedScore;

    /** 是否已完成评审 */
    private Boolean reviewCompleted;
}
