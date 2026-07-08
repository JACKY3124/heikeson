package com.hackathon.config;

import com.hackathon.entity.User;
import com.hackathon.exception.BusinessException;
import com.hackathon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;

    /**
     * 获取当前登录用户名（来自 JWT subject）
     */
    public String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessException("未登录", org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        return authentication.getName();
    }

    /**
     * 获取当前登录用户实体
     */
    public User getCurrentUser() {
        String username = getCurrentUsername();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在", org.springframework.http.HttpStatus.UNAUTHORIZED));
    }

    /**
     * 获取当前登录用户 ID
     */
    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    /**
     * 判断当前用户是否为指定角色
     */
    public boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role.toUpperCase()));
    }
}
