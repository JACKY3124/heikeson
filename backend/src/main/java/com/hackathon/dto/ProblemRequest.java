package com.hackathon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProblemRequest {

    @NotBlank(message = "赛题编号不能为空")
    private String problemId;

    @NotBlank(message = "赛题标题不能为空")
    private String title;

    private String description;

    @NotNull(message = "分数不能为空")
    private Integer score;

    private String difficulty; // easy / medium / hard

    private Integer sortOrder;
}
