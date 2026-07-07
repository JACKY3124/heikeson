import { get, post } from '@/utils/request';
import type { Hackathon, Registration, Team, RegistrationStatusResponse } from '@/types';
import type { PageResponse } from '@/types';

export interface GetCompetitionsParams {
  status?: 'upcoming' | 'running' | 'ended';
  page?: number;
  size?: number;
}

export interface RegisterRequest {
  teamName?: string;
  teamMembers?: number[];
}

export const getCompetitions = async (params?: GetCompetitionsParams): Promise<PageResponse<Hackathon>> => {
  const result = await get<PageResponse<Hackathon>>('/api/competitions', { params });
  return result;
};

export const getCompetitionById = async (id: number): Promise<Hackathon> => {
  const result = await get<Hackathon>(`/api/competitions/${id}`);
  return result;
};

export const registerCompetition = async (id: number, data?: RegisterRequest): Promise<Registration> => {
  const result = await post<Registration>(`/api/competitions/${id}/register`, data);
  return result;
};

export const getRegistrationStatus = async (id: number): Promise<RegistrationStatusResponse> => {
  const result = await get<RegistrationStatusResponse>(`/api/competitions/${id}/registration/status`);
  return result;
};