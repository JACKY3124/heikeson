package com.hackathon.service.scoring;

import com.hackathon.dto.ExpertScoreRequest;
import com.hackathon.dto.ExpertScoreResponseDTO;
import com.hackathon.dto.PendingReviewDTO;
import com.hackathon.entity.Competition;
import com.hackathon.entity.CompetitionExpert;
import com.hackathon.entity.ExpertScore;
import com.hackathon.entity.ScoreDimension;
import com.hackathon.entity.Submission;
import com.hackathon.entity.Team;
import com.hackathon.entity.User;
import com.hackathon.exception.BusinessException;
import com.hackathon.repository.CompetitionExpertRepository;
import com.hackathon.repository.CompetitionRepository;
import com.hackathon.repository.ExpertScoreRepository;
import com.hackathon.repository.ScoreDimensionRepository;
import com.hackathon.repository.SubmissionRepository;
import com.hackathon.repository.TeamRepository;
import com.hackathon.repository.UserRepository;
import com.hackathon.config.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 专家打分服务
 * - 待评审列表按「管理员分配的赛事」过滤
 * - 评分按维度录入，支持修改
 * - 加权总分供榜单生成使用
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExpertScoreService {

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final ExpertScoreRepository expertScoreRepository;
    private final SubmissionRepository submissionRepository;
    private final CompetitionRepository competitionRepository;
    private final CompetitionExpertRepository competitionExpertRepository;
    private final ScoreDimensionRepository scoreDimensionRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    /**
     * 查询当前专家的待评审作品列表（仅限被分配的赛事）
     */
    @Transactional(readOnly = true)
    public List<PendingReviewDTO> listMyReviews() {
        Long expertId = securityUtils.getCurrentUserId();

        // 该专家被分配的全部赛事
        List<Long> competitionIds = competitionExpertRepository.findByExpertId(expertId).stream()
                .map(CompetitionExpert::getCompetitionId)
                .collect(Collectors.toList());
        if (competitionIds.isEmpty()) {
            return List.of();
        }

        List<PendingReviewDTO> result = new ArrayList<>();
        for (Long competitionId : competitionIds) {
            Competition competition = competitionRepository.findById(competitionId).orElse(null);
            if (competition == null) continue;

            List<ScoreDimension> dimensions = scoreDimensionRepository.findByCompetitionId(competitionId);
            int dimensionCount = dimensions.size();

            // 该赛事下已正式提交的作品
            List<Submission> submissions = submissionRepository
                    .findByCompetitionIdAndStatus(competitionId, "submitted");
            for (Submission s : submissions) {
                PendingReviewDTO dto = toPendingReviewDTO(s, competition, dimensions, dimensionCount, expertId);
                result.add(dto);
            }
        }
        return result;
    }

    /**
     * 提交/更新专家评分（同一作品同一维度重复提交视为修改）
     */
    @Transactional
    public ExpertScoreResponseDTO submitScore(ExpertScoreRequest request) {
        Long expertId = securityUtils.getCurrentUserId();

        Submission submission = submissionRepository.findById(request.getSubmissionId())
                .orElseThrow(() -> new BusinessException("作品不存在"));

        // 仅已提交的作品可评分
        if (!"submitted".equals(submission.getStatus())) {
            throw new BusinessException("作品尚未正式提交，不可评分");
        }

        // 校验专家被分配到该赛事
        competitionExpertRepository.findByCompetitionIdAndExpertId(submission.getCompetitionId(), expertId)
                .orElseThrow(() -> new BusinessException("您未被分配到该赛事，无权评分"));

        // 校验维度属于该赛事
        ScoreDimension dimension = scoreDimensionRepository.findById(request.getDimensionId())
                .orElseThrow(() -> new BusinessException("评分维度不存在"));
        if (!dimension.getCompetitionId().equals(submission.getCompetitionId())) {
            throw new BusinessException("评分维度不属于该赛事");
        }

        // 分数上限校验
        BigDecimal maxScore = dimension.getMaxScore() != null ? dimension.getMaxScore() : new BigDecimal("100");
        if (request.getScore().compareTo(maxScore) > 0) {
            throw new BusinessException("分数不能超过该维度满分 " + maxScore.toPlainString());
        }

        // 幂等 upsert
        ExpertScore score = expertScoreRepository
                .findBySubmissionIdAndExpertIdAndDimensionId(submission.getId(), expertId, dimension.getId())
                .orElseGet(() -> {
                    ExpertScore es = new ExpertScore();
                    es.setSubmissionId(submission.getId());
                    es.setExpertId(expertId);
                    es.setDimensionId(dimension.getId());
                    return es;
                });
        score.setScore(request.getScore());
        score.setComment(request.getComment());

        ExpertScore saved = expertScoreRepository.save(score);
        log.info("专家评分: expertId={}, submissionId={}, dimensionId={}, score={}",
                expertId, submission.getId(), dimension.getId(), saved.getScore());

        return toDTO(saved, dimension, null);
    }

    /**
     * 查询当前专家对某作品的全部评分
     */
    @Transactional(readOnly = true)
    public List<ExpertScoreResponseDTO> getMyScoresForSubmission(Long submissionId) {
        Long expertId = securityUtils.getCurrentUserId();
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new BusinessException("作品不存在"));
        List<ScoreDimension> dimensions = scoreDimensionRepository.findByCompetitionId(submission.getCompetitionId());

        return expertScoreRepository.findBySubmissionId(submissionId).stream()
                .filter(s -> s.getExpertId().equals(expertId))
                .map(s -> {
                    ScoreDimension dim = dimensions.stream()
                            .filter(d -> d.getId().equals(s.getDimensionId()))
                            .findFirst().orElse(null);
                    return toDTO(s, dim, null);
                })
                .collect(Collectors.toList());
    }

    /**
     * 查询某作品的全部专家评分（公开，含所有专家）
     */
    @Transactional(readOnly = true)
    public List<ExpertScoreResponseDTO> getScoresForSubmission(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new BusinessException("作品不存在"));
        List<ScoreDimension> dimensions = scoreDimensionRepository.findByCompetitionId(submission.getCompetitionId());

        return expertScoreRepository.findBySubmissionId(submissionId).stream()
                .map(s -> {
                    ScoreDimension dim = dimensions.stream()
                            .filter(d -> d.getId().equals(s.getDimensionId()))
                            .findFirst().orElse(null);
                    User expert = userRepository.findById(s.getExpertId()).orElse(null);
                    return toDTO(s, dim, expert);
                })
                .collect(Collectors.toList());
    }

    /**
     * 计算某作品的专家加权总分（榜单生成用）
     * 先按维度加权求每位专家的得分，再取各专家平均
     */
    @Transactional(readOnly = true)
    public BigDecimal calcWeightedExpertScore(Long submissionId) {
        List<ExpertScore> scores = expertScoreRepository.findBySubmissionId(submissionId);
        if (scores.isEmpty()) {
            return BigDecimal.ZERO;
        }
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) {
            return BigDecimal.ZERO;
        }
        List<ScoreDimension> dimensions = scoreDimensionRepository.findByCompetitionId(submission.getCompetitionId());

        // 按专家分组
        var byExpert = scores.stream().collect(Collectors.groupingBy(ExpertScore::getExpertId));

        BigDecimal sum = BigDecimal.ZERO;
        for (List<ExpertScore> expertScores : byExpert.values()) {
            BigDecimal weightedSum = BigDecimal.ZERO;
            BigDecimal weightSum = BigDecimal.ZERO;
            for (ExpertScore es : expertScores) {
                BigDecimal weight = dimensions.stream()
                        .filter(d -> d.getId().equals(es.getDimensionId()))
                        .findFirst().map(ScoreDimension::getWeight)
                        .orElse(BigDecimal.ONE);
                weightedSum = weightedSum.add(es.getScore().multiply(weight));
                weightSum = weightSum.add(weight);
            }
            if (weightSum.compareTo(BigDecimal.ZERO) > 0) {
                sum = sum.add(weightedSum.divide(weightSum, 4, RoundingMode.HALF_UP));
            }
        }
        return sum.divide(BigDecimal.valueOf(byExpert.size()), 2, RoundingMode.HALF_UP);
    }

    // ======================== 内部方法 ========================

    private PendingReviewDTO toPendingReviewDTO(Submission s, Competition competition,
                                                List<ScoreDimension> dimensions,
                                                int dimensionCount, Long expertId) {
        PendingReviewDTO dto = new PendingReviewDTO();
        dto.setSubmissionId(s.getId());
        dto.setCompetitionId(competition.getId());
        dto.setCompetitionTitle(competition.getTitle());
        dto.setTitle(s.getTitle());
        dto.setDescription(s.getDescription());
        dto.setFileName(s.getFileName());
        dto.setFileUrl(s.getFileUrl());
        dto.setTeamId(s.getTeamId());
        dto.setSubmittedAt(s.getSubmittedAt() != null ? s.getSubmittedAt().format(DTF) : null);

        if (s.getTeamId() != null) {
            teamRepository.findById(s.getTeamId()).map(Team::getName).ifPresent(dto::setTeamName);
        }
        userRepository.findById(s.getUserId()).map(User::getNickname).ifPresent(dto::setAuthorName);

        // 已评维度统计
        List<ExpertScore> myScores = expertScoreRepository.findBySubmissionId(s.getId()).stream()
                .filter(es -> es.getExpertId().equals(expertId))
                .collect(Collectors.toList());
        dto.setScoredDimensions(myScores.size());
        dto.setDimensionCount(dimensionCount);
        dto.setReviewCompleted(dimensionCount > 0 && myScores.size() >= dimensionCount);

        // 我的加权得分（评完才有意义）
        if (!myScores.isEmpty()) {
            BigDecimal weightedSum = BigDecimal.ZERO;
            BigDecimal weightSum = BigDecimal.ZERO;
            for (ExpertScore es : myScores) {
                BigDecimal weight = dimensions.stream()
                        .filter(d -> d.getId().equals(es.getDimensionId()))
                        .findFirst().map(ScoreDimension::getWeight)
                        .orElse(BigDecimal.ONE);
                weightedSum = weightedSum.add(es.getScore().multiply(weight));
                weightSum = weightSum.add(weight);
            }
            if (weightSum.compareTo(BigDecimal.ZERO) > 0) {
                dto.setMyWeightedScore(weightedSum.divide(weightSum, 2, RoundingMode.HALF_UP));
            }
        }
        return dto;
    }

    /**
     * 查询某赛事的评分维度列表（专家端提交评分时需要 dimensionId）
     */
    @Transactional(readOnly = true)
    public List<ScoreDimension> listDimensions(Long competitionId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new BusinessException("赛事不存在"));
        return scoreDimensionRepository.findByCompetitionId(competition.getId());
    }

    private ExpertScoreResponseDTO toDTO(ExpertScore s, ScoreDimension dim, User expert) {
        ExpertScoreResponseDTO dto = new ExpertScoreResponseDTO();
        dto.setId(s.getId());
        dto.setSubmissionId(s.getSubmissionId());
        dto.setDimensionId(s.getDimensionId());
        dto.setDimensionName(dim != null ? dim.getName() : null);
        dto.setExpertId(s.getExpertId());
        dto.setExpertName(expert != null ? (expert.getNickname() != null ? expert.getNickname() : expert.getUsername()) : null);
        dto.setScore(s.getScore());
        dto.setComment(s.getComment());
        dto.setUpdatedAt(s.getUpdatedAt() != null ? s.getUpdatedAt().format(DTF) : null);
        return dto;
    }
}
