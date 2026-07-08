package com.hackathon.repository;

import com.hackathon.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    /** 查某团队的所有成员 */
    List<TeamMember> findByTeamId(Long teamId);

    /** 查某用户是否在某团队中 */
    Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);

    /** 查某用户加入的所有团队 */
    List<TeamMember> findByUserId(Long userId);

    /** 查某用户在某赛事中是否属于某团队 */
    default Optional<TeamMember> findUserTeamInCompetition(Long userId, Long teamId) {
        return findByTeamIdAndUserId(teamId, userId);
    }
}
