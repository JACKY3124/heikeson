package com.hackathon.repository;

import com.hackathon.entity.CompetitionExpert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionExpertRepository extends JpaRepository<CompetitionExpert, Long> {

    List<CompetitionExpert> findByCompetitionId(Long competitionId);

    List<CompetitionExpert> findByExpertId(Long expertId);

    Optional<CompetitionExpert> findByCompetitionIdAndExpertId(Long competitionId, Long expertId);

    void deleteByCompetitionIdAndExpertId(Long competitionId, Long expertId);
}
