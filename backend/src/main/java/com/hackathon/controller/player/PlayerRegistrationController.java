package com.hackathon.controller.player;

import com.hackathon.dto.ApiResponse;
import com.hackathon.dto.PlayerRegistrationRequest;
import com.hackathon.dto.RegistrationResponseDTO;
import com.hackathon.service.registration.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 选手端 · 报名接口
 * 所有接口要求 ROLE_PLAYER，userId 从 JWT 自动获取
 */
@RestController
@RequestMapping("/api/player/registrations")
@RequiredArgsConstructor
public class PlayerRegistrationController {

    private final RegistrationService registrationService;

    /** 报名参赛 */
    @PostMapping
    public ApiResponse<RegistrationResponseDTO> register(@RequestBody PlayerRegistrationRequest request) {
        return ApiResponse.success(registrationService.register(request));
    }

    /** 查我的报名列表 */
    @GetMapping("/me")
    public ApiResponse<List<RegistrationResponseDTO>> listMyRegistrations() {
        return ApiResponse.success(registrationService.listMyRegistrations());
    }

    /** 查我在某赛事的报名状态 */
    @GetMapping("/competition/{competitionId}")
    public ApiResponse<RegistrationResponseDTO> getMyStatus(@PathVariable Long competitionId) {
        return ApiResponse.success(registrationService.getMyRegistrationStatus(competitionId));
    }

    /** 取消报名 */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> cancel(@PathVariable Long id) {
        registrationService.cancelRegistration(id);
        return ApiResponse.success(null);
    }
}
