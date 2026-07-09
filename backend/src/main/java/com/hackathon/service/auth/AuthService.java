package com.hackathon.service.auth;

import com.hackathon.dto.AuthResponse;
import com.hackathon.dto.LoginRequest;
import com.hackathon.dto.RegisterRequest;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse register(RegisterRequest request);

    AuthResponse getCurrentUser(com.hackathon.entity.User user);
}
