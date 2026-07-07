import { get, post } from '@/utils/request';
import type { Comment } from '@/types';

export interface PostCommentRequest {
  content: string;
  parentId?: number;
}

export const getComments = async (submissionId: number): Promise<Comment[]> => {
  const result = await get<Comment[]>(`/api/submissions/${submissionId}/comments`);
  return result;
};

export const postComment = async (submissionId: number, data: PostCommentRequest): Promise<Comment> => {
  const result = await post<Comment>(`/api/submissions/${submissionId}/comments`, data);
  return result;
};