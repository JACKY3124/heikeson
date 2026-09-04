/**
 * ============================================
 *  全局状态管理 — 后端接口对接说明
 * ============================================
 *
 * 【当前阶段】全部使用前端 Mock 数据运行
 * 【对接后】将所有同步 action 替换为异步 API 调用
 *
 * 对接步骤：
 *   1. 取消注释下方 API 导入语句
 *   2. 将标记了 `[API] 对接点` 的同步操作替换为 async 函数
 *   3. 初始状态改为空数组/空对象，在页面挂载时通过 API 获取
 *   4. 删除 mockData 导入
 *
 *   示例：
 *     // 对接前（当前）:
 *     createHackathon: (data) => { ...同步操作内存数组 }
 *
 *     // 对接后:
 *     createHackathon: async (data) => {
 *       const result = await createHackathonAPI(data);
 *       set(s => ({ hackathons: [...s.hackathons, result] }));
 *     }
 *
 * API 模块已就绪，详见 src/api/index.ts
 * ============================================
 */

import { create } from 'zustand';
import type { User, Hackathon, Team, Submission, LeaderboardEntry, ScoreRecord, ExpertScore, ScoringConfig, UserRole, JoinRequest, Announcement } from '@/types';
import { mockUsers, mockHackathons, mockTeams, mockSubmissions, mockLeaderboard, mockExperts, mockAdmins, mockAnnouncements, mockScoreRecords, mockScoringConfig, mockAdditionalSubmissions } from '@/data/mockData';
import { simulateAIScoring, calculateWeightedScore, updateScoreRecordWithExpertScore } from '@/utils/scoring';
import { getAnnouncements } from '@/api';
import { getMyPendingReviewsAPI, submitExpertScoreAPI, getExpertDimensionsAPI, getCompetitionRankingAPI } from '@/api/expert';

// [API] 对接后端时取消注释：
// import {
//   loginAPI, registerAPI, getUserInfo,
//   getHackathons, getHackathonByIdAPI, createHackathonAPI, updateHackathonAPI, deleteHackathonAPI,
//   getSubmissions, createSubmissionAPI, updateSubmissionAPI,
//   getPendingReviews, submitExpertScoreAPI, runAIScoringAPI, getScoreRecordAPI, getLeaderboardAPI,
// } from '@/api';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  userRole: UserRole;
  hackathons: Hackathon[];
  teams: Team[];
  joinRequests: JoinRequest[];
  submissions: Submission[];
  leaderboard: LeaderboardEntry[];
  scoreRecords: ScoreRecord[];
  scoringConfig: ScoringConfig;
  announcements: Announcement[];
  experts: typeof mockExperts;
  admins: typeof mockAdmins;
  users: User[];
  registeredPasswords: Record<string, string>;
  refreshAnnouncements: () => Promise<void>;
  getAnnouncementById: (id: string) => Announcement | undefined;
  // [API] 对接点：全局数据初始化方法 — 对接后端后取消注释并实现
  // initializeApp: () => Promise<void>;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  register: (name: string, email: string, password?: string, role?: UserRole) => boolean;
  getHackathonById: (id: string) => Hackathon | undefined;
  getTeamById: (id: string) => Team | undefined;
  getTeamsByHackathon: (hackathonId: string) => Team[];
  createHackathon: (hackathon: Partial<Hackathon>) => Hackathon | null;
  updateHackathon: (hackathon: Hackathon) => void;
  deleteHackathon: (id: string) => boolean;
  getUserTeams: () => Team[];
  createTeam: (name: string, description: string, hackathonId: string, initialMembers?: User[]) => Team | null;
  requestJoinTeam: (teamId: string) => boolean;
  approveJoinRequest: (requestId: string) => boolean;
  rejectJoinRequest: (requestId: string) => boolean;
  getPendingJoinRequests: (teamId: string) => JoinRequest[];
  getUserJoinRequests: () => JoinRequest[];
  isTeamLeader: (teamId: string) => boolean;
  canTeamSubmit: (teamId: string) => boolean;
  canJoinTeam: (teamId: string) => boolean;
  leaveTeam: () => void;
  submitProject: (submission: Partial<Submission>) => Submission | null;
  deleteSubmission: (submissionId: string) => boolean;
  getSubmissionById: (id: string) => Submission | undefined;
  getTeamSubmissions: (teamId: string) => Submission[];
  runAIScoring: (submissionId: string) => void;
  /** 保存评分权重配置：写入 store 并持久化，影响 AI 评分与加权总分计算 */
  setScoringConfig: (config: ScoringConfig) => void;
  submitExpertScore: (expertScore: ExpertScore) => void;
  /** [API] 尽力而为：后端可用时拉取真实待评审列表并合并进 store（失败静默，保持 mock） */
  fetchPendingReviews: () => Promise<void>;
  /** [API] 尽力而为：拉取公开榜单（无需登录），后端不可用时保持 mock 数据 */
  refreshRankings: () => Promise<void>;
  getScoreRecord: (submissionId: string) => ScoreRecord | undefined;
  getLeaderboardByHackathon: (hackathonId: string) => LeaderboardEntry[];
  isUserRole: (role: UserRole) => boolean;
  switchRole: (role: UserRole) => void;
  getUserSubmissions: () => Submission[];
  getPendingReviews: () => { submission: Submission; team: Team }[];
  getAvailableUsers: () => User[];
  updateUserRole: (userId: string, newRole: UserRole) => boolean;
  deleteUser: (userId: string) => boolean;
}

// 用户提交的作品持久化（刷新不丢失）：
// mock 作品仍在内存，用户自己提交/删除的作品读写 localStorage（key: hackathon_user_submissions）
const USER_SUBMISSIONS_KEY = 'hackathon_user_submissions';

function loadUserSubmissions(): Submission[] {
  try {
    const raw = localStorage.getItem(USER_SUBMISSIONS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveUserSubmissions(list: Submission[]) {
  try {
    localStorage.setItem(USER_SUBMISSIONS_KEY, JSON.stringify(list));
  } catch {
    // 存储失败静默降级（如隐私模式/空间不足）
  }
}

// ============================================
// 管理员对赛事的增/改/删持久化（关掉重开链接后仍保留）
// mock 赛事（mockData）为基础，本地改动按 id 覆盖合并，key: hackathon_overrides
// ============================================
const HACKATHON_OVERRIDES_KEY = 'hackathon_overrides';

interface HackathonLocalChanges {
  /** 对 mock 赛事的字段覆盖（编辑保存后整体快照，key 为赛事 id） */
  edits: Record<string, Partial<Hackathon>>;
  /** 管理员新建的赛事（保存完整对象） */
  created: Hackathon[];
  /** 被管理员删除的 mock 赛事 id */
  deleted: string[];
}

function loadHackathonLocalChanges(): HackathonLocalChanges {
  try {
    const raw = localStorage.getItem(HACKATHON_OVERRIDES_KEY);
    if (!raw) return { edits: {}, created: [], deleted: [] };
    const parsed = JSON.parse(raw);
    return {
      edits: parsed.edits || {},
      created: Array.isArray(parsed.created) ? parsed.created : [],
      deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [],
    };
  } catch {
    return { edits: {}, created: [], deleted: [] };
  }
}

function saveHackathonLocalChanges(changes: HackathonLocalChanges) {
  try {
    localStorage.setItem(HACKATHON_OVERRIDES_KEY, JSON.stringify(changes));
  } catch {
    // 存储失败静默降级
  }
}

const SCORING_CONFIG_KEY = 'hackathon_scoring_config';

/** 读取本地评分权重配置；无数据或结构非法时回退 mock 默认配置 */
function loadScoringConfig(): ScoringConfig {
  try {
    const raw = localStorage.getItem(SCORING_CONFIG_KEY);
    if (!raw) return mockScoringConfig;
    const parsed = JSON.parse(raw);
    // 结构校验：避免旧数据/脏数据让 AI 评分与加权总分计算崩溃
    if (typeof parsed?.aiWeight !== 'number'
      || typeof parsed?.expertWeight !== 'number'
      || !Array.isArray(parsed?.criteria)) {
      return mockScoringConfig;
    }
    return parsed as ScoringConfig;
  } catch {
    return mockScoringConfig;
  }
}

function saveScoringConfig(config: ScoringConfig) {
  try {
    localStorage.setItem(SCORING_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // 存储失败静默降级（如隐私模式/空间不足）
  }
}

/** 合并 mock 基础赛事与本地增改，得到最终赛事列表 */
function buildHackathons(): Hackathon[] {
  const { edits, created, deleted } = loadHackathonLocalChanges();
  const deletedIds = deleted.map(String);
  const base = mockHackathons
    .filter(h => !deletedIds.includes(String(h.id)))
    .map(h => {
      const override = edits[String(h.id)];
      return override ? { ...h, ...override } : h;
    });
  return [...base, ...created];
}

// 前端评分维度 criteriaId → 后端评分维度名称关键词映射（用于提交真实评分时匹配 dimensionId）
const CRITERIA_NAME_KEYWORDS: Record<string, string[]> = {
  innovation: ['创新', 'innovation'],
  technical: ['技术', 'technical'],
  practicality: ['实用', 'practical'],
  business: ['商业', 'business'],
};

/**
 * 尽力而为：把专家评分同步到后端（POST /api/expert/scores，按维度逐条提交）
 * - 仅当已登录获得 JWT token、且作品/赛事为后端真实数字 id 时才尝试
 * - 维度通过名称关键词映射（匹配不到时按顺序兜底）
 * - 任何失败均静默降级，不影响本地 Mock 主链路
 */
async function pushExpertScoreToBackend(expertScore: ExpertScore, hackathonId: string) {
  try {
    if (!localStorage.getItem('token')) return;
    const submissionId = Number(expertScore.submissionId);
    const competitionId = Number(hackathonId);
    if (!Number.isFinite(submissionId) || submissionId <= 0) return;
    if (!Number.isFinite(competitionId) || competitionId <= 0) return;

    const dimensions = await getExpertDimensionsAPI(competitionId);
    if (!Array.isArray(dimensions) || dimensions.length === 0) return;

    for (let i = 0; i < expertScore.scores.length; i++) {
      const criteria = expertScore.scores[i];
      const keywords = CRITERIA_NAME_KEYWORDS[criteria.criteriaId] || [];
      const dimension =
        dimensions.find(d => keywords.some(kw => String(d.name || '').toLowerCase().includes(kw))) ??
        dimensions[i];
      if (!dimension) continue;

      await submitExpertScoreAPI({
        submissionId,
        dimensionId: dimension.id,
        score: criteria.score,
        comment: expertScore.comment,
      });
    }
  } catch (error) {
    console.warn('专家评分同步到后端失败（已降级为本地 Mock）', error);
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  userRole: 'viewer',
  // [API] 对接点：初始状态应从 API 获取，而非 mock 数据
  // 对接后：hackathons: [], teams: [], submissions: [], 等，然后通过 initializeAppData() 异步加载
  // 合并 mock 赛事 + 本地增改（管理员改过的结束时间等字段在重开后依然生效）
  hackathons: buildHackathons(),
  teams: mockTeams,
  joinRequests: [],
  submissions: [...mockSubmissions, ...mockAdditionalSubmissions, ...loadUserSubmissions()],
  leaderboard: mockLeaderboard,
  scoreRecords: mockScoreRecords,
  scoringConfig: loadScoringConfig(),
  announcements: mockAnnouncements,
  experts: mockExperts,
  admins: mockAdmins,
  users: [...mockUsers, ...mockExperts, ...mockAdmins],
  registeredPasswords: {},

  // [API] 对接点：login 应改为调用 loginAPI，成功后存储 token
  login: (email, password) => {
    const state = get();
    const user = mockUsers.find(u => u.email === email);
    if (user && password === 'demo123') {
      // 优先使用 state.users 中的角色（管理员可修改）
      const updatedUser = state.users.find(u => u.id === user.id);
      const role = updatedUser?.role || 'player';
      set({ user: updatedUser || user, isAuthenticated: true, userRole: role });
      return true;
    }
    
    const expert = mockExperts.find(e => e.email === email);
    if (expert && password === 'expert123') {
      const updatedUser = state.users.find(u => u.id === expert.id);
      const role = updatedUser?.role || 'expert';
      set({ user: updatedUser || expert, isAuthenticated: true, userRole: role });
      return true;
    }
    
    const admin = mockAdmins.find(a => a.email === email);
    if (admin && password === 'admin123') {
      const updatedUser = state.users.find(u => u.id === admin.id);
      const role = updatedUser?.role || 'admin';
      set({ user: updatedUser || admin, isAuthenticated: true, userRole: role });
      return true;
    }
    
    // 检查自注册用户
    const registeredUser = state.users.find(u => u.email === email);
    if (registeredUser && state.registeredPasswords[email] === password) {
      set({ user: registeredUser, isAuthenticated: true, userRole: registeredUser.role });
      return true;
    }
    
    return false;
  },

  logout: () => {
    // 清除登录凭证，避免切换账号后仍沿用上一账号的 token 访问接口
    try {
      localStorage.removeItem('token');
    } catch {
      // 存储不可用静默降级
    }
    set({ user: null, isAuthenticated: false, userRole: 'viewer' });
  },

  // [API] 对接点：register 应改为调用 registerAPI，成功后自动 login
  register: (name, email, password, role = 'player') => {
    const existingUser = get().users.find(u => u.email === email);
    if (existingUser) return false;
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      bio: '',
      skills: [],
      role,
    };
    const state = get();
    set({
      users: [...state.users, newUser],
      registeredPasswords: { ...state.registeredPasswords, [email]: password || 'demo123' },
    });
    return true;
  },

  switchRole: (role) => {
    set({ userRole: role });
  },

  refreshAnnouncements: async () => {
    try {
      const announcements = await getAnnouncements();
      set({
        announcements: announcements.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime()),
      });
    } catch (error) {
      console.warn('公告刷新失败，使用本地 mock 数据', error);
      set(state => ({
        announcements: [...state.announcements].sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime()),
      }));
    }
  },

  getAnnouncementById: (id) => {
    return get().announcements.find((announcement) => announcement.id === id);
  },

  // [API] 对接点：getHackathonById 应改为调用 getHackathonByIdAPI(id)
  getHackathonById: (id) => {
    return get().hackathons.find(h => h.id === id);
  },

  // [API] 对接点：createHackathon 应改为 async，调用 createHackathonAPI
  createHackathon: (hackathon) => {
    const startDate = hackathon.startDate || new Date().toISOString().split('T')[0];
    const endDate = hackathon.endDate || new Date().toISOString().split('T')[0];
    const newHackathon: Hackathon = {
      id: `hack-${Date.now()}`,
      title: hackathon.title || '未命名竞赛',
      description: hackathon.description || '',
      coverImage: hackathon.coverImage || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=675&fit=crop',
      startDate,
      endDate,
      status: hackathon.status || 'draft',
      prizes: hackathon.prizes || [],
      categories: hackathon.categories || ['通用'],
      maxParticipants: hackathon.maxParticipants || 100,
      currentParticipants: hackathon.currentParticipants || 0,
      organizers: hackathon.organizers || [],
      location: hackathon.location || '',
      isVirtual: hackathon.isVirtual ?? true,
      rules: hackathon.rules || [],
      minTeamSize: hackathon.minTeamSize || 1,
      maxTeamSize: hackathon.maxTeamSize || 5,
      registrationOpenTime: hackathon.registrationOpenTime || startDate,
      registrationDeadline: hackathon.registrationDeadline || startDate,
      submissionDeadline: hackathon.submissionDeadline || startDate,
      judgingDeadline: hackathon.judgingDeadline || endDate,
      announcementTime: hackathon.announcementTime || endDate,
    };
    set(state => ({
      hackathons: [...state.hackathons, newHackathon],
    }));
    // 持久化新建赛事，刷新/重开链接后仍保留
    const changes = loadHackathonLocalChanges();
    changes.created = [newHackathon, ...changes.created];
    saveHackathonLocalChanges(changes);
    return newHackathon;
  },

  // [API] 对接点：updateHackathon 应改为 async，调用 updateHackathonAPI
  updateHackathon: (hackathon) => {
    set(state => ({
      hackathons: state.hackathons.map(h =>
        h.id === hackathon.id ? { ...h, ...hackathon } : h
      ),
    }));
    // 持久化修改：关掉重开链接后新时间依然生效
    const changes = loadHackathonLocalChanges();
    const key = String(hackathon.id);
    if (mockHackathons.some(m => String(m.id) === key)) {
      changes.edits[key] = { ...changes.edits[key], ...hackathon };
    } else {
      changes.created = changes.created.map(c =>
        String(c.id) === key ? { ...c, ...hackathon } : c
      );
    }
    saveHackathonLocalChanges(changes);
  },

  // [API] 对接点：deleteHackathon 应改为 async，调用 deleteHackathonAPI
  deleteHackathon: (id) => {
    const { hackathons } = get();
    const hackathon = hackathons.find(h => h.id === id);
    if (!hackathon) return false;
    set(state => ({
      hackathons: state.hackathons.filter(h => h.id !== id),
    }));
    // 持久化删除：mock 赛事记删除标记，新建赛事直接移除
    const changes = loadHackathonLocalChanges();
    if (mockHackathons.some(m => String(m.id) === id)) {
      if (!changes.deleted.includes(id)) changes.deleted.push(id);
    } else {
      changes.created = changes.created.filter(c => String(c.id) !== id);
    }
    saveHackathonLocalChanges(changes);
    return true;
  },

  getTeamById: (id) => {
    return get().teams.find(t => t.id === id);
  },

  getTeamsByHackathon: (hackathonId) => {
    return get().teams.filter(t => t.hackathonId === hackathonId);
  },

  getUserTeams: () => {
    const { user, teams } = get();
    if (!user) return [];
    return teams.filter(t => t.members.some(m => m.id === user.id));
  },

  // [API] 对接点：createTeam 应改为 async，调用 createTeamAPI
  createTeam: (name, description, hackathonId, initialMembers = []) => {
    const { user, hackathons } = get();
    if (!user) return null;

    const hackathon = hackathons.find(h => h.id === hackathonId);
    if (!hackathon) return null;

    const members = [user, ...initialMembers.filter(m => m.id !== user.id)];
    const minTeamSize = hackathon.minTeamSize ?? 1;
    const maxTeamSize = hackathon.maxTeamSize ?? 5;

    if (members.length < minTeamSize) {
      return null;
    }
    if (members.length > maxTeamSize) {
      return null;
    }

    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name,
      description,
      members,
      hackathonId: String(hackathonId),
      createdAt: new Date().toISOString(),
      maxMembers: maxTeamSize,
      minMembers: minTeamSize,
      leaderId: String(user.id),
    };

    set(state => ({
      teams: [...state.teams, newTeam],
      user: { ...user, teamId: String(newTeam.id) },
    }));

    return newTeam;
  },

  // [API] 对接点：requestJoinTeam 应改为 async，调用 joinTeam(teamId)
  requestJoinTeam: (teamId) => {
    const { user, teams, joinRequests } = get();
    if (!user) return false;

    const team = teams.find(t => t.id === teamId);
    if (!team) return false;

    if (team.members.find(m => m.id === user.id)) return false;

    if (team.members.length >= team.maxMembers) return false;

    const existingRequest = joinRequests.find(r => r.teamId === teamId && r.userId === user.id && r.status === 'pending');
    if (existingRequest) return false;

    const newRequest: JoinRequest = {
      id: `request-${Date.now()}`,
      teamId,
      userId: String(user.id),
      userName: user.name,
      userEmail: user.email,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    set(state => ({
      joinRequests: [...state.joinRequests, newRequest],
    }));

    return true;
  },

  approveJoinRequest: (requestId) => {
    const { joinRequests, teams, user } = get();
    const request = joinRequests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') return false;

    const team = teams.find(t => t.id === request.teamId);
    if (!team || team.members.length >= team.maxMembers) return false;

    const joiningUser = mockUsers.find(u => u.id === request.userId) || mockExperts.find(u => u.id === request.userId);
    if (!joiningUser) return false;

    set(state => ({
      joinRequests: state.joinRequests.map(r =>
        r.id === requestId ? { ...r, status: 'approved' as const } : r
      ),
      teams: state.teams.map(t =>
        t.id === request.teamId ? { ...t, members: [...t.members, joiningUser] } : t
      ),
      users: state.users.map(u =>
        u.id === request.userId ? { ...u, teamId: request.teamId } : u
      ),
      user: user?.id === request.userId ? { ...user, teamId: request.teamId } : state.user,
    }));

    return true;
  },

  rejectJoinRequest: (requestId) => {
    const { joinRequests } = get();
    const request = joinRequests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') return false;

    set(state => ({
      joinRequests: state.joinRequests.map(r => 
        r.id === requestId ? { ...r, status: 'rejected' as const } : r
      ),
    }));

    return true;
  },

  getPendingJoinRequests: (teamId) => {
    const { joinRequests } = get();
    return joinRequests.filter(r => r.teamId === teamId && r.status === 'pending');
  },

  getUserJoinRequests: () => {
    const { user, joinRequests } = get();
    if (!user) return [];
    return joinRequests.filter(r => r.userId === user.id);
  },

  isTeamLeader: (teamId) => {
    const { user, teams } = get();
    if (!user) return false;
    const team = teams.find(t => t.id === teamId);
    return team?.leaderId === user.id;
  },

  canTeamSubmit: (teamId) => {
    const { teams } = get();
    const team = teams.find(t => t.id === teamId);
    if (!team) return false;
    return team.members.length >= team.minMembers;
  },

  canJoinTeam: (teamId) => {
    const { user, teams, joinRequests, getUserTeams } = get();
    if (!user) return false;

    const team = teams.find(t => t.id === teamId);
    if (!team) return false;

    if (team.members.find(m => m.id === user.id)) return false;

    if (team.members.length >= team.maxMembers) return false;

    const userTeams = getUserTeams();
    const userHackathonIds = userTeams.map(t => t.hackathonId);
    if (userHackathonIds.includes(team.hackathonId)) return false;

    const existingRequest = joinRequests.find(r => r.teamId === teamId && r.userId === user.id && r.status === 'pending');
    if (existingRequest) return false;

    return true;
  },

  // [API] 对接点：leaveTeam 应改为 async，调用 leaveTeamAPI
  leaveTeam: () => {
    const { user, teams } = get();
    if (!user) return false;

    const team = teams.find(t => t.members.some(m => m.id === user.id));
    if (!team) return false;

    set(state => {
      let updatedTeams = state.teams.map(t => {
        if (t.id === team.id) {
          const newMembers = t.members.filter(m => m.id !== user.id);
          let newLeaderId = t.leaderId;
          if (t.leaderId === user.id && newMembers.length > 0) {
            newLeaderId = String(newMembers[0].id);
          }
          return { ...t, members: newMembers, leaderId: newLeaderId };
        }
        return t;
      });

      updatedTeams = updatedTeams.filter(t => {
        if (t.id === team.id) {
          return t.members.length > 0;
        }
        return true;
      });

      return {
        teams: updatedTeams,
        user: { ...user, teamId: undefined },
      };
    });

    return true;
  },

  // [API] 对接点：submitProject 应改为 async，调用 createSubmissionAPI
  submitProject: (submission) => {
    const { user, submissions } = get();
    if (!user) return null;

    const teamId = submission.teamId || user.teamId;
    if (!teamId) return null;

    const team = get().teams.find(t => t.id === teamId);
    const hackathonId = submission.hackathonId || team?.hackathonId;
    if (!hackathonId) return null;

    // 一个团队在同一竞赛下只能提交一个作品（支持报名用户提交，teamId 可能是 reg_ 前缀）
    const existingSubmission = submissions.find(
      s => s.hackathonId === hackathonId && (
        s.teamId === teamId ||
        // 同一用户在同一竞赛的重复提交也拦截
        (s.teamId.startsWith(`reg_${user.id}_`) && teamId.startsWith(`reg_${user.id}_`))
      )
    );
    if (existingSubmission) return null;

    const newSubmission: Submission = {
      id: `sub-${Date.now()}`,
      teamId,
      hackathonId,
      title: submission.title || '',
      description: submission.description || '',
      technology: submission.technology || [],
      videoUrl: submission.videoUrl,
      githubUrl: submission.githubUrl,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };

    set(state => ({
      submissions: [...state.submissions, newSubmission],
    }));

    // 持久化到 localStorage，刷新后仍存在
    saveUserSubmissions([...loadUserSubmissions(), newSubmission]);

    return newSubmission;
  },

  // [API] 对接点：deleteSubmission 应改为 async，调用后端删除接口
  deleteSubmission: (submissionId) => {
    const { user, submissions, teams } = get();
    if (!user) return false;

    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return false;

    const team = teams.find(t => t.id === submission.teamId);

    // 权限检查：队长可删 / 团队成员可删 / 提交者本人可删（支持报名提交场景）
    const isLeader = team?.leaderId === user.id;
    const isTeamMember = team?.members.some(m => m.id === user.id);
    const isSubmitterViaRegistration = !team && submission.teamId.startsWith(`reg_${user.id}_`);

    if (!isLeader && !isTeamMember && !isSubmitterViaRegistration) return false;

    set(state => ({
      submissions: state.submissions.filter(s => s.id !== submissionId),
      scoreRecords: state.scoreRecords.filter(r => r.submissionId !== submissionId),
    }));

    // 同步删除 localStorage 中持久化的用户作品
    saveUserSubmissions(loadUserSubmissions().filter(s => s.id !== submissionId));

    return true;
  },

  getSubmissionById: (id) => {
    return get().submissions.find(s => s.id === id);
  },

  getTeamSubmissions: (teamId) => {
    return get().submissions.filter(s => s.teamId === teamId);
  },

  getUserSubmissions: () => {
    const { user, teams, submissions } = get();
    if (!user) return [];
    // 检查用户是否已报名该竞赛
    const registrations = JSON.parse(
      localStorage.getItem('hackathon_registrations') || '{}'
    );
    const registeredHackathonIds = new Set(
      Object.keys(registrations)
        .filter((k: string) => k.endsWith(`_${user.id}`))
        .map((k: string) => k.replace(`_${user.id}`, ''))
    );
    // 只返回真正属于当前用户且已报名竞赛的提交
    return submissions.filter(s => {
      if (!registeredHackathonIds.has(s.hackathonId)) return false;
      const team = teams.find(t => t.id === s.teamId);
      // 方式1: 用户是该提交所在团队的成员
      if (team?.members.some(m => m.id === user.id)) return true;
      // 方式2: 用户通过报名提交的（teamId 以 reg_ 开头且包含用户ID）
      if (s.teamId.startsWith(`reg_${user.id}_`)) return true;
      // 方式3: 兼容 user.teamId（旧逻辑）
      if (s.teamId === user.teamId) return true;
      return false;
    });
  },

  // [API] 对接点：runAIScoring 应改为 async，调用 runAIScoringAPI(submissionId)
  // 删除前端 simulateAIScoring，结果由后端返回
  setScoringConfig: (config) => {
    set({ scoringConfig: config });
    saveScoringConfig(config);
  },

  runAIScoring: (submissionId) => {
    const { submissions, scoringConfig, scoreRecords } = get();
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;

    const aiScore = simulateAIScoring(submission, scoringConfig);
    
    const existingRecord = scoreRecords.find(r => r.submissionId === submissionId);
    
    if (existingRecord) {
      const updatedRecord = {
        ...existingRecord,
        aiScore,
        finalScore: calculateWeightedScore(aiScore, existingRecord.expertScores, scoringConfig),
      };
      set(state => ({
        scoreRecords: state.scoreRecords.map(r => 
          r.submissionId === submissionId ? updatedRecord : r
        ),
      }));
    } else {
      const newRecord: ScoreRecord = {
        submissionId,
        teamId: submission.teamId,
        hackathonId: submission.hackathonId,
        aiScore,
        expertScores: [],
        finalScore: aiScore.totalScore,
      };
      set(state => ({
        scoreRecords: [...state.scoreRecords, newRecord],
      }));
    }
  },

  // [API] 对接点：submitExpertScore 应改为 async，调用 submitExpertScoreAPI
  submitExpertScore: (expertScore) => {
    const { scoreRecords, submissions } = get();
    const submission = submissions.find(s => s.id === expertScore.submissionId);
    if (!submission) return;

    const existingRecord = scoreRecords.find(r => r.submissionId === expertScore.submissionId);
    
    if (existingRecord) {
      const updatedRecord = updateScoreRecordWithExpertScore(existingRecord, expertScore);
      set(state => ({
        scoreRecords: state.scoreRecords.map(r => 
          r.submissionId === expertScore.submissionId ? updatedRecord : r
        ),
      }));
    } else {
      const newRecord: ScoreRecord = {
        submissionId: expertScore.submissionId,
        teamId: submission.teamId,
        hackathonId: submission.hackathonId,
        expertScores: [expertScore],
        finalScore: expertScore.totalScore,
      };
      set(state => ({
        scoreRecords: [...state.scoreRecords, newRecord],
      }));
    }

    // [API] 尽力而为：后端可用（已登录获得 JWT 且作品/赛事为真实数字 id）时，
    // 按评分维度逐条提交到 POST /api/expert/scores，失败静默降级（不影响本地 Mock 结果）
    void pushExpertScoreToBackend(expertScore, submission.hackathonId);
  },

  fetchPendingReviews: async () => {
    // [API] 尽力而为：真实待评审列表合并进 store（仅追加缺失项，不覆盖 Mock）
    if (!localStorage.getItem('token')) return;
    try {
      const reviews = await getMyPendingReviewsAPI();
      if (!Array.isArray(reviews) || reviews.length === 0) return;
      set(state => {
        const knownIds = new Set(state.submissions.map(s => String(s.id)));
        const knownTeams = new Set(state.teams.map(t => String(t.id)));
        const newSubmissions: Submission[] = [];
        const newTeams: Team[] = [];
        for (const r of reviews) {
          if (!r.submissionId || knownIds.has(String(r.submissionId))) continue;
          const teamId = `remote-team-${r.teamId ?? r.submissionId}`;
          newSubmissions.push({
            id: String(r.submissionId),
            teamId,
            hackathonId: String(r.competitionId),
            title: r.title || '未命名作品',
            description: r.description || '',
            technology: [],
            fileUrl: r.fileUrl || undefined,
            status: 'submitted',
            createdAt: r.submittedAt || new Date().toISOString(),
          });
          if (!knownTeams.has(teamId)) {
            newTeams.push({
              id: teamId,
              name: r.teamName || r.authorName || '参赛团队',
              description: '',
              members: [],
              hackathonId: String(r.competitionId),
              createdAt: r.submittedAt || new Date().toISOString(),
              maxMembers: 5,
              minMembers: 1,
              leaderId: '',
            });
          }
        }
        if (newSubmissions.length === 0) return state;
        return {
          submissions: [...state.submissions, ...newSubmissions],
          teams: [...state.teams, ...newTeams],
        };
      });
    } catch (error) {
      console.warn('拉取真实待评审列表失败，使用本地 Mock 数据', error);
    }
  },

  refreshRankings: async () => {
    // [API] 尽力而为：拉取公开榜单（GET /api/public/rankings/**，无需登录），
    // 后端不可用时保持 Mock 榜单数据
    const { hackathons } = get();
    const numericIds = hackathons
      .map(h => Number(h.id))
      .filter(id => Number.isFinite(id) && id > 0);
    if (numericIds.length === 0) return;
    try {
      const results = await Promise.all(
        numericIds.map(id => getCompetitionRankingAPI(id).catch(() => []))
      );
      set(state => {
        let records = [...state.scoreRecords];
        results.forEach((entries, idx) => {
          if (!Array.isArray(entries) || entries.length === 0) return;
          const hackathonId = String(numericIds[idx]);
          for (const entry of entries) {
            const submissionId = entry.id != null ? String(entry.id) : null;
            if (!submissionId) continue;
            const finalScore = Number(entry.totalScore ?? 0);
            const existing = records.find(r => r.submissionId === submissionId);
            if (existing) {
              records = records.map(r =>
                r.submissionId === submissionId
                  ? { ...r, finalScore, rank: entry.rank ?? entry.rankNo ?? r.rank }
                  : r
              );
            } else {
              records.push({
                submissionId,
                teamId: `remote-team-${entry.teamId ?? submissionId}`,
                hackathonId,
                expertScores: [],
                finalScore,
                rank: entry.rank ?? entry.rankNo,
                aiScoreValue: entry.aiScore != null ? Number(entry.aiScore) : undefined,
                expertScoreValue: entry.expertScore != null ? Number(entry.expertScore) : undefined,
              });
            }
          }
        });
        return { scoreRecords: records };
      });
    } catch (error) {
      console.warn('拉取公开榜单失败，使用本地 Mock 数据', error);
    }
  },

  getScoreRecord: (submissionId) => {
    return get().scoreRecords.find(r => r.submissionId === submissionId);
  },

  // [API] 对接点：getLeaderboardByHackathon 应改为 async，调用 getLeaderboardAPI
  getLeaderboardByHackathon: (hackathonId) => {
    const { scoreRecords, teams, submissions, users } = get();

    const hackathonRecords = scoreRecords
      .filter(r => r.hackathonId === hackathonId)
      .map(record => {
        let team = teams.find(t => t.id === record.teamId);
        if (!team && String(record.teamId).startsWith('reg_')) {
          const userId = String(record.teamId).replace(/^reg_/, '').split('_')[0];
          const submitter = users.find(u => u.id === userId);
          if (submitter) team = { id: String(record.teamId), name: `${submitter.name} 的团队`, description: '', members: [submitter], hackathonId: String(record.hackathonId), createdAt: new Date().toISOString(), maxMembers: 5, minMembers: 1, leaderId: String(submitter.id) };
        }
        const submission = submissions.find(s => s.id === record.submissionId);
        if (!team || !submission) return null;
        
        return {
          rank: 0,
          team,
          submission,
          score: record.finalScore,
        };
      })
      .filter(Boolean) as LeaderboardEntry[];

    return hackathonRecords
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  },

  isUserRole: (role) => {
    return get().userRole === role;
  },

  getPendingReviews: () => {
    const { submissions, teams, scoreRecords, user, users } = get();
    
    return submissions
      .filter(s => s.status !== 'draft')
      .map(submission => {
        let team = teams.find(t => t.id === submission.teamId);
        // 处理用户通过报名提交的作品（teamId 以 reg_ 开头）
        if (!team && String(submission.teamId).startsWith('reg_')) {
          const userId = String(submission.teamId).replace(/^reg_/, '').split('_')[0];
          const submitter = users.find(u => u.id === userId);
          if (submitter) {
            team = { id: String(submission.teamId), name: `${submitter.name} 的团队`, description: '', members: [submitter], hackathonId: String(submission.hackathonId), createdAt: submission.createdAt, maxMembers: 5, minMembers: 1, leaderId: String(submitter.id) };
          }
        }
        if (!team) return null;
        const record = scoreRecords.find(r => r.submissionId === submission.id);
        if (record && record.expertScores.length >= 3) return null;
        if (record && user && record.expertScores.some(es => es.expertId === user.id)) return null;
        return { submission, team };
      })
      .filter(Boolean) as { submission: Submission; team: Team }[];
  },

  getAvailableUsers: () => {
    const { user, users } = get();
    if (!user) return [];
    return users.filter(u => u.id !== user.id && !u.email.includes('expert') && !u.email.includes('admin'));
  },

  // [API] 对接点：updateUserRole 应改为 async，调用后端用户角色更新接口
  updateUserRole: (userId, newRole) => {
    const state = get();
    const targetUser = state.users.find(u => u.id === userId);
    if (!targetUser) return false;

    set(state => ({
      users: state.users.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ),
    }));

    // 如果修改的是当前登录用户本身，同步更新 userRole
    if (state.user?.id === userId) {
      set({ userRole: newRole });
    }

    return true;
  },

  // [API] 对接点：deleteUser 应改为 async，调用后端用户注销接口
  deleteUser: (userId) => {
    const state = get();
    const targetUser = state.users.find(u => u.id === userId);
    if (!targetUser) return false;

    // 禁止管理员注销自己
    if (state.user?.id === userId) return false;

    set(state => ({
      users: state.users.filter(u => u.id !== userId),
    }));

    return true;
  },

  // ============================================
  //   [API] 对接方法模板（对接后端时取消注释并实现）
  // ============================================
  //
  // initializeApp: async () => {
  //   try {
  //     const token = localStorage.getItem('token');
  //     if (!token) return;
  //
  //     const [hackathons, teams, submissions, user] = await Promise.all([
  //       getHackathons(),
  //       getTeams(),
  //       getSubmissions(),
  //       getUserInfo(),
  //     ]);
  //
  //     set({
  //       hackathons,
  //       teams,
  //       submissions,
  //       user,
  //       isAuthenticated: true,
  //       userRole: user.role,
  //     });
  //   } catch (error) {
  //     console.error('数据初始化失败:', error);
  //     // 401 时 request.ts 拦截器会自动跳转登录页
  //   }
  // },
}));
