package com.hackathon.controller.auth;

import com.hackathon.dto.ApiResponse;
import com.hackathon.dto.AuthResponse;
import com.hackathon.dto.LoginRequest;
import com.hackathon.dto.RegisterRequest;
import com.hackathon.entity.User;
import com.hackathon.config.SecurityUtils;
import com.hackathon.service.auth.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SecurityUtils securityUtils;

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ApiResponse.success(authService.register(request));
    }

    /** 获取当前用户信息（契约 GET /api/auth/me） */
    @GetMapping("/me")
    public ApiResponse<AuthResponse> me() {
        User currentUser = securityUtils.getCurrentUser();
        return ApiResponse.success(authService.getCurrentUser(currentUser));
    }
}
