package com.hackathon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TeamRequest {

    @NotBlank(message = "队伍名称不能为空")
    @Size(max = 100, message = "队伍名称最多100字")
    private String name;

    @NotNull(message = "赛事ID不能为空")
    private Long competitionId;

    @Size(max = 500, message = "队伍简介最多500字")
    private String description;
}
