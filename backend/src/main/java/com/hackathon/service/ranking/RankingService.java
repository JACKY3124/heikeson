package com.hackathon.service.ranking;

import com.hackathon.config.SecurityUtils;
import com.hackathon.dto.RankingResponseDTO;
import com.hackathon.entity.Competition;
import com.hackathon.entity.Ranking;
import com.hackathon.entity.Submission;
import com.hackathon.entity.Team;
import com.hackathon.entity.TeamMember;
import com.hackathon.entity.User;
import com.hackathon.exception.BusinessException;
import com.hackathon.repository.CompetitionRepository;
import com.hackathon.repository.RankingRepository;
import com.hackathon.repository.SubmissionRepository;
import com.hackathon.repository.TeamMemberRepository;
import com.hackathon.repository.TeamRepository;
import com.hackathon.repository.UserRepository;
import com.hackathon.service.scoring.AiScoringService;
import com.hackathon.service.scoring.ExpertScoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RankingService {

    /** AI分权重 */
    private static final BigDecimal AI_WEIGHT = new BigDecimal("0.40");

    /** 专家分权重 */
    private static final BigDecimal EXPERT_WEIGHT = new BigDecimal("0.60");

    private final RankingRepository rankingRepository;
    private final CompetitionRepository competitionRepository;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final AiScoringService aiScoringService;
    private final ExpertScoreService expertScoreService;
    private final SecurityUtils securityUtils;

    /**
     * 生成某赛事的榜单（管理员触发，幂等可重复执行）
     * - 汇总所有已提交作品的 AI 加权分与专家加权分
     * - 总分 = AI分×0.4 + 专家分×0.6
     * - 按总分降序写 rankNo（同分并列）
     * - 团队作品记 teamId，个人作品记 userId
     */
    @Transactional
    public List<RankingResponseDTO> generateRanking(Long competitionId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new BusinessException("赛事不存在"));

        List<Submission> submissions = submissionRepository
                .findByCompetitionIdAndStatus(competitionId, "submitted");
        if (submissions.isEmpty()) {
            throw new BusinessException("该赛事暂无已提交的作品，无法生成榜单");
        }

        // 计算每份作品的总分
        List<Ranking> newRankings = new ArrayList<>();
        for (Submission s : submissions) {
            BigDecimal aiScore = aiScoringService.calcWeightedAiScore(s.getId());
            BigDecimal expertScore = expertScoreService.calcWeightedExpertScore(s.getId());
            BigDecimal total = aiScore.multiply(AI_WEIGHT)
                    .add(expertScore.multiply(EXPERT_WEIGHT))
                    .setScale(2, RoundingMode.HALF_UP);

            Ranking r = new Ranking();
            r.setCompetitionId(competitionId);
            r.setUserId(s.getTeamId() != null ? null : s.getUserId());
            r.setTeamId(s.getTeamId());
            r.setAiScore(aiScore);
            r.setExpertScore(expertScore);
            r.setTotalScore(total);
            newRankings.add(r);
        }

        // 按总分降序排序（同分并列）
        newRankings.sort(Comparator.comparing(Ranking::getTotalScore).reversed());
        int currentRank = 1;
        int actualRank = 1;
        BigDecimal prevScore = null;
        for (Ranking r : newRankings) {
            if (prevScore != null && r.getTotalScore().compareTo(prevScore) != 0) {
                currentRank = actualRank;
            }
            r.setRankNo(currentRank);
            prevScore = r.getTotalScore();
            actualRank++;
        }

        // 幂等：清掉旧榜单再写入
        rankingRepository.deleteAll(rankingRepository.findByCompetitionIdOrderByRankNoAsc(competitionId));
        rankingRepository.saveAll(newRankings);

        log.info("榜单生成: competitionId={}, 参赛作品数={}", competitionId, newRankings.size());
        return listCompetitionRanking(competitionId);
    }

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
