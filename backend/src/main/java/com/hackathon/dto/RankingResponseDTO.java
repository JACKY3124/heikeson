package com.hackathon.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class RankingResponseDTO {

    private Integer rank;                // 契约: rank（排名）
    private String teamName;            // 契约: teamName
    private List<String> members;       // 契约: members（成员用户名列表）
    private BigDecimal totalScore;      // 契约: totalScore
    private BigDecimal aiScore;         // 契约: aiScore
    private BigDecimal expertScore;     // 契约: expertScore

    // 保留旧字段兼容
    private Long id;
    private Long competitionId;
    private String competitionTitle;
    private Long userId;
    private String username;
    private String nickname;
    private Long teamId;
    private Integer rankNo;
}
