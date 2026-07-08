package com.hackathon.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "rankings")
@Data
public class Ranking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "competition_id", nullable = false)
    private Long competitionId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "team_id")
    private Long teamId;

    @Column(name = "total_score", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalScore = BigDecimal.ZERO;

    @Column(name = "ai_score", nullable = false, precision = 10, scale = 2)
    private BigDecimal aiScore = BigDecimal.ZERO;

    @Column(name = "expert_score", nullable = false, precision = 10, scale = 2)
    private BigDecimal expertScore = BigDecimal.ZERO;

    @Column(name = "rank_no")
    private Integer rankNo;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.totalScore == null) {
            this.totalScore = BigDecimal.ZERO;
        }
        if (this.aiScore == null) {
            this.aiScore = BigDecimal.ZERO;
        }
        if (this.expertScore == null) {
            this.expertScore = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
