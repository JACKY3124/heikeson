package com.hackathon.repository;

import com.hackathon.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    List<Team> findByCompetitionId(Long competitionId);

    Optional<Team> findByCompetitionIdAndCaptainId(Long competitionId, Long captainId);

    List<Team> findByCaptainId(Long captainId);

    Optional<Team> findByNameAndCompetitionId(String name, Long competitionId);

    long countByCompetitionId(Long competitionId);
}
