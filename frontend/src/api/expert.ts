import { get, post } from '@/utils/request';
import type { ScoreDimension } from '@/types';

/**
 * 专家端 / 公开榜单 API（对接后端 ExpertScoreController / PublicRankingController）
 *
 * 后端接口：
 * - GET  /api/expert/reviews                                   我的待评审列表
 * - POST /api/expert/scores                                    提交评分（按维度）
 * - GET  /api/expert/competitions/{competitionId}/dimensions   赛事评分维度
 * - GET  /api/expert/submissions/{submissionId}/my-scores      我对某作品的评分
 * - GET  /api/public/rankings/competition/{competitionId}      公开榜单（无需登录）
 */

/** 后端待评审作品 DTO */
export interface ExpertPendingReview {
  submissionId: number;
  competitionId: number;
  competitionTitle?: string;
  title: string;
  description?: string;
  fileName?: string | null;
  fileUrl?: string | null;
  teamId?: number | null;
  teamName?: string | null;
  authorName?: string | null;
  submittedAt?: string | null;
  dimensionCount?: number;
  scoredDimensions?: number;
  myWeightedScore?: number | null;
  reviewCompleted?: boolean;
}

/** 后端专家评分记录 DTO */
export interface ExpertScoreRecord {
  id?: number;
  submissionId: number;
  dimensionId?: number;
  dimensionName?: string;
  expertId?: number;
  expertName?: string;
  score: number;
  comment?: string | null;
  updatedAt?: string | null;
}

/** 后端公开榜单条目 DTO */
export interface CompetitionRankingEntry {
  rank?: number;
  rankNo?: number;
  teamName?: string;
  members?: string[];
  totalScore?: number;
  aiScore?: number;
  expertScore?: number;
  id?: number;
  competitionId?: number;
  teamId?: number;
  username?: string;
  nickname?: string;
}

/** 我的待评审作品列表 */
export const getMyPendingReviewsAPI = (): Promise<ExpertPendingReview[]> =>
  get<ExpertPendingReview[]>('/api/expert/reviews');

/** 提交单维度评分（同一作品同一维度重复提交视为修改） */
export const submitExpertScoreAPI = (data: {
  submissionId: number;
  dimensionId: number;
  score: number;
  comment?: string;
}): Promise<ExpertScoreRecord> => post<ExpertScoreRecord>('/api/expert/scores', data);

/** 查询赛事评分维度 */
export const getExpertDimensionsAPI = (competitionId: number): Promise<ScoreDimension[]> =>
  get<ScoreDimension[]>(`/api/expert/competitions/${competitionId}/dimensions`);

/** 我对某作品的全部评分 */
export const getMyExpertScoresAPI = (submissionId: number): Promise<ExpertScoreRecord[]> =>
  get<ExpertScoreRecord[]>(`/api/expert/submissions/${submissionId}/my-scores`);

/** 公开榜单（无需登录） */
export const getCompetitionRankingAPI = (competitionId: number): Promise<CompetitionRankingEntry[]> =>
  get<CompetitionRankingEntry[]>(`/api/public/rankings/competition/${competitionId}`);
