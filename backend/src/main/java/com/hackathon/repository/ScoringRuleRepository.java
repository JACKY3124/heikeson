package com.hackathon.repository;

import com.hackathon.entity.ScoringRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScoringRuleRepository extends JpaRepository<ScoringRule, Long> {

    /** 查某赛事全部生效的打分规则 */
    List<ScoringRule> findByCompetitionIdAndIsActive(Long competitionId, Integer isActive);

    /** 查某维度的全部规则 */
    List<ScoringRule> findByDimensionId(Long dimensionId);
}
