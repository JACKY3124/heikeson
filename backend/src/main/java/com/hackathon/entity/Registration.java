package com.hackathon.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "registrations",
    uniqueConstraints = @UniqueConstraint(name = "uk_user_comp", columnNames = {"user_id", "competition_id"}))
@Data
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "competition_id", nullable = false)
    private Long competitionId;

    @Column(name = "team_id")
    private Long teamId;

    // 契约: 报名请求扩展字段
    @Column(name = "team_name", length = 100)
    private String teamName;                  // 契约: teamName

    @Column(name = "region", length = 50)
    private String region;                    // 契约: region（赛区）

    @Column(name = "captain_name", length = 100)
    private String captainName;               // 契约: captainName

    @Column(name = "captain_phone", length = 20)
    private String captainPhone;              // 契约: captainPhone

    @Column(name = "captain_email", length = 100)
    private String captainEmail;              // 契约: captainEmail

    @Column(name = "agree_ip")
    private Boolean agreeIP;                  // 契约: agreeIP

    @Column(name = "agree_participation")
    private Boolean agreeParticipation;       // 契约: agreeParticipation

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;         // 契约: reviewedAt（审核时间）

    @Column(name = "review_comment", length = 500)
    private String reviewComment;             // 契约: reviewComment（审核备注）

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "pending";
        }
    }
}
