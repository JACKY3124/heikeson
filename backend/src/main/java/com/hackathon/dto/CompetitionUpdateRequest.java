package com.hackathon.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CompetitionUpdateRequest {

    private String title;
    private String description;
    private String coverImage;
    private String rules;
    private String competitionType;
    private String status;
    private LocalDateTime registerStart;
    private LocalDateTime registerEnd;
    private LocalDateTime submitStart;
    private LocalDateTime submitEnd;
}
