package com.hackathon.repository;

import com.hackathon.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    List<Submission> findByCompetitionId(Long competitionId);

    List<Submission> findByUserId(Long userId);

    /** 查某用户在某赛事的提交作品 */
    List<Submission> findByUserIdAndCompetitionId(Long userId, Long competitionId);

    /** 查某赛事某状态的作品（管理员审核用） */
    List<Submission> findByCompetitionIdAndStatus(Long competitionId, String status);

    /** 查某用户在某赛事某赛题的已提交作品（防止重复提交） */
    Optional<Submission> findByUserIdAndCompetitionIdAndProblemIdAndStatus(Long userId, Long competitionId, Long problemId, String status);
}
