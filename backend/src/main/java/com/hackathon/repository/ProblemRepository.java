package com.hackathon.repository;

import com.hackathon.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {

    List<Problem> findByCompetitionId(Long competitionId);

    List<Problem> findByCompetitionIdOrderBySortOrder(Long competitionId);

    long deleteByCompetitionId(Long competitionId);
}
