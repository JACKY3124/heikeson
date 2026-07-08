package com.hackathon.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TeamResponseDTO {

    private Long id;
    private String name;
    private String description;
    private Long competitionId;
    private String competitionTitle;
    private Long captainId;
    private String captainNickname;
    private Integer status;
    private Integer memberCount;
    private Integer maxMembers;
    private List<TeamMemberResponseDTO> members;
    private LocalDateTime createdAt;
}
