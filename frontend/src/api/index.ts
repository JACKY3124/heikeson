// ========== 认证 API ==========
export {
  login,
  register,
  getUserInfo,
} from './auth';
export type { LoginRequest, RegisterRequest } from './auth';

// ========== 竞赛 API ==========
export {
  getCompetitions,
  getCompetitionById,
  registerCompetition,
  getRegistrationStatus,
} from './hackathon';
export type { GetCompetitionsParams, RegisterRequest as CompetitionRegisterRequest } from './hackathon';

// ========== 提交 API ==========
export {
  createSubmission,
  getSubmissions,
  getScoreRecord,
  getLeaderboard,
} from './submission';
export type { CreateSubmissionRequest } from './submission';

// ========== 评论 API ==========
export {
  getComments,
  postComment,
} from './comment';
export type { PostCommentRequest } from './comment';

// ========== 公告 API ==========
export {
  getAnnouncements,
} from './announcement';

// ========== 专家评审 / 公开榜单 API ==========
export {
  getMyPendingReviewsAPI,
  submitExpertScoreAPI,
  getExpertDimensionsAPI,
  getMyExpertScoresAPI,
  getCompetitionRankingAPI,
} from './expert';
export type {
  ExpertPendingReview,
  ExpertScoreRecord,
  CompetitionRankingEntry,
} from './expert';

// ========== 团队 API ==========
export {
  createTeam,
  getTeamById,
  getTeamsByHackathon,
  joinTeam,
  approveJoinRequest,
  rejectJoinRequest,
  getPendingRequests,
  leaveTeam,
  updateTeam,
  deleteTeam,
} from './team';
export type { CreateTeamRequest } from './team';