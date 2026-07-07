export interface User {
  id: string | number;
  username?: string;
  name: string;
  nickname?: string;
  email: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
  teamId?: string;
  role: UserRole;
  createdAt?: string;
  token?: string;
}

export type UserRole = 'player' | 'expert' | 'admin' | 'viewer';

export interface Expert extends User {
  role: 'expert';
  expertise: string[];
  ratingCount: number;
}

export interface Admin extends User {
  role: 'admin';
}

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

export interface JoinRequest {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: JoinRequestStatus;
  createdAt: string;
}

export interface TeamMember {
  id: string | number;
  username?: string;
  name: string;
  role: 'captain' | 'member';
  avatar?: string;
}

export interface Team {
  id: string | number;
  name: string;
  description?: string;
  members: User[];
  hackathonId: string;
  createdAt: string;
  maxMembers: number;
  minMembers: number;
  leaderId: string;
}

export interface Prize {
  rank: number;
  amount: number;
  description: string;
}

export interface ScoreDimension {
  id: number;
  name: string;
  weight: number;
  maxScore: number;
}

export type CompetitionStatus = 'draft' | 'registration_open' | 'registration_closed' | 'competition_running' | 'judging' | 'results_announced';

export interface Hackathon {
  id: string | number;
  title: string;
  description: string;
  coverImage?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  status: CompetitionStatus;
  prizes?: Prize[];
  categories?: string[];
  maxParticipants?: number;
  currentParticipants?: number;
  organizers?: string[];
  location?: string;
  isVirtual?: boolean;
  rules?: string[];
  minTeamSize?: number;
  maxTeamSize?: number;
  competitionType?: 'team' | 'individual';
  registrationOpenTime?: string;
  registrationDeadline?: string;
  submissionDeadline?: string;
  judgingDeadline?: string;
  announcementTime?: string;
  scoreDimensions?: ScoreDimension[];
}

export type SubmissionStatus = 'draft' | 'submitted' | 'scoring' | 'scored';

export interface Submission {
  id: string | number;
  teamId: string;
  hackathonId: string;
  title: string;
  description?: string;
  technology: string[];
  videoUrl?: string;
  githubUrl?: string;
  score?: number;
  status?: SubmissionStatus;
  fileUrl?: string;
  fileSize?: number;
  submittedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ScoreCriteria {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  weight: number;
}

export interface CriteriaScore {
  criteriaId: string;
  score: number;
  feedback?: string;
}

export interface AIScore {
  submissionId: string | number;
  scores: CriteriaScore[];
  totalScore: number;
  feedback: string;
  evaluatedAt: string;
}

export interface ExpertScore {
  expertId: string;
  expertName: string;
  submissionId: string;
  scores: CriteriaScore[];
  totalScore: number;
  comment?: string;
  evaluatedAt?: string;
}

export interface ScoreBreakdown {
  innovation: number;
  technical: number;
  practicality: number;
  business: number;
  aiScore?: number;
  expertAvgScore?: number;
  expertCount?: number;
}

export interface ScoreRecord {
  submissionId: string;
  teamId: string;
  hackathonId: string;
  aiScore?: AIScore;
  expertScores: ExpertScore[];
  finalScore: number;
  rank?: number;
  aiScoreValue?: number;
  expertScoreValue?: number;
  aiDetails?: AIDetailScore[];
  expertDetails?: ExpertDetailScore[];
}

export interface LeaderboardEntry {
  rank: number;
  team: Team;
  submission: Submission;
  score: number;
  scoreBreakdown?: ScoreBreakdown;
  teamName?: string;
  members?: string[];
  totalScore?: number;
  aiScore?: number;
  expertScore?: number;
}

export interface ScoringConfig {
  aiWeight: number;
  expertWeight: number;
  minExpertScores: number;
  criteria: ScoreCriteria[];
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  aiWeight: 0.3,
  expertWeight: 0.7,
  minExpertScores: 3,
  criteria: [
    { id: 'innovation', name: '创新性', description: '项目的创新程度和独特性', maxScore: 100, weight: 0.3 },
    { id: 'technical', name: '技术难度', description: '技术实现的复杂度', maxScore: 100, weight: 0.25 },
    { id: 'practicality', name: '实用性', description: '实际应用价值', maxScore: 100, weight: 0.25 },
    { id: 'business', name: '商业价值', description: '商业化潜力', maxScore: 100, weight: 0.2 },
  ],
};

export interface AIDetailScore {
  dimension: string;
  score: number;
}

export interface ExpertDetailScore {
  dimension: string;
  score: number;
  comment?: string;
}

export type RegistrationStatus = 'not_registered' | 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface Registration {
  id: number;
  competitionId: number;
  userId: number;
  teamId?: number;
  teamName?: string;
  region?: string;
  captainName?: string;
  captainPhone?: string;
  captainEmail?: string;
  members?: {
    fullName: string;
    phone: string;
    email: string;
  }[];
  status: RegistrationStatus;
  registeredAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  withdrawnAt?: string;
  reason?: string;
}

export interface RegistrationStatusResponse {
  status: RegistrationStatus;
  team?: Team;
  registration?: Registration;
}

export interface CommentReply {
  id: number;
  content: string;
  user: { id: number; username: string; nickname?: string };
}

export interface Comment {
  id: number;
  content: string;
  user: { id: number; username: string; nickname?: string };
  createdAt: string;
  likes: number;
  replies?: CommentReply[];
}

export interface Announcement {
  id: string | number;
  title: string;
  content: string;
  priority?: 'high' | 'medium' | 'low';
  createdAt: string;
  date?: string;
  tag?: string;
  status?: string;
}

export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  success?: boolean;
}