package com.hackathon.dto;

import lombok.Data;

@Data
public class RegisterRequest {

    private String username;
    private String password;
    private String nickname;
    private String email;
    // [安全] Bug-008：已移除 role 字段——客户端不允许指定注册角色，注册一律为 player
}
