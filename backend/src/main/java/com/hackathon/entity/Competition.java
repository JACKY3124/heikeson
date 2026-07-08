package com.hackathon.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "competitions")
@Data
public class Competition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cover_image", length = 255)
    private String coverImage;

    @Column(columnDefinition = "TEXT")
    private String rules;

    @Column(name = "competition_type", nullable = false, length = 20)
    private String competitionType;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "register_start", nullable = false)
    private LocalDateTime registerStart;

    @Column(name = "register_end", nullable = false)
    private LocalDateTime registerEnd;

    @Column(name = "submit_start", nullable = false)
    private LocalDateTime submitStart;

    @Column(name = "submit_end", nullable = false)
    private LocalDateTime submitEnd;

    @Column(name = "start_time")
    private LocalDateTime startTime;          // 契约: startTime（比赛开始时间，如无单独字段则=submitStart）

    @Column(name = "end_time")
    private LocalDateTime endTime;            // 契约: endTime（比赛结束时间，如无单独字段则=submitEnd）

    @Column(name = "min_team_size")
    private Integer minTeamSize;              // 契约: minTeamSize

    @Column(name = "max_team_size")
    private Integer maxTeamSize;              // 契约: maxTeamSize

    @Column(name = "max_participants")
    private Integer maxParticipants;          // 契约: maxParticipants

    @Column(name = "is_virtual")
    private Boolean isVirtual;                // 契约: isVirtual

    @Column(length = 255)
    private String location;                  // 契约: location

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.competitionType == null) {
            this.competitionType = "individual";
        }
        if (this.status == null) {
            this.status = "pending";
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
