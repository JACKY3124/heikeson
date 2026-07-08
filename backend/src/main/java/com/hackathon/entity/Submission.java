package com.hackathon.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "submissions")
@Data
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "competition_id", nullable = false)
    private Long competitionId;

    @Column(name = "team_id")
    private Long teamId;

    @Column(name = "problem_id")
    private Long problemId;

    @Column(length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_url", length = 255)
    private String fileUrl;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "draft";
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
