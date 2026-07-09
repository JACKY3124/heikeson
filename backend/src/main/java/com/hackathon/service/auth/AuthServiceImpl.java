package com.hackathon.service.auth;

import com.hackathon.dto.AuthResponse;
import com.hackathon.dto.LoginRequest;
import com.hackathon.dto.RegisterRequest;
import com.hackathon.entity.User;
import com.hackathon.exception.BusinessException;
import com.hackathon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("用户不存在", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("密码错误", HttpStatus.UNAUTHORIZED);
        }

        return toAuthResponse(user);
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new BusinessException("用户名已存在");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNickname(request.getNickname() != null ? request.getNickname() : request.getUsername());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole() != null ? request.getRole() : "player");
        user.setStatus(1);

        userRepository.save(user);

        return toAuthResponse(user);
    }

    /** 获取当前用户信息（契约 /api/auth/me） */
    public AuthResponse getCurrentUser(User user) {
        return toAuthResponse(user);
    }

    private AuthResponse toAuthResponse(User user) {
        AuthResponse response = new AuthResponse();
        response.setId(user.getId());
        response.setToken(jwtService.generateToken(user.getUsername(), user.getRole()));
        response.setUsername(user.getUsername());
        response.setNickname(user.getNickname());
        response.setRole(user.getRole());
        response.setEmail(user.getEmail());
        response.setCreatedAt(user.getCreatedAt() != null ? user.getCreatedAt().format(DTF) : null);
        return response;
    }
}
