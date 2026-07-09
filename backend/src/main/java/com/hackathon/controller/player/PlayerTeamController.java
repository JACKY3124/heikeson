package com.hackathon.controller.player;

import com.hackathon.dto.ApiResponse;
import com.hackathon.dto.TeamRequest;
import com.hackathon.dto.TeamResponseDTO;
import com.hackathon.service.team.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 选手端 · 队伍管理接口
 * 所有接口要求 ROLE_PLAYER，userId 从 JWT 自动获取
 */
@RestController
@RequestMapping("/api/player/teams")
@RequiredArgsConstructor
public class PlayerTeamController {

    private final TeamService teamService;

    /** 创建队伍 */
    @PostMapping
    public ApiResponse<TeamResponseDTO> createTeam(@Valid @RequestBody TeamRequest request) {
        return ApiResponse.success(teamService.createTeam(request));
    }

    /** 更新队伍信息（仅队长） */
    @PutMapping("/{id}")
    public ApiResponse<TeamResponseDTO> updateTeam(@PathVariable Long id,
                                                    @RequestBody TeamRequest request) {
        return ApiResponse.success(teamService.updateTeam(id, request));
    }

    /** 解散队伍（仅队长） */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> disbandTeam(@PathVariable Long id) {
        teamService.disbandTeam(id);
        return ApiResponse.success(null);
    }

    /** 查询我的所有队伍 */
    @GetMapping("/me")
    public ApiResponse<List<TeamResponseDTO>> listMyTeams() {
        return ApiResponse.success(teamService.listMyTeams());
    }

    /** 查询队伍详情 */
    @GetMapping("/{id}")
    public ApiResponse<TeamResponseDTO> getTeam(@PathVariable Long id) {
        return ApiResponse.success(teamService.getTeamDetail(id));
    }

    /** 添加成员到队伍（仅队长） */
    @PostMapping("/{id}/members/{userId}")
    public ApiResponse<TeamResponseDTO> addMember(@PathVariable Long id,
                                                   @PathVariable Long userId) {
        return ApiResponse.success(teamService.addMember(id, userId));
    }

    /** 移除成员（仅队长） */
    @DeleteMapping("/{id}/members/{userId}")
    public ApiResponse<Void> removeMember(@PathVariable Long id,
                                           @PathVariable Long userId) {
        teamService.removeMember(id, userId);
        return ApiResponse.success(null);
    }

    /** 退出队伍（非队长） */
    @DeleteMapping("/{id}/members/me")
    public ApiResponse<Void> leaveTeam(@PathVariable Long id) {
        teamService.leaveTeam(id);
        return ApiResponse.success(null);
    }
}
