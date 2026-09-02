package com.hackathon.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 专家评分结果 DTO
 */
@Data
public class ExpertScoreResponseDTO {

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private Long id;
    private Long submissionId;
    private Long dimensionId;
    private String dimensionName;
    private Long expertId;
    private String expertName;
    private BigDecimal score;
    private String comment;
    private String updatedAt;
}
