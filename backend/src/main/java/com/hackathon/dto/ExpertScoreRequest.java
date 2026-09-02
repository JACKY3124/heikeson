package com.hackathon.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 专家评分提交请求 DTO
 */
@Data
public class ExpertScoreRequest {

    @NotNull(message = "作品ID不能为空")
    private Long submissionId;

    @NotNull(message = "评分维度不能为空")
    private Long dimensionId;

    @NotNull(message = "分数不能为空")
    @DecimalMin(value = "0", message = "分数不能小于0")
    @DecimalMax(value = "100", message = "分数不能大于100")
    private BigDecimal score;

    /** 评审意见 */
    private String comment;
}
