package com.hackathon.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TeamMemberResponseDTO {

    private Long id;
    private Long teamId;
    private Long userId;
    private String nickname;
    private String avatar;
    private String role;
    private LocalDateTime joinedAt;
}
