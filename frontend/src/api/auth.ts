import { get, post } from '@/utils/request';
import type { User } from '@/types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  nickname?: string;
  email?: string;
}

export const login = async (data: LoginRequest): Promise<User> => {
  const result = await post<User>('/api/auth/login', data);
  return result;
};

export const register = async (data: RegisterRequest): Promise<User> => {
  const result = await post<User>('/api/auth/register', data);
  return result;
};

export const getUserInfo = async (): Promise<User> => {
  const result = await get<User>('/api/auth/me');
  return result;
};