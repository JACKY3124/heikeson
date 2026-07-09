package com.hackathon.dto;

import lombok.Data;

@Data
public class AuthResponse {

    private Long id;           // 契约: 注册/登录返回 id
    private String token;
    private String username;
    private String nickname;
    private String role;
    private String email;      // 契约: /auth/me 返回 email
    private String createdAt;  // 契约: 注册返回 createdAt (格式 yyyy-MM-dd HH:mm:ss)
}
