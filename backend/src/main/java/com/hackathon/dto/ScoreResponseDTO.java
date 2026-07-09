package com.hackathon.dto;

import lombok.Data;

import java.util.List;

@Data
public class ScoreResponseDTO {

    private Long submissionId;
    private Double aiScore;
    private Double expertScore;
    private Double totalScore;
    private List<ScoreDetailDTO> aiDetails;
    private List<ScoreDetailDTO> expertDetails;

    @Data
    public static class ScoreDetailDTO {
        private String dimension;
        private Double score;
        private String comment;  // 专家评分有 comment
    }
}
