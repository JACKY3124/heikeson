package com.hackathon.repository;

import com.hackathon.entity.Ranking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RankingRepository extends JpaRepository<Ranking, Long> {

    /** 查某赛事所有排名（按 rankNo 排序） */
    List<Ranking> findByCompetitionIdOrderByRankNoAsc(Long competitionId);

    /** 查某用户在某赛事的排名 */
    Optional<Ranking> findByCompetitionIdAndUserId(Long competitionId, Long userId);

    /** 查某用户所有赛事排名 */
    List<Ranking> findByUserId(Long userId);
}
