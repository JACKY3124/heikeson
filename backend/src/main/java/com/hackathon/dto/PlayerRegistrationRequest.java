package com.hackathon.dto;

import lombok.Data;

import java.util.List;

@Data
public class PlayerRegistrationRequest {

    private Long competitionId;
    private Long teamId;

    // 契约: 扩展报名字段
    private String teamName;               // 契约: 团队赛必填
    private String region;                 // 契约: 赛区
    private String captainName;            // 契约: 队长姓名
    private String captainPhone;           // 契约: 队长电话
    private String captainEmail;           // 契约: 队长邮箱
    private List<MemberInfo> members;      // 契约: 成员列表
    private Boolean agreeIP;               // 契约: 同意知识产权
    private Boolean agreeParticipation;    // 契约: 同意参赛条款

    @Data
    public static class MemberInfo {
        private String fullName;
        private String phone;
        private String email;
    }
}
