package com.hackathon.repository;

import com.hackathon.entity.ExpertScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExpertScoreRepository extends JpaRepository<ExpertScore, Long> {

    /** 查某作品的全部专家评分 */
    List<ExpertScore> findBySubmissionId(Long submissionId);

    /** 查某专家的全部评分记录 */
    List<ExpertScore> findByExpertId(Long expertId);

    /** 查某专家在某赛事的全部评分（按赛事维度联查用） */
    List<ExpertScore> findByExpertIdAndDimensionIdIn(Long expertId, List<Long> dimensionIds);

    /** 查某专家对某作品某维度的评分 */
    Optional<ExpertScore> findBySubmissionIdAndExpertIdAndDimensionId(Long submissionId, Long expertId, Long dimensionId);

    /** 删除某作品的全部专家评分 */
    void deleteBySubmissionId(Long submissionId);
}
