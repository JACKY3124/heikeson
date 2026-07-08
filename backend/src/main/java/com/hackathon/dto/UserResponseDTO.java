package com.hackathon.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserResponseDTO {

    private Long id;
    private String username;
    private String nickname;
    private String email;
    private String avatar;
    private String role;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
