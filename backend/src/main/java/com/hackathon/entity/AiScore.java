package com.hackathon.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_scores",
    uniqueConstraints = @UniqueConstraint(name = "uk_sub_dim", columnNames = {"submission_id", "dimension_id"}))
@Data
public class AiScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Column(name = "dimension_id", nullable = false)
    private Long dimensionId;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal score;

    @Column(columnDefinition = "TEXT")
    private String detail;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
