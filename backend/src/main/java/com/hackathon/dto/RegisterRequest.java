package com.hackathon.dto;

import lombok.Data;

@Data
public class RegisterRequest {

    private String username;
    private String password;
    private String nickname;
    private String email;
    private String role;
}
