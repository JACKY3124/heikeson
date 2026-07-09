package com.hackathon.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CompetitionExpertRequest {

    @NotNull(message = "赛事ID不能为空")
    private Long competitionId;

    @NotNull(message = "专家ID不能为空")
    private Long expertId;
}
