package com.hackathon.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Data
public class RegistrationResponseDTO {

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private Long id;
    private Long competitionId;
    private Long userId;
    private Long teamId;

    // 契约字段
    private String status;                   // 契约: not_registered/pending/approved/rejected/withdrawn
    private String registeredAt;             // 契约: registeredAt（格式化时间）
    private String reviewedAt;               // 契约: reviewedAt
    private String reviewComment;            // 契约: reviewComment

    // 契约: 报名状态中的团队信息
    private TeamInfo team;

    // 契约: 额外信息
    private String captainName;
    private String captainPhone;
    private String captainEmail;
    private String region;

    // 保留旧接口兼容字段
    private String username;
    private String nickname;
    private String competitionTitle;
    private String teamName;
    private LocalDateTime createdAt;

    @Data
    public static class TeamInfo {
        private Long id;
        private String name;
        private String region;
        private List<TeamMemberInfo> members;

        @Data
        public static class TeamMemberInfo {
            private Long id;
            private String username;
            private String name;
            private String role;  // captain / member
        }
    }
}
