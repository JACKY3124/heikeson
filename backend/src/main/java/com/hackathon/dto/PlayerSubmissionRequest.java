package com.hackathon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PlayerSubmissionRequest {

    @NotBlank(message = "赛事ID不能为空")
    private String competitionId;     // 前端传 String，内部转 Long

    private Long teamId;              // 团队赛时需要

    private Long problemId;           // 赛题ID

    @NotBlank(message = "作品标题不能为空")
    @Size(max = 200, message = "标题最长200字")
    private String title;

    @Size(max = 5000, message = "描述最长5000字")
    private String description;

    private String fileName;          // 文件名（上传后自动填充）
    private String fileUrl;           // 文件URL（上传后自动填充）
    private Long fileSize;            // 文件大小（上传后自动填充）
}
