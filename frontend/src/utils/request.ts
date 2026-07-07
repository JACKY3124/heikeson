import axios from 'axios';
import type { ApiResponse } from '@/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

request.interceptors.response.use(
  (response: any) => {
    const data = response.data as ApiResponse;
    if (data.success === false) {
      const error = new Error(data.message || '请求失败');
      (error as any).response = response;
      return Promise.reject(error);
    }
    return response;
  },
  (error: any) => {
    const status = error.response?.status;
    const data = error.response?.data as ApiResponse | undefined;
    const message = data?.message || '请求失败';

    switch (status) {
      case 401:
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        break;
      case 403:
        console.error('无权限访问');
        break;
      case 404:
        console.error('请求的资源不存在');
        break;
      case 500:
        console.error('服务器内部错误');
        break;
      default:
        console.error(`请求错误 [${status}]: ${message}`);
    }

    const customError = new Error(message);
    (customError as any).response = error.response;
    return Promise.reject(customError);
  }
);

export const get = async <T>(url: string, config?: Record<string, any>): Promise<T> => {
  const response = await request.get<ApiResponse<T>>(url, config);
  return response.data.data as T;
};

export const post = async <T>(url: string, data?: unknown, config?: Record<string, any>): Promise<T> => {
  const response = await request.post<ApiResponse<T>>(url, data, config);
  return response.data.data as T;
};

export const put = async <T>(url: string, data?: unknown, config?: Record<string, any>): Promise<T> => {
  const response = await request.put<ApiResponse<T>>(url, data, config);
  return response.data.data as T;
};

export const del = async <T>(url: string, config?: Record<string, any>): Promise<T> => {
  const response = await request.delete<ApiResponse<T>>(url, config);
  return response.data.data as T;
};

export default request;