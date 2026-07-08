package com.hackathon.controller.admin;

import com.hackathon.dto.*;
import com.hackathon.service.admin.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 管理员端 · 用户管理接口
 * 所有接口要求 ROLE_ADMIN
 *
 * 路由前缀: /api/admin/users
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    /** 分页搜索用户列表（支持关键字+角色筛选） */
    @GetMapping
    public ApiResponse<Page<UserResponseDTO>> listUsers(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(adminUserService.listUsers(keyword, role, page, size));
    }

    /** 获取所有用户（不分页） */
    @GetMapping("/all")
    public ApiResponse<List<UserResponseDTO>> listAllUsers() {
        return ApiResponse.success(adminUserService.listAllUsers());
    }

    /** 按角色查询用户列表 */
    @GetMapping("/role/{role}")
    public ApiResponse<List<UserResponseDTO>> listUsersByRole(@PathVariable String role) {
        return ApiResponse.success(adminUserService.listUsersByRole(role));
    }

    /** 获取用户详情 */
    @GetMapping("/{id}")
    public ApiResponse<UserResponseDTO> getUserDetail(@PathVariable Long id) {
        return ApiResponse.success(adminUserService.getUserDetail(id));
    }

    /** 禁用用户 */
    @PatchMapping("/{id}/disable")
    public ApiResponse<UserResponseDTO> disableUser(@PathVariable Long id) {
        return ApiResponse.success(adminUserService.disableUser(id));
    }

    /** 启用用户 */
    @PatchMapping("/{id}/enable")
    public ApiResponse<UserResponseDTO> enableUser(@PathVariable Long id) {
        return ApiResponse.success(adminUserService.enableUser(id));
    }

    /** 变更用户角色 */
    @PatchMapping("/{id}/role")
    public ApiResponse<UserResponseDTO> changeRole(
            @PathVariable Long id,
            @RequestBody UserRoleRequest request) {
        return ApiResponse.success(adminUserService.changeRole(id, request));
    }

    /** 用户总数统计 */
    @GetMapping("/count")
    public ApiResponse<Long> getTotalCount() {
        return ApiResponse.success(adminUserService.getTotalCount());
    }

    /** 按角色统计人数 */
    @GetMapping("/count/{role}")
    public ApiResponse<Long> getCountByRole(@PathVariable String role) {
        return ApiResponse.success(adminUserService.getCountByRole(role));
    }
}
