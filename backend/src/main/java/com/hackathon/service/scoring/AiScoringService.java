package com.hackathon.service.scoring;

import com.hackathon.dto.AiScoreResponseDTO;
import com.hackathon.entity.AiScore;
import com.hackathon.entity.Competition;
import com.hackathon.entity.ScoreDimension;
import com.hackathon.entity.ScoringRule;
import com.hackathon.entity.Submission;
import com.hackathon.exception.BusinessException;
import com.hackathon.repository.AiScoreRepository;
import com.hackathon.repository.CompetitionRepository;
import com.hackathon.repository.ScoreDimensionRepository;
import com.hackathon.repository.ScoringRuleRepository;
import com.hackathon.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 轻量化AI打分服务（规则化打分，无需大模型）
 *
 * 按方案要求实现四类基础规则：
 * - 字数校验（min_length）：描述字数不足按比例扣分
 * - 必填项校验（required）：标题/文件缺失直接扣分
 * - 违规词检测（banned_words）：命中违规词每次扣分
 * - 空白提交检测（blank_check）：纯空白内容记0分
 *
 * 支持通过 scoring_rules 表自定义规则阈值（ruleType + ruleValue）
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiScoringService {

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /** 默认违规词库（可被 scoring_rules 表的自定义规则覆盖） */
    private static final List<String> DEFAULT_BANNED_WORDS = Arrays.asList(
            "刷单", "外挂", "代考", "作弊", "赌博", "色情", "诈骗", "洗钱"
    );

    /** 字数不足时每差10%扣的分值比例 */
    private static final BigDecimal LENGTH_PENALTY_RATE = new BigDecimal("0.15");

    /** 违规词每命中一次扣分 */
    private static final BigDecimal BANNED_WORD_PENALTY = new BigDecimal("20");

    private final AiScoreRepository aiScoreRepository;
    private final SubmissionRepository submissionRepository;
    private final CompetitionRepository competitionRepository;
    private final ScoreDimensionRepository scoreDimensionRepository;
    private final ScoringRuleRepository scoringRuleRepository;

    /**
     * 对作品执行AI打分（幂等：重复执行会先清除旧分数再重新计算）
     * 触发点：作品提交时自动触发 / 管理员手动触发
     */
    @Transactional
    public List<AiScoreResponseDTO> runAIScoring(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new BusinessException("作品不存在"));

        Competition competition = competitionRepository.findById(submission.getCompetitionId())
                .orElseThrow(() -> new BusinessException("赛事不存在"));

        // 获取赛事的评分维度；无自定义维度时使用内置默认维度
        List<ScoreDimension> dimensions = scoreDimensionRepository.findByCompetitionId(competition.getId());
        if (dimensions.isEmpty()) {
            dimensions = buildDefaultDimensions(competition.getId());
        }

        // 幂等：清除旧分数
        aiScoreRepository.deleteBySubmissionId(submissionId);

        List<AiScore> results = new ArrayList<>();
        for (ScoreDimension dim : dimensions) {
            AiScore score = scoreOneDimension(submission, dim);
            results.add(score);
        }
        aiScoreRepository.saveAll(results);

        log.info("AI打分完成: submissionId={}, 维度数={}, 总分={}",
                submissionId, results.size(),
                results.stream().map(AiScore::getScore)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));

        return toDTOs(results, dimensions);
    }

    /**
     * 查询某作品的AI评分明细
     */
    @Transactional(readOnly = true)
    public List<AiScoreResponseDTO> getAiScores(Long submissionId) {
        if (!submissionRepository.existsById(submissionId)) {
            throw new BusinessException("作品不存在");
        }
        List<AiScore> scores = aiScoreRepository.findBySubmissionId(submissionId);
        if (scores.isEmpty()) {
            return List.of();
        }
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) {
            return toDTOs(scores, List.of());
        }
        List<ScoreDimension> dimensions = scoreDimensionRepository.findByCompetitionId(submission.getCompetitionId());
        return toDTOs(scores, dimensions);
    }

    /**
     * 计算某作品的AI加权总分（榜单生成用）
     * total = Σ(维度分 × 权重) / Σ权重，未打分时返回0
     */
    @Transactional(readOnly = true)
    public BigDecimal calcWeightedAiScore(Long submissionId) {
        List<AiScore> scores = aiScoreRepository.findBySubmissionId(submissionId);
        if (scores.isEmpty()) {
            return BigDecimal.ZERO;
        }
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) {
            return BigDecimal.ZERO;
        }
        List<ScoreDimension> dimensions = scoreDimensionRepository.findByCompetitionId(submission.getCompetitionId());

        BigDecimal weightedSum = BigDecimal.ZERO;
        BigDecimal weightSum = BigDecimal.ZERO;
        for (AiScore s : scores) {
            BigDecimal weight = dimensions.stream()
                    .filter(d -> d.getId().equals(s.getDimensionId()))
                    .findFirst()
                    .map(ScoreDimension::getWeight)
                    .orElse(BigDecimal.ONE);
            weightedSum = weightedSum.add(s.getScore().multiply(weight));
            weightSum = weightSum.add(weight);
        }
        if (weightSum.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return weightedSum.divide(weightSum, 2, RoundingMode.HALF_UP);
    }

    // ======================== 内部打分逻辑 ========================

    /**
     * 对单个维度执行规则化打分
     */
    private AiScore scoreOneDimension(Submission submission, ScoreDimension dim) {
        BigDecimal maxScore = dim.getMaxScore() != null ? dim.getMaxScore() : new BigDecimal("100");
        BigDecimal score = maxScore;
        List<String> deductions = new ArrayList<>();

        String title = submission.getTitle() == null ? "" : submission.getTitle().trim();
        String description = submission.getDescription() == null ? "" : submission.getDescription().trim();
        String fileName = submission.getFileUrl() == null ? "" : submission.getFileUrl().trim();

        // 读取该维度的自定义规则（无则使用内置默认规则）
        List<ScoringRule> rules = scoringRuleRepository.findByDimensionId(dim.getId());
        List<String> bannedWords = new ArrayList<>(DEFAULT_BANNED_WORDS);
        int minLength = 100;

        for (ScoringRule rule : rules) {
            if (rule.getIsActive() == null || rule.getIsActive() != 1) {
                continue;
            }
            switch (rule.getRuleType()) {
                case "banned_words" -> {
                    bannedWords.clear();
                    bannedWords.addAll(Arrays.asList(rule.getRuleValue().split("[,，]")));
                }
                case "min_length" -> {
                    try {
                        minLength = Integer.parseInt(rule.getRuleValue().trim());
                    } catch (NumberFormatException ignored) {
                    }
                }
                default -> { /* 其他规则类型暂不处理 */ }
            }
        }

        // 规则1：空白提交检测 —— 全部内容为空白直接记0分
        if (title.isEmpty() && description.isEmpty() && fileName.isEmpty()) {
            AiScore s = buildScore(submission.getId(), dim, BigDecimal.ZERO, "空白提交检测：作品无任何内容，记0分");
            return s;
        }

        // 规则2：必填项校验 —— 标题或文件缺失扣分
        if (title.isEmpty()) {
            score = score.subtract(maxScore.multiply(new BigDecimal("0.20")));
            deductions.add("必填项校验：标题缺失，扣20%");
        }
        if (fileName.isEmpty()) {
            score = score.subtract(maxScore.multiply(new BigDecimal("0.20")));
            deductions.add("必填项校验：作品文件缺失，扣20%");
        }

        // 规则3：字数校验 —— 描述字数不足按比例扣分
        int descLength = description.length();
        if (descLength < minLength) {
            BigDecimal ratio = BigDecimal.valueOf((minLength - descLength) / (double) minLength);
            BigDecimal penalty = maxScore.multiply(LENGTH_PENALTY_RATE).multiply(ratio)
                    .setScale(2, RoundingMode.HALF_UP);
            score = score.subtract(penalty);
            deductions.add(String.format("字数校验：描述仅%d字（要求≥%d字），扣%s分",
                    descLength, minLength, penalty.toPlainString()));
        }

        // 规则4：违规词检测 —— 每命中一次扣固定分
        String fullText = title + " " + description;
        int hitCount = 0;
        List<String> hits = new ArrayList<>();
        for (String word : bannedWords) {
            if (word.isBlank()) continue;
            int idx = fullText.indexOf(word);
            while (idx >= 0) {
                hitCount++;
                hits.add(word);
                idx = fullText.indexOf(word, idx + word.length());
            }
        }
        if (hitCount > 0) {
            BigDecimal penalty = BANNED_WORD_PENALTY.multiply(BigDecimal.valueOf(hitCount));
            score = score.subtract(penalty);
            deductions.add(String.format("违规词检测：命中违规词%s共%d次，扣%s分",
                    hits, hitCount, penalty.toPlainString()));
        }

        // 下限保护
        if (score.compareTo(BigDecimal.ZERO) < 0) {
            score = BigDecimal.ZERO;
        }
        score = score.setScale(2, RoundingMode.HALF_UP);

        String detail = deductions.isEmpty()
                ? "全部规则校验通过，获得满分"
                : String.join("；", deductions);
        return buildScore(submission.getId(), dim, score, detail);
    }

    private AiScore buildScore(Long submissionId, ScoreDimension dim, BigDecimal score, String detail) {
        AiScore s = new AiScore();
        s.setSubmissionId(submissionId);
        s.setDimensionId(dim.getId());
        s.setScore(score);
        s.setDetail(detail);
        return s;
    }

    /**
     * 赛事未配置维度时，使用内置默认四维度
     * （对应方案：文档完整性、内容合规性、答题完成度、项目创新性）
     */
    private List<ScoreDimension> buildDefaultDimensions(Long competitionId) {
        String[][] defaults = {
                {"文档完整性", "0.30", "作品标题、文件、描述齐全程度"},
                {"内容合规性", "0.25", "违规词、空白内容检测"},
                {"答题完成度", "0.25", "描述字数与内容充实程度"},
                {"项目创新性", "0.20", "作品描述长度与丰富度参考分"},
        };
        List<ScoreDimension> dims = new ArrayList<>();
        int order = 0;
        for (String[] d : defaults) {
            ScoreDimension dim = new ScoreDimension();
            dim.setCompetitionId(competitionId);
            dim.setName(d[0]);
            dim.setWeight(new BigDecimal(d[1]));
            dim.setMaxScore(new BigDecimal("100.00"));
            dim.setDescription(d[2]);
            dim.setSortOrder(order++);
            dims.add(scoreDimensionRepository.save(dim));
        }
        return dims;
    }

    private List<AiScoreResponseDTO> toDTOs(List<AiScore> scores, List<ScoreDimension> dimensions) {
        List<AiScoreResponseDTO> dtos = new ArrayList<>();
        for (AiScore s : scores) {
            AiScoreResponseDTO dto = new AiScoreResponseDTO();
            dto.setId(s.getId());
            dto.setSubmissionId(s.getSubmissionId());
            dto.setDimensionId(s.getDimensionId());
            dto.setScore(s.getScore());
            dto.setDetail(s.getDetail());
            dto.setCreatedAt(s.getCreatedAt() != null ? s.getCreatedAt().format(DTF) : null);
            dimensions.stream()
                    .filter(d -> d.getId().equals(s.getDimensionId()))
                    .findFirst()
                    .ifPresent(d -> {
                        dto.setDimensionName(d.getName());
                        dto.setDimensionWeight(d.getWeight());
                    });
            dtos.add(dto);
        }
        return dtos;
    }
}
