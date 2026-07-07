import { get, post } from '@/utils/request';
import type { Submission, ScoreRecord, LeaderboardEntry } from '@/types';

export interface CreateSubmissionRequest {
  title: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  isDraft?: boolean;
}

export const createSubmission = async (competitionId: number, data: CreateSubmissionRequest): Promise<Submission> => {
  const result = await post<Submission>(`/api/competitions/${competitionId}/submissions`, data);
  return result;
};

export const getSubmissions = async (competitionId: number): Promise<Submission[]> => {
  const result = await get<Submission[]>(`/api/competitions/${competitionId}/submissions`);
  return result;
};

export const getScoreRecord = async (submissionId: number): Promise<ScoreRecord> => {
  const result = await get<ScoreRecord>(`/api/submissions/${submissionId}/scores`);
  return result;
};

export const getLeaderboard = async (competitionId: number, type?: 'individual' | 'team'): Promise<LeaderboardEntry[]> => {
  const result = await get<LeaderboardEntry[]>(`/api/competitions/${competitionId}/rankings`, { params: type ? { type } : {} });
  return result;
};