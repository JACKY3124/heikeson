package com.hackathon.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "competition_experts",
    uniqueConstraints = @UniqueConstraint(name = "uk_comp_expert", columnNames = {"competition_id", "expert_id"}))
@Data
public class CompetitionExpert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "competition_id", nullable = false)
    private Long competitionId;

    @Column(name = "expert_id", nullable = false)
    private Long expertId;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @PrePersist
    public void prePersist() {
        this.assignedAt = LocalDateTime.now();
    }
}
