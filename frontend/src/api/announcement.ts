import { get } from '@/utils/request';
import type { Announcement } from '@/types';

export const getAnnouncements = async (): Promise<Announcement[]> => {
  const result = await get<Announcement[]>('/api/announcements');
  return result;
};