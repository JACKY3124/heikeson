package com.hackathon.service.admin;

import com.hackathon.dto.UserResponseDTO;
import com.hackathon.dto.UserRoleRequest;
import com.hackathon.entity.User;
import com.hackathon.exception.BusinessException;
import com.hackathon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    private static final List<String> VALID_ROLES = List.of("player", "expert", "admin", "spectator");

    /**
     * 分页搜索用户列表
     * - 支持关键字搜索（username/nickname/email）
     * - 支持角色筛选
     */
    public Page<UserResponseDTO> listUsers(String keyword, String role, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> users = userRepository.searchUsers(keyword, role, pageable);
        return users.map(this::toResponseDTO);
    }

    /**
     * 获取所有用户（不分页）
     */
    public List<UserResponseDTO> listAllUsers() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * 获取用户详情
     */
    public UserResponseDTO getUserDetail(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在"));
        return toResponseDTO(user);
    }

    /**
     * 禁用用户（status = 0）
     * - 不能禁用自己
     * - 不能禁用其他管理员（防止误操作）
     */
    @Transactional
    public UserResponseDTO disableUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        // 不能禁用自己
        User currentUser = getCurrentAdmin();
        if (user.getId().equals(currentUser.getId())) {
            throw new BusinessException("不能禁用自己");
        }

        // 不能禁用其他管理员
        if ("admin".equals(user.getRole())) {
            throw new BusinessException("不能禁用其他管理员账号");
        }

        user.setStatus(0);
        User saved = userRepository.save(user);
        return toResponseDTO(saved);
    }

    /**
     * 启用用户（status = 1）
     */
    @Transactional
    public UserResponseDTO enableUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        user.setStatus(1);
        User saved = userRepository.save(user);
        return toResponseDTO(saved);
    }

    /**
     * 变更用户角色
     * - 不能改自己（防止管理员把自己降级）
     * - 角色只能是 player/expert/admin/spectator
     */
    @Transactional
    public UserResponseDTO changeRole(Long id, UserRoleRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        // 校验角色有效性
        if (!VALID_ROLES.contains(request.getRole())) {
            throw new BusinessException("无效的角色，可选值：player / expert / admin / spectator");
        }

        // 不能改自己的角色
        User currentUser = getCurrentAdmin();
        if (user.getId().equals(currentUser.getId())) {
            throw new BusinessException("不能变更自己的角色");
        }

        user.setRole(request.getRole());
        User saved = userRepository.save(user);
        return toResponseDTO(saved);
    }

    /**
     * 按角色查询用户列表
     */
    public List<UserResponseDTO> listUsersByRole(String role) {
        return userRepository.findByRole(role)
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * 获取用户总数统计
     */
    public long getTotalCount() {
        return userRepository.count();
    }

    /**
     * 按角色统计人数
     */
    public long getCountByRole(String role) {
        return userRepository.findByRole(role).size();
    }

    private User getCurrentAdmin() {
        // 从 SecurityContext 获取当前用户名，再查数据库
        String username = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("当前用户不存在"));
    }

    private UserResponseDTO toResponseDTO(User u) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(u.getId());
        dto.setUsername(u.getUsername());
        dto.setNickname(u.getNickname());
        dto.setEmail(u.getEmail());
        dto.setAvatar(u.getAvatar());
        dto.setRole(u.getRole());
        dto.setStatus(u.getStatus());
        dto.setCreatedAt(u.getCreatedAt());
        dto.setUpdatedAt(u.getUpdatedAt());
        return dto;
    }
}
