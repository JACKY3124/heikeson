package com.hackathon.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserRoleRequest {

    @NotNull(message = "角色不能为空")
    private String role; // player / expert / admin / spectator
}
