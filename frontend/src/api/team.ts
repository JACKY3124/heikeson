import { get, post, put, del } from '@/utils/request';
import type { Team, JoinRequest } from '@/types';

export interface CreateTeamRequest {
  name: string;
  description?: string;
  hackathonId: string;
  members?: string[];
}

export const createTeam = async (data: CreateTeamRequest): Promise<Team> => {
  const result = await post<Team>('/api/teams', data);
  return result;
};

export const getTeamById = async (teamId: string): Promise<Team> => {
  const result = await get<Team>(`/api/teams/${teamId}`);
  return result;
};

export const getTeamsByHackathon = async (hackathonId: string): Promise<Team[]> => {
  const result = await get<Team[]>(`/api/competitions/${hackathonId}/teams`);
  return result;
};

export const joinTeam = async (teamId: string): Promise<JoinRequest> => {
  const result = await post<JoinRequest>(`/api/teams/${teamId}/join`);
  return result;
};

export const approveJoinRequest = async (teamId: string, requestId: string): Promise<JoinRequest> => {
  const result = await put<JoinRequest>(`/api/teams/${teamId}/requests/${requestId}/approve`);
  return result;
};

export const rejectJoinRequest = async (teamId: string, requestId: string): Promise<JoinRequest> => {
  const result = await put<JoinRequest>(`/api/teams/${teamId}/requests/${requestId}/reject`);
  return result;
};

export const getPendingRequests = async (teamId: string): Promise<JoinRequest[]> => {
  const result = await get<JoinRequest[]>(`/api/teams/${teamId}/requests`);
  return result;
};

export const leaveTeam = async (teamId: string): Promise<void> => {
  await del<void>(`/api/teams/${teamId}/leave`);
};

export const updateTeam = async (teamId: string, data: Partial<CreateTeamRequest>): Promise<Team> => {
  const result = await put<Team>(`/api/teams/${teamId}`, data);
  return result;
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  await del<void>(`/api/teams/${teamId}`);
};