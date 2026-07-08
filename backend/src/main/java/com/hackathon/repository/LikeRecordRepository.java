package com.hackathon.repository;

import com.hackathon.entity.LikeRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LikeRecordRepository extends JpaRepository<LikeRecord, Long> {

    Optional<LikeRecord> findBySubmissionIdAndUserId(Long submissionId, Long userId);

    long countBySubmissionId(Long submissionId);

    void deleteBySubmissionIdAndUserId(Long submissionId, Long userId);
}
