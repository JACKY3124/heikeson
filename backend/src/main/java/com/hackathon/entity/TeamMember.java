package com.hackathon.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "team_members",
    uniqueConstraints = @UniqueConstraint(name = "uk_team_user", columnNames = {"team_id", "user_id"}))
@Data
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 20)
    private String role = "member";

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @PrePersist
    public void prePersist() {
        this.joinedAt = LocalDateTime.now();
        if (this.role == null) {
            this.role = "member";
        }
    }
}
