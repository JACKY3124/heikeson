package com.hackathon.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AnnouncementResponseDTO {

    private Long id;
    private String title;
    private String content;
    private Long competitionId;
    private String competitionTitle;
    private Integer priority;
    private Integer status;
    private Long createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
