package com.hackathon.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
@Data
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
