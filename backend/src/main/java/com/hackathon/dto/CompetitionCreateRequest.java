package com.hackathon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CompetitionCreateRequest {

    @NotBlank(message = "赛事标题不能为空")
    private String title;

    private String description;

    private String coverImage;

    private String rules;

    private String competitionType; // individual / team, 默认 individual

    private String status; // pending / ongoing / finished / cancelled, 默认 pending

    @NotNull(message = "报名开始时间不能为空")
    private LocalDateTime registerStart;

    @NotNull(message = "报名截止时间不能为空")
    private LocalDateTime registerEnd;

    @NotNull(message = "提交开始时间不能为空")
    private LocalDateTime submitStart;

    @NotNull(message = "提交截止时间不能为空")
    private LocalDateTime submitEnd;
}
