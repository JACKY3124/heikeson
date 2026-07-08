package com.hackathon.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProblemResponseDTO {

    private Long id;
    private Long competitionId;
    private String problemId;
    private String title;
    private String description;
    private Integer score;
    private String difficulty;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
