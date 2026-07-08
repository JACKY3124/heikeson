package com.hackathon.service.ranking;

import com.hackathon.config.SecurityUtils;
import com.hackathon.dto.RankingResponseDTO;
import com.hackathon.entity.Competition;
import com.hackathon.entity.Ranking;
import com.hackathon.entity.Team;
import com.hackathon.entity.TeamMember;
import com.hackathon.entity.User;
import com.hackathon.exception.BusinessException;
import com.hackathon.repository.CompetitionRepository;
import com.hackathon.repository.RankingRepository;
import com.hackathon.repository.TeamMemberRepository;
import com.hackathon.repository.TeamRepository;
import com.hackathon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RankingService {

    private final RankingRepository rankingRepository;
    private final CompetitionRepository competitionRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final SecurityUtils securityUtils;

    /**
     * 查询我在某赛事的成绩排名
     */
    public RankingResponseDTO getMyRanking(Long competitionId) {
        Long userId = securityUtils.getCurrentUserId();
        Ranking ranking = rankingRepository.findByCompetitionIdAndUserId(competitionId, userId)
                .orElseThrow(() -> new BusinessException("您在该赛事暂无成绩"));

        User user = userRepository.findById(userId).orElse(null);
        Competition comp = competitionRepository.findById(competitionId).orElse(null);
        String teamName = ranking.getTeamId() != null ?
                teamRepository.findById(ranking.getTeamId()).map(Team::getName).orElse(null) : null;
        return toResponseDTO(ranking, user, comp, teamName);
    }

    /**
     * 查询我所有赛事的成绩
     */
    public List<RankingResponseDTO> listMyRankings() {
        Long userId = securityUtils.getCurrentUserId();
        List<Ranking> rankings = rankingRepository.findByUserId(userId);
        return rankings.stream()
                .map(r -> {
                    User user = userRepository.findById(r.getUserId()).orElse(null);
                    Competition comp = competitionRepository.findById(r.getCompetitionId()).orElse(null);
                    String teamName = r.getTeamId() != null ?
                            teamRepository.findById(r.getTeamId()).map(Team::getName).orElse(null) : null;
                    return toResponseDTO(r, user, comp, teamName);
                })
                .collect(Collectors.toList());
    }

    /**
     * 查某赛事完整排行榜（公开，无需登录）
     */
    public List<RankingResponseDTO> listCompetitionRanking(Long competitionId) {
        List<Ranking> rankings = rankingRepository.findByCompetitionIdOrderByRankNoAsc(competitionId);
        return rankings.stream()
                .map(r -> {
                    User user = r.getUserId() != null ? userRepository.findById(r.getUserId()).orElse(null) : null;
                    Competition comp = competitionRepository.findById(r.getCompetitionId()).orElse(null);
                    String teamName = r.getTeamId() != null ?
                            teamRepository.findById(r.getTeamId()).map(Team::getName).orElse(null) : null;
                    return toResponseDTO(r, user, comp, teamName);
                })
                .collect(Collectors.toList());
    }

    private RankingResponseDTO toResponseDTO(Ranking r, User user, Competition comp, String teamName) {
        RankingResponseDTO dto = new RankingResponseDTO();
        dto.setId(r.getId());
        dto.setCompetitionId(r.getCompetitionId());
        dto.setCompetitionTitle(comp != null ? comp.getTitle() : null);
        dto.setUserId(r.getUserId());
        dto.setUsername(user != null ? user.getUsername() : null);
        dto.setNickname(user != null ? user.getNickname() : null);
        dto.setTeamId(r.getTeamId());
        dto.setTeamName(teamName);
        dto.setTotalScore(r.getTotalScore());
        dto.setAiScore(r.getAiScore());
        dto.setExpertScore(r.getExpertScore());
        dto.setRankNo(r.getRankNo());

        // 契约: rank 字段
        dto.setRank(r.getRankNo());

        // 契约: members 列表（团队成员用户名）
        if (r.getTeamId() != null) {
            List<TeamMember> members = teamMemberRepository.findByTeamId(r.getTeamId());
            List<String> memberNames = members.stream()
                    .map(m -> userRepository.findById(m.getUserId())
                            .map(u -> u.getUsername())
                            .orElse("unknown"))
                    .collect(Collectors.toList());
            dto.setMembers(memberNames);
        } else if (r.getUserId() != null) {
            // 个人赛
            dto.setMembers(List.of(user != null ? user.getUsername() : "unknown"));
        }

        return dto;
    }
}
