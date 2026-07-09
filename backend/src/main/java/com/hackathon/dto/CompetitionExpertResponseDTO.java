package com.hackathon.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CompetitionExpertResponseDTO {

    private Long id;
    private Long competitionId;
    private String competitionTitle;
    private Long expertId;
    private String expertName;
    private String expertNickname;
    private LocalDateTime assignedAt;
}
