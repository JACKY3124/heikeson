package com.hackathon.repository;

import com.hackathon.entity.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    List<Registration> findByCompetitionId(Long competitionId);

    List<Registration> findByUserId(Long userId);

    /** 查某用户在某赛事的报名记录（用于重复报名校验） */
    Optional<Registration> findByUserIdAndCompetitionId(Long userId, Long competitionId);

    /** 查某赛事已通过的报名列表（用于提交作品校验） */
    List<Registration> findByCompetitionIdAndStatus(Long competitionId, String status);

    /** 查某用户所有已通过的报名 */
    List<Registration> findByUserIdAndStatus(Long userId, String status);
}
