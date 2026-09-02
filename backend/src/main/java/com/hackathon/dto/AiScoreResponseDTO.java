package com.hackathon.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * AI评分结果 DTO
 */
@Data
public class AiScoreResponseDTO {

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private Long id;
    private Long submissionId;
    private Long dimensionId;
    private String dimensionName;
    private BigDecimal dimensionWeight;
    private BigDecimal score;
    private String detail;
    private String createdAt;
}
