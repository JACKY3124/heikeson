import type { Submission, AIScore, CriteriaScore, ScoreRecord, LeaderboardEntry, Team, ExpertScore, ScoringConfig } from '@/types';
import { DEFAULT_SCORING_CONFIG } from '@/types';

const KEYWORD_WEIGHTS: Record<string, Record<string, number>> = {
  innovation: {
    '创新': 10, '独特': 8, '革命性': 10, '突破': 8, '前沿': 6,
    '首发': 7, '首创': 10, '领先': 6, '原创': 9, '新颖': 7
  },
  technical: {
    'AI': 8, '人工智能': 8, '机器学习': 9, '区块链': 7, '量子': 10,
    '分布式': 7, '微服务': 6, '云原生': 7, '边缘计算': 8, '大数据': 7
  },
  practicality: {
    '实用': 8, '落地': 7, '应用': 6, '场景': 5, '解决': 7,
    '效率': 6, '成本': 5, '用户': 4, '体验': 5, '便捷': 6
  },
  business: {
    '商业': 7, '盈利': 8, '市场': 6, '规模': 5, '增长': 6,
    '变现': 8, '收入': 7, '估值': 6, '融资': 8, '投资': 5
  }
};

export function simulateAIScoring(
  submission: Submission,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): AIScore {
  const text = `${submission.title} ${submission.description} ${submission.technology.join(' ')}`.toLowerCase();
  
  const scores: CriteriaScore[] = config.criteria.map(criteria => {
    let score = 60 + Math.random() * 20;
    const keywords = KEYWORD_WEIGHTS[criteria.id] || {};
    
    for (const [keyword, weight] of Object.entries(keywords)) {
      if (text.includes(keyword)) {
        score += weight * 0.5;
      }
    }
    
    if (submission.githubUrl) score += 5;
    if (submission.videoUrl) score += 5;
    if (submission.technology.length >= 3) score += 3;
    
    score = Math.min(100, Math.max(0, score));
    
    const feedback = generateCriteriaFeedback(criteria.id, score);
    
    return {
      criteriaId: criteria.id,
      score: Math.round(score * 10) / 10,
      feedback
    };
  });

  const totalScore = scores.reduce((sum, s) => sum + s.score * (config.criteria.find(c => c.id === s.criteriaId)?.weight || 0), 0);

  return {
    submissionId: submission.id,
    scores,
    totalScore: Math.round(totalScore * 10) / 10,
    feedback: generateOverallFeedback(scores, submission),
    evaluatedAt: new Date().toISOString()
  };
}

function generateCriteriaFeedback(criteriaId: string, score: number): string {
  const feedbacks: Record<string, string[]> = {
    innovation: [
      '项目展现了出色的创新思维，在同类项目中具有明显的差异化优势。',
      '创意新颖，能够体现团队对行业的深入理解和创新思考。',
      '创新点明确，但在独特性方面还有提升空间。',
      '基础创新存在，可考虑更多突破性思考。'
    ],
    technical: [
      '技术架构设计合理，展示了扎实的工程技术能力。',
      '技术选型恰当，系统设计具有较高的复杂度和完整性。',
      '技术实现清晰，可以看出团队的技术积累。',
      '技术方案可行，建议进一步完善架构设计。'
    ],
    practicality: [
      '项目解决了真实的痛点需求，具有很强的实用价值。',
      '落地场景明确，能够为用户带来实际效益。',
      '应用前景可观，具备一定的商业化潜力。',
      '建议进一步调研用户需求，完善产品体验。'
    ],
    business: [
      '商业模式清晰，展示了良好的商业化思路。',
      '市场分析深入，商业潜力巨大。',
      '变现路径明确，投资回报可期。',
      '建议进一步完善商业计划，增强说服力。'
    ]
  };
  
  const list = feedbacks[criteriaId] || feedbacks.innovation;
  if (score >= 85) return list[0];
  if (score >= 75) return list[1];
  if (score >= 60) return list[2];
  return list[3];
}

function generateOverallFeedback(scores: CriteriaScore[], submission: Submission): string {
  const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  
  if (avgScore >= 85) {
    return `项目整体表现优异 "${submission.title}" 展现了高水平的创新能力、技术实现和商业价值。建议重点关注项目落地推进。`;
  } else if (avgScore >= 70) {
    return `项目 "${submission.title}" 整体表现良好，创新性和实用性兼备。建议进一步优化技术方案，增强商业竞争力。`;
  } else if (avgScore >= 55) {
    return `项目 "${submission.title}" 具有一定潜力，建议加强创新投入，完善产品化思路。`;
  } else {
    return `项目 "${submission.title}" 需要在多个维度进行优化，建议团队重新审视项目定位和实现方案。`;
  }
}

export function calculateWeightedScore(
  aiScore: AIScore | undefined,
  expertScores: ExpertScore[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): number {
  if (!aiScore && expertScores.length === 0) return 0;
  
  let finalScore = 0;
  let totalWeight = 0;

  if (aiScore) {
    finalScore += aiScore.totalScore * config.aiWeight;
    totalWeight += config.aiWeight;
  }

  if (expertScores.length > 0) {
    const expertAvg = expertScores.reduce((sum, es) => sum + es.totalScore, 0) / expertScores.length;
    finalScore += expertAvg * config.expertWeight;
    totalWeight += config.expertWeight;
  }

  return totalWeight > 0 ? Math.round((finalScore / totalWeight) * 10) / 10 : 0;
}

export function calculateRankings(
  scoreRecords: ScoreRecord[],
  teams: Team[]
): LeaderboardEntry[] {
  return scoreRecords
    .filter(record => record.finalScore > 0)
    .map(record => {
      const team = teams.find(t => t.id === record.teamId);
      const submission = { 
        id: record.submissionId,
        teamId: record.teamId,
        hackathonId: record.hackathonId,
        title: '',
        description: '',
        technology: [],
        createdAt: ''
      };
      
      return {
        rank: 0,
        team: team!,
        submission,
        score: record.finalScore,
        scoreBreakdown: extractScoreBreakdown(record)
      };
    })
    .filter(entry => entry.team)
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function extractScoreBreakdown(record: ScoreRecord): LeaderboardEntry['scoreBreakdown'] {
  const breakdown: LeaderboardEntry['scoreBreakdown'] = {
    innovation: 0,
    technical: 0,
    practicality: 0,
    business: 0
  };

  if (record.aiScore) {
    record.aiScore.scores.forEach(s => {
      if (s.criteriaId === 'innovation') breakdown.innovation = s.score;
      if (s.criteriaId === 'technical') breakdown.technical = s.score;
      if (s.criteriaId === 'practicality') breakdown.practicality = s.score;
      if (s.criteriaId === 'business') breakdown.business = s.score;
    });
    breakdown.aiScore = record.aiScore.totalScore;
  }

  if (record.expertScores.length > 0) {
    const avgScores: Record<string, number[]> = {
      innovation: [], technical: [], practicality: [], business: []
    };
    
    record.expertScores.forEach(es => {
      es.scores.forEach(s => {
        if (avgScores[s.criteriaId]) {
          avgScores[s.criteriaId].push(s.score);
        }
      });
    });

    breakdown.expertAvgScore = record.expertScores.reduce((sum, es) => sum + es.totalScore, 0) / record.expertScores.length;
    breakdown.expertCount = record.expertScores.length;
  }

  return breakdown;
}

export function createScoreRecord(
  submissionId: string,
  teamId: string,
  hackathonId: string,
  aiScore?: AIScore,
  expertScores: ExpertScore[] = []
): ScoreRecord {
  const finalScore = calculateWeightedScore(aiScore, expertScores);
  
  return {
    submissionId,
    teamId,
    hackathonId,
    aiScore,
    expertScores,
    finalScore,
    rank: 0
  };
}

export function updateScoreRecordWithExpertScore(
  record: ScoreRecord,
  expertScore: ExpertScore
): ScoreRecord {
  const existingIndex = record.expertScores.findIndex(
    es => es.expertId === expertScore.expertId
  );
  
  let newExpertScores: ExpertScore[];
  if (existingIndex >= 0) {
    newExpertScores = [...record.expertScores];
    newExpertScores[existingIndex] = expertScore;
  } else {
    newExpertScores = [...record.expertScores, expertScore];
  }
  
  const finalScore = calculateWeightedScore(record.aiScore, newExpertScores);
  
  return {
    ...record,
    expertScores: newExpertScores,
    finalScore
  };
}
