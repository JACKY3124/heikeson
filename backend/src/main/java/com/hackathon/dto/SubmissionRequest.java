package com.hackathon.dto;

import lombok.Data;

/**
 * @deprecated 选手提交作品请使用 {@link PlayerSubmissionRequest}
 */
@Data
public class SubmissionRequest {
    private Long competitionId;
    private Long teamId;
    private Long problemId;
    private String title;
    private String description;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
}
