/**
 * 报名数据共享工具（Mock 主链路）
 * - 报名数据统一存 localStorage `hackathon_registrations`，key 为 `${hackathonId}_${userId}`
 * - 报名页、作品提交页、管理员审核页共用本模块
 * - [API] 对接点：接入后端后，getRegistrations/saveRegistration/updateRegistrationStatus
 *   应改为调用 AdminRegistrationController / PlayerRegistrationController
 */

export type MemberType = 'registered' | 'unregistered';

export interface TeamMember {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  memberType: MemberType;
  userId?: string;
}

export interface RegistrationData {
  hackathonId: string;
  userId: string;
  teamName: string;
  captainName: string;
  captainPhone: string;
  captainEmail: string;
  region: string;
  members: TeamMember[];
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
}

const STORAGE_KEY = 'hackathon_registrations';

export function getRegistrations(): Record<string, RegistrationData> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveRegistration(data: RegistrationData) {
  const registrations = getRegistrations();
  registrations[`${data.hackathonId}_${data.userId}`] = data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
}

/**
 * 更新某条报名的审核状态（管理员审核入口）
 * @returns 是否更新成功（不存在该报名返回 false）
 */
export function updateRegistrationStatus(
  hackathonId: string,
  userId: string,
  status: RegistrationData['status']
): boolean {
  const registrations = getRegistrations();
  const key = `${hackathonId}_${userId}`;
  const reg = registrations[key];
  if (!reg) return false;
  registrations[key] = { ...reg, status };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
  return true;
}
