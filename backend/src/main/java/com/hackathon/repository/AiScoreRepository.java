package com.hackathon.repository;

import com.hackathon.entity.AiScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiScoreRepository extends JpaRepository<AiScore, Long> {

    /** 查某作品的全部AI评分 */
    List<AiScore> findBySubmissionId(Long submissionId);

    /** 查某作品某维度的AI评分 */
    Optional<AiScore> findBySubmissionIdAndDimensionId(Long submissionId, Long dimensionId);

    /** 删除某作品的全部AI评分（重新打分用） */
    void deleteBySubmissionId(Long submissionId);
}
