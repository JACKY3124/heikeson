package com.hackathon.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "scoring_rules")
@Data
public class ScoringRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "competition_id", nullable = false)
    private Long competitionId;

    @Column(name = "dimension_id", nullable = false)
    private Long dimensionId;

    @Column(name = "rule_type", nullable = false, length = 50)
    private String ruleType;

    @Column(name = "rule_name", nullable = false, length = 100)
    private String ruleName;

    @Column(name = "rule_value", nullable = false, columnDefinition = "TEXT")
    private String ruleValue;

    @Column(name = "is_active", nullable = false)
    private Integer isActive = 1;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.isActive == null) {
            this.isActive = 1;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
