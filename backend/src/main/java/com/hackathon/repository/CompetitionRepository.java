package com.hackathon.repository;

import com.hackathon.entity.Competition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetitionRepository extends JpaRepository<Competition, Long> {

    List<Competition> findByStatus(String status);

    Page<Competition> findByStatus(String status, Pageable pageable);

    List<Competition> findByCreatedBy(Long createdBy);

    /** 分页 + 搜索（模糊匹配 title） */
    @Query("SELECT c FROM Competition c WHERE " +
            "(:keyword IS NULL OR :keyword = '' OR c.title LIKE CONCAT('%', :keyword, '%')) AND " +
            "(:status IS NULL OR :status = '' OR c.status = :status)")
    Page<Competition> searchCompetitions(@Param("keyword") String keyword,
                                          @Param("status") String status,
                                          Pageable pageable);

    /** 统计某赛事已通过报名数（契约 currentParticipants） */
    @Query("SELECT COUNT(r) FROM Registration r WHERE r.competitionId = :compId AND r.status = 'approved'")
    Long countApprovedRegistrations(@Param("compId") Long compId);
}
