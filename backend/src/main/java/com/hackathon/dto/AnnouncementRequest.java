package com.hackathon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AnnouncementRequest {

    @NotBlank(message = "标题不能为空")
    private String title;

    @NotBlank(message = "内容不能为空")
    private String content;

    private Long competitionId;

    private Integer priority;

    private Integer status;
}
