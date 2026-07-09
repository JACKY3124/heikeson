package com.hackathon.dto;

import lombok.Data;

/**
 * @deprecated 选手报名请使用 {@link PlayerRegistrationRequest}，管理员端无需单独请求体
 */
@Data
public class RegistrationRequest {
    private Long competitionId;
    private Long teamId;
}
