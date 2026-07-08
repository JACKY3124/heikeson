package com.hackathon.repository;

import com.hackathon.entity.ScoreDimension;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScoreDimensionRepository extends JpaRepository<ScoreDimension, Long> {

    List<ScoreDimension> findByCompetitionId(Long competitionId);
}
