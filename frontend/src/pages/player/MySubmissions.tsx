import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Star, Users, CheckCircle, BarChart3,
  Plus, Send, ExternalLink, Search, ChevronDown, ChevronUp,
  ChevronDown as ChevronDownIcon, Info, ArrowLeft,
  Trash2, AlertTriangle, Video, Edit3, LogOut, ClipboardList, Save, X,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Card, Badge, Button, Modal } from '@/components/ui';
import {
  getRegistrations as getRegistrationsFromStorage,
  saveRegistration as saveRegistrationToStorage,
  type RegistrationData,
  type TeamMember,
} from '../competition/HackathonRegister';

const TECHNOLOGIES = [
  'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Go', 'Rust',
  'Solidity', 'Ethereum', 'IPFS', 'Machine Learning', 'TensorFlow',
  'PyTorch', 'WebAssembly', 'Docker', 'Kubernetes',
  'Next.js', 'TypeScript', 'GraphQL', 'PostgreSQL', 'MongoDB',
  'Redis', 'RabbitMQ', 'Kafka', 'OpenAI', 'LangChain',
];

function getRegistrations(): Record<string, RegistrationData> {
  return getRegistrationsFromStorage();
}

const CRITERIA = [
  { id: 'innovation', name: '创新性' },
  { id: 'technical_difficulty', name: '技术难度' },
  { id: 'practicality', name: '实用性' },
  { id: 'business_value', name: '商业价值' },
];

const REGIONS = [
  { value: 'south', label: '华南 South China' },
  { value: 'north', label: '华北 North China' },
  { value: 'east', label: '华东 East China' },
  { value: 'hk_macao', label: '港澳 Hong Kong & Macao SARs' },
  { value: 'southeast_asia', label: '东南亚 Southeast Asia' },
];

function getRegionLabel(value: string): string {
  return REGIONS.find(r => r.value === value)?.label || value;
}

interface FormData {
  title: string;
  description: string;
  technology: string[];
  codeUrl: string;
  videoUrl: string;
  teamId: string;
}

export default function MySubmissions() {
  const navigate = useNavigate();
  const { user, hackathons, submissions, teams, scoringConfig, getHackathonById, getScoreRecord, submitProject, deleteSubmission } = useAppStore();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSubmission, setDeletingSubmission] = useState<typeof submissions[0] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    technology: [],
    codeUrl: '',
    videoUrl: '',
    teamId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 报名管理状态
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [viewingRegistration, setViewingRegistration] = useState<RegistrationData | null>(null);
  const [editingRegistration, setEditingRegistration] = useState<RegistrationData | null>(null);
  const [registrationEditMode, setRegistrationEditMode] = useState(false);
  const [regEditForm, setRegEditForm] = useState({
    captainName: '',
    captainPhone: '',
    captainEmail: '',
    teamName: '',
    region: '',
    members: [] as TeamMember[],
  });
  const [regEditErrors, setRegEditErrors] = useState<Record<string, string>>({});

  // 退赛状态
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawingRegistration, setWithdrawingRegistration] = useState<RegistrationData | null>(null);

  // 新增筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHackathon, setFilterHackathon] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scored' | 'pending'>('all');
  const [collapsedHackathons, setCollapsedHackathons] = useState<Set<string>>(new Set());

  const registrations = getRegistrations();

  const userTeams = useMemo(() => {
    if (!user?.id) return [];
    const teamsIn = teams.filter(t => t.members.some(m => m.id === user.id));
    return teamsIn.filter(t => registrations[`${t.hackathonId}_${user.id}`]);
  }, [teams, user, registrations]);

  // 用户所有报名记录
  const userRegistrations = useMemo(() => {
    if (!user?.id) return [];
    return Object.values(registrations).filter(r => r.userId === user.id);
  }, [registrations, user]);

  // 带竞赛信息的报名列表
  const registrationList = useMemo(() => {
    return userRegistrations.map(reg => ({
      ...reg,
      hackathon: getHackathonById(reg.hackathonId),
    })).filter(reg => reg.hackathon);
  }, [userRegistrations, getHackathonById]);

  const userSubmissions = useMemo(() => {
    if (!user?.id) return [];
    const registeredHackathonIds = new Set(
      Object.keys(registrations)
        .filter(k => k.endsWith(`_${user.id}`))
        .map(k => k.replace(`_${user.id}`, ''))
    );
    // 只显示真正属于当前用户且已报名竞赛的提交
    return submissions.filter(s => {
      if (!registeredHackathonIds.has(s.hackathonId)) return false;
      // 方式1: 用户是该提交所在团队的成员
      const team = teams.find(t => t.id === s.teamId);
      if (team?.members.some(m => m.id === user.id)) return true;
      // 方式2: 用户通过报名提交的（teamId 以 reg_ 开头且包含用户ID）
      if (s.teamId.startsWith(`reg_${user.id}_`)) return true;
      return false;
    });
  }, [submissions, teams, user, registrations]);

  const stats = useMemo(() => {
    const total = userSubmissions.length;
    const scored = userSubmissions.filter(s => {
      const r = getScoreRecord(s.id);
      return r && r.aiScore && r.expertScores.length > 0;
    }).length;
    const avgScore = scored > 0
      ? Math.round(userSubmissions.reduce((sum, s) => {
          const r = getScoreRecord(s.id);
          return sum + (r?.finalScore || 0);
        }, 0) / scored * 10) / 10
      : 0;
    return { total, scored, avgScore };
  }, [userSubmissions, getScoreRecord]);

  const submissionsByHackathon = useMemo(() => {
    // 双重安全：只从已报名的竞赛中提取作品
    const registeredIds = new Set(registrationList.map(r => r.hackathonId));
    const map = new Map<string, { hackathon: typeof hackathons[0], submissions: typeof userSubmissions }>();
    userSubmissions.filter(s => registeredIds.has(s.hackathonId)).forEach(s => {
      const h = getHackathonById(s.hackathonId);
      if (!h) return;
      if (!map.has(h.id)) map.set(h.id, { hackathon: h, submissions: [] });
      map.get(h.id)!.submissions.push(s);
    });
    return Array.from(map.values());
  }, [userSubmissions, getHackathonById, registrationList]);

  // 筛选后的提交
  const filteredSubmissionsByHackathon = useMemo(() => {
    return submissionsByHackathon.map(({ hackathon, submissions: hackathonSubs }) => {
      let filtered = hackathonSubs;

      // 按作品名称搜索
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
      }

      // 按竞赛筛选
      if (filterHackathon) {
        if (hackathon.id !== filterHackathon) {
          filtered = [];
        }
      }

      // 按状态筛选
      if (filterStatus !== 'all') {
        filtered = filtered.filter(s => {
          const r = getScoreRecord(s.id);
          const hasScore = r && r.aiScore && r.expertScores.length > 0;
          return filterStatus === 'scored' ? hasScore : !hasScore;
        });
      }

      return { hackathon, submissions: filtered };
    }).filter(({ submissions }) => submissions.length > 0);
  }, [submissionsByHackathon, searchQuery, filterHackathon, filterStatus, getScoreRecord]);

  const avgDimScore = useMemo(() => {
    return CRITERIA.map(c => {
      const scores = userSubmissions.flatMap(s => {
        const r = getScoreRecord(s.id);
        if (!r) return [];
        const ai = r.aiScore?.scores.find(sc => sc.criteriaId === c.id);
        const ex = r.expertScores.map(es => es.scores.find(sc => sc.criteriaId === c.id)).filter(Boolean);
        const avgEx = ex.length > 0 ? ex.reduce((sum, sc) => sum + (sc?.score || 0), 0) / ex.length : 0;
        if (ai && ex.length > 0) return [ai.score * 0.3 + avgEx * 0.7];
        return [ai?.score || avgEx];
      }).filter(Boolean) as number[];
      return {
        id: c.id,
        name: c.name,
        score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      };
    });
  }, [userSubmissions, getScoreRecord]);

  const handleTechnologyToggle = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technology: prev.technology.includes(tech)
        ? prev.technology.filter(t => t !== tech)
        : [...prev.technology, tech],
    }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = '请输入作品名称';
    if (!formData.description.trim()) errors.description = '请输入作品描述';
    if (formData.technology.length === 0) errors.technology = '至少选择一项技术';
    if (!formData.teamId) errors.teamId = '请选择参赛团队';
    if (formData.codeUrl && !/^https?:\/\//.test(formData.codeUrl)) errors.codeUrl = '请输入有效的URL';
    // 视频链接不限制平台，允许任意链接或为空

    if (formData.teamId) {
      const existingUserSubmission = userSubmissions.some(s => s.hackathonId === formData.teamId);
      if (existingUserSubmission) {
        errors.teamId = '您在该竞赛已提交作品，如需重新提交请先删除原作品';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);

    try {
      // 从报名记录中查找选中的竞赛信息
      const hackathonId = formData.teamId;

      // 构造 teamId：优先用已有团队，否则基于用户+竞赛生成唯一ID
      const teamFromGlobalTeams = teams.find(
        t => t.hackathonId === hackathonId && t.members.some(m => m.id === user?.id)
      );
      const effectiveTeamId = teamFromGlobalTeams?.id || `reg_${user?.id}_${hackathonId}`;

      const result = submitProject({
        title: formData.title,
        description: formData.description,
        technology: formData.technology,
        githubUrl: formData.codeUrl || undefined,
        videoUrl: formData.videoUrl || undefined,
        teamId: effectiveTeamId,
        hackathonId: hackathonId,
      });

      if (!result) {
        setSubmitting(false);
        return;
      }
    } catch {
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSubmitSuccess(true);
    setTimeout(() => {
      setShowSubmitModal(false);
      setSubmitSuccess(false);
      setFormData({ title: '', description: '', technology: [], codeUrl: '', videoUrl: '', teamId: '' });
    }, 2000);
  };

  const openSubmitModal = () => {
    setFormData({ title: '', description: '', technology: [], codeUrl: '', videoUrl: '', teamId: '' });
    setFormErrors({});
    setSubmitSuccess(false);
    setShowSubmitModal(true);
  };

  const openDeleteModal = (sub: typeof submissions[0]) => {
    setDeletingSubmission(sub);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setDeletingSubmission(null);
    setShowDeleteModal(false);
  };

  const handleDelete = () => {
    if (!deletingSubmission) return;
    deleteSubmission(deletingSubmission.id);
    closeDeleteModal();
  };

  // ===== 报名信息管理函数 =====
  const openEditRegistration = (reg: RegistrationData) => {
    setEditingRegistration(reg);
    setViewingRegistration(null);
    setRegEditForm({
      captainName: reg.captainName,
      captainPhone: reg.captainPhone,
      captainEmail: reg.captainEmail,
      teamName: reg.teamName,
      region: reg.region,
      members: [...reg.members],
    });
    setRegEditErrors({});
    setRegistrationEditMode(true);
    setShowRegistrationModal(true);
  };

  const closeRegistrationModal = () => {
    setShowRegistrationModal(false);
    setViewingRegistration(null);
    setEditingRegistration(null);
    setRegistrationEditMode(false);
  };

  const switchToEditMode = () => {
    if (!viewingRegistration) return;
    setEditingRegistration(viewingRegistration);
    setViewingRegistration(null);
    setRegEditForm({
      captainName: viewingRegistration.captainName,
      captainPhone: viewingRegistration.captainPhone,
      captainEmail: viewingRegistration.captainEmail,
      teamName: viewingRegistration.teamName,
      region: viewingRegistration.region,
      members: [...viewingRegistration.members],
    });
    setRegEditErrors({});
    setRegistrationEditMode(true);
  };

  const cancelEditMode = () => {
    if (!editingRegistration) return;
    setViewingRegistration(editingRegistration);
    setEditingRegistration(null);
    setRegistrationEditMode(false);
    setRegEditErrors({});
  };

  const updateRegField = (field: keyof typeof regEditForm, value: string | TeamMember[]) => {
    setRegEditForm(prev => ({ ...prev, [field]: value }));
    if (regEditErrors[field]) {
      setRegEditErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateRegMember = (index: number, field: keyof TeamMember, value: string) => {
    setRegEditForm(prev => ({
      ...prev,
      members: prev.members.map((m, i) => i === index ? { ...m, [field]: value } : m),
    }));
  };

  const validateRegistrationForm = () => {
    const errors: Record<string, string> = {};
    if (!regEditForm.captainName.trim()) errors.captainName = '请输入队长姓名';
    if (!regEditForm.captainPhone.trim()) errors.captainPhone = '请输入队长电话';
    else if (!/^\d{11}$/.test(regEditForm.captainPhone.trim())) errors.captainPhone = '请输入有效的11位手机号';
    if (!regEditForm.captainEmail.trim()) errors.captainEmail = '请输入队长邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEditForm.captainEmail.trim())) errors.captainEmail = '请输入有效的邮箱地址';
    if (!regEditForm.teamName.trim()) errors.teamName = '请输入团队名称';
    if (!regEditForm.region) errors.region = '请选择所属赛区';

    const validMembers = regEditForm.members.filter(m => m.fullName.trim() && m.phone.trim() && m.email.trim());
    if (validMembers.length === 0 && regEditForm.members.length > 0) {
      errors.members = '至少填写一名成员的完整信息，或清空成员数据';
    }

    setRegEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveRegistration = async () => {
    if (!validateRegistrationForm() || !editingRegistration) return;

    const updatedReg: RegistrationData = {
      ...editingRegistration,
      captainName: regEditForm.captainName,
      captainPhone: regEditForm.captainPhone,
      captainEmail: regEditForm.captainEmail,
      teamName: regEditForm.teamName,
      region: regEditForm.region,
      members: regEditForm.members.filter(m => m.fullName.trim() || m.phone.trim() || m.email.trim()),
    };

    saveRegistrationToStorage(updatedReg);

    // 更新本地状态以反映变化
    setViewingRegistration(updatedReg);
    setEditingRegistration(null);
    setRegistrationEditMode(false);
  };

  // 退赛处理
  const handleWithdraw = () => {
    if (!withdrawingRegistration || !user) return;
    const regs = getRegistrationsFromStorage();
    delete regs[`${withdrawingRegistration.hackathonId}_${withdrawingRegistration.userId}`];
    localStorage.setItem('hackathon_registrations', JSON.stringify(regs));

    // 同步删除该竞赛下属于当前用户的提交作品
    const userTeamIds = new Set(teams.filter(t => t.members.some(m => m.id === user.id)).map(t => t.id));
    submissions
      .filter(s =>
        s.hackathonId === withdrawingRegistration.hackathonId &&
        (userTeamIds.has(s.teamId) || s.teamId.startsWith(`reg_${user.id}_`))
      )
      .forEach(s => deleteSubmission(s.id));

    setShowWithdrawModal(false);
    setWithdrawingRegistration(null);
  };

  const getScoreBreakdown = (submissionId: string) => {
    const r = getScoreRecord(submissionId);
    if (!r) return null;
    const aiScore = r.aiScore?.totalScore || 0;
    const expertCount = r.expertScores.length;
    const expertScore = expertCount > 0
      ? Math.round(r.expertScores.reduce((sum, es) => sum + es.totalScore, 0) / expertCount * 10) / 10
      : 0;
    // 只有两者都 > 0 才返回有效评分对象
    if (aiScore === 0 || expertCount === 0) return null;
    return {
      aiScore,
      expertScore,
      expertCount,
    };
  };

  const toggleHackathonCollapse = (hackathonId: string) => {
    setCollapsedHackathons(prev => {
      const next = new Set(prev);
      if (next.has(hackathonId)) {
        next.delete(hackathonId);
      } else {
        next.add(hackathonId);
      }
      return next;
    });
  };

  return (
    <div className="py-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* 页面标题 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg glass-light hover:bg-slate-700/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">我的提交</h1>
              <p className="text-slate-400">查看您的作品提交记录和评分反馈</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {userTeams.length > 0 && (
              <Button onClick={openSubmitModal}>
                <Plus className="w-4 h-4 mr-2" />
                提交作品
              </Button>
            )}
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-slate-400">提交作品</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.scored}</p>
                <p className="text-sm text-slate-400">已评分</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.avgScore || '-'}</p>
                <p className="text-sm text-slate-400">综合平均分</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 我的报名 */}
        {registrationList.length > 0 && (
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-purple-500" />
                我的报名
              </h3>
              <Badge variant="primary">{registrationList.length} 个竞赛</Badge>
            </div>
            <div className="space-y-3">
              {registrationList.map(reg => (
                <div key={`${reg.hackathonId}_${reg.userId}`} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl hover:bg-slate-800/70 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-white font-medium truncate">{reg.hackathon?.title}</h4>
                      <p className="text-slate-500 text-sm mt-0.5">
                        团队: {reg.teamName} · 赛区: {getRegionLabel(reg.region)} · 成员: {reg.members.length + 1}人
                      </p>
                      <p className="text-slate-600 text-xs mt-0.5">
                        报名时间: {new Date(reg.submittedAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <button
                      onClick={() => {
                        setWithdrawingRegistration(reg);
                        setShowWithdrawModal(true);
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="退赛"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditRegistration(reg)}
                      className="p-2 rounded-lg text-slate-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                      title="修改报名信息"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <Link
                      to={`/hackathons/${reg.hackathonId}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                      title="查看竞赛"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 筛选工具栏 */}
        <div className="glass rounded-xl p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索作品名称或描述..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex gap-4">
              <select
                value={filterHackathon}
                onChange={e => setFilterHackathon(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer min-w-[160px]"
              >
                <option value="">全部竞赛</option>
                {submissionsByHackathon.map(({ hackathon }) => (
                  <option key={hackathon.id} value={hackathon.id}>{hackathon.title}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as 'all' | 'scored' | 'pending')}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer min-w-[120px]"
              >
                <option value="all">全部状态</option>
                <option value="scored">已评分</option>
                <option value="pending">评分中</option>
              </select>
            </div>
          </div>
        </div>

        {userSubmissions.length === 0 ? (
          /* 空状态 */
          <Card className="p-16 text-center">
            <div className="max-w-sm mx-auto">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-semibold text-white mb-2">暂无提交记录</h3>
              <p className="text-slate-400 mb-6">
                {registrationList.length > 0 ? '报名成功，快来提交您的作品吧' : '报名竞赛后即可提交作品'}
              </p>
              <Button onClick={openSubmitModal} size="lg" disabled={registrationList.length === 0}>
                <Plus className="w-5 h-5 mr-2" />
                提交作品
              </Button>
            </div>
          </Card>
        ) : filteredSubmissionsByHackathon.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">未找到符合条件的作品</p>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-5 gap-8">
            {/* 提交列表 */}
            <div className="lg:col-span-3 space-y-6">
              {filteredSubmissionsByHackathon.map(({ hackathon, submissions: hackathonSubs }) => {
                const isCollapsed = collapsedHackathons.has(hackathon.id);
                return (
                  <Card key={hackathon.id} className="p-6">
                    <button
                      onClick={() => toggleHackathonCollapse(hackathon.id)}
                      className="w-full flex items-center gap-3 mb-4 text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{hackathon.title}</h3>
                        <p className="text-sm text-slate-400">
                          {hackathonSubs.length} 个提交 · {hackathon.status === 'completed' ? '已结束' : '进行中'}
                        </p>
                      </div>
                      <Link
                        to={`/hackathons/${hackathon.id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-blue-400 text-sm hover:underline flex items-center gap-1 mr-2"
                      >
                        竞赛详情
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      {isCollapsed ? (
                        <ChevronDownIcon className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    {!isCollapsed && (
                      <div className="space-y-4">
                        {hackathonSubs.map(sub => {
                          const score = getScoreBreakdown(sub.id);
                          const isExpanded = expandedSubmission === sub.id;
                          const subTeam = teams.find(t => t.id === sub.teamId);
                          const subHackathon = subTeam ? getHackathonById(subTeam.hackathonId) : null;
                          return (
                            <div key={sub.id} className="border border-slate-700/50 rounded-xl p-4">
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <h4 className="text-white font-semibold truncate">{sub.title}</h4>
                                      {score && score.expertCount > 0 && (
                                        <Badge variant="success" size="sm">已评分</Badge>
                                      )}
                                      {(!score || score.expertCount === 0) && (
                                        <Badge variant="warning" size="sm">评分中</Badge>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => openDeleteModal(sub)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                      title="删除作品"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <p className="text-slate-500 text-xs mb-1">
                                    {subHackathon?.title || '未知竞赛'}
                                  </p>
                                  <p className="text-slate-400 text-sm mb-2">{sub.description}</p>
                                  <div className="flex flex-wrap gap-1.5 mb-3">
                                    {sub.technology.map(tech => (
                                      <span key={tech} className="px-2 py-0.5 rounded-md bg-slate-700/50 text-slate-300 text-xs">{tech}</span>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    {sub.githubUrl && (
                                      <a href={sub.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                        <ExternalLink className="w-3.5 h-3.5" /> 作品链接
                                      </a>
                                    )}
                                    {sub.videoUrl && (
                                      <a href={sub.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                        <Video className="w-3.5 h-3.5" /> 视频
                                      </a>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  {score ? (
                                    <div className="text-right">
                                      <p className="text-2xl font-bold text-white">{getScoreRecord(sub.id)?.finalScore?.toFixed(2) || '-'}</p>
                                      <p className="text-xs text-slate-400">综合评分</p>
                                    </div>
                                  ) : (
                                    <div className="text-right">
                                      <p className="text-2xl font-bold text-slate-500">-</p>
                                      <p className="text-xs text-slate-400">待评分</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {score && score.expertCount > 0 && (
                                <button
                                  onClick={() => setExpandedSubmission(isExpanded ? null : sub.id)}
                                  className="mt-3 flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  <BarChart3 className="w-4 h-4" />
                                  {isExpanded ? '收起评分详情' : '查看评分详情'}
                                  <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              )}

                              {isExpanded && score && (
                                <div className="mt-4 pt-4 border-t border-slate-700/50">
                                  <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="p-3 bg-purple-500/10 rounded-lg">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Star className="w-4 h-4 text-purple-500" />
                                          <span className="text-purple-400 text-sm font-medium">AI评分</span>
                                        </div>
                                        <span className="text-purple-400 font-semibold">{score.aiScore}</span>
                                      </div>
                                    </div>
                                    <div className="p-3 bg-green-500/10 rounded-lg">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Users className="w-4 h-4 text-green-500" />
                                          <span className="text-green-400 text-sm font-medium">专家评分 ({score.expertCount})</span>
                                        </div>
                                        <span className="text-green-400 font-semibold">{score.expertScore}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* 右侧评分统计 */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  各维度评分
                </h3>
                <div className="space-y-4">
                  {avgDimScore.map(dim => (
                    <div key={dim.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-300">{dim.name}</span>
                        <span className="text-sm font-semibold text-white">{dim.score}</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  评分规则说明
                </h3>
                <div className="space-y-3 text-sm text-slate-400">
                  <p>· AI评分权重 {(scoringConfig.aiWeight * 100).toFixed(0)}%，专家评分权重 {(scoringConfig.expertWeight * 100).toFixed(0)}%</p>
                  <p>· 每个作品至少需要 1 位专家评审</p>
                  <p>· 评分维度：创新性、技术难度、实用性、商业价值</p>
                  <p>· 最终排名按综合得分从高到低排序</p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* 提交弹窗 */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => !submitting && !submitSuccess && setShowSubmitModal(false)}
        title={submitSuccess ? '提交成功' : '提交作品'}
      >
        {submitSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">作品提交成功！</h3>
            <p className="text-slate-400">您的作品已提交，等待专家评审</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">作品名称</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="输入作品名称"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {formErrors.title && <p className="text-red-400 text-sm mt-1">{formErrors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">作品描述</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="描述您的作品功能、技术亮点等"
                rows={4}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
              {formErrors.description && <p className="text-red-400 text-sm mt-1">{formErrors.description}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">竞赛名称</label>
              <select
                value={formData.teamId}
                onChange={e => setFormData(prev => ({ ...prev, teamId: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
              >
                <option value="">选择竞赛</option>
                  {registrationList.map(reg => {
                    const hasSubmission = userSubmissions.some(s => s.hackathonId === reg.hackathonId);
                    return (
                      <option
                        key={reg.hackathonId}
                        value={reg.hackathonId}
                        disabled={hasSubmission}
                      >
                        {reg.hackathon?.title || '未知竞赛'}{hasSubmission ? '（已提交）' : ''}
                      </option>
                    );
                  })}
              </select>
              {formErrors.teamId && <p className="text-red-400 text-sm mt-1">{formErrors.teamId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">技术栈</label>
              <div className="flex flex-wrap gap-2">
                {TECHNOLOGIES.map(tech => (
                  <button
                    key={tech}
                    onClick={() => handleTechnologyToggle(tech)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.technology.includes(tech)
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-700/50 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {tech}
                  </button>
                ))}
              </div>
              {formErrors.technology && <p className="text-red-400 text-sm mt-1">{formErrors.technology}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">作品链接</label>
              <input
                type="text"
                value={formData.codeUrl}
                onChange={e => setFormData(prev => ({ ...prev, codeUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {formErrors.codeUrl && <p className="text-red-400 text-sm mt-1">{formErrors.codeUrl}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">视频链接</label>
              <input
                type="text"
                value={formData.videoUrl}
                onChange={e => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="视频链接"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="pt-2">
              <Button onClick={handleSubmit} loading={submitting} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                提交作品
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        title="删除作品"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">确认删除该作品？</h3>
          <p className="text-slate-400 mb-6">
            删除后该作品的评分记录也将被清除，且无法恢复。
            <br />
            删除后可重新提交新作品。
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={closeDeleteModal} className="flex-1">
              取消
            </Button>
            <Button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              确认删除
            </Button>
          </div>
        </div>
      </Modal>

      {/* 报名信息查看/编辑弹窗 */}
      <Modal
        isOpen={showRegistrationModal}
        onClose={registrationEditMode ? cancelEditMode : closeRegistrationModal}
        title={registrationEditMode ? '修改报名信息' : '报名详情'}
        size="lg"
      >
        {viewingRegistration && !registrationEditMode && (
          <div className="space-y-5">
            {/* 竞赛信息 */}
            <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <h4 className="text-white font-semibold mb-1">{viewingRegistration.hackathonId ? getHackathonById(viewingRegistration.hackathonId)?.title || '未知竞赛' : '未知竞赛'}</h4>
              <p className="text-slate-400 text-sm">报名时间: {new Date(viewingRegistration.submittedAt).toLocaleString('zh-CN')}</p>
            </div>

            {/* 队长信息 */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                队长信息 Captain Info
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/60 rounded-lg">
                  <p className="text-slate-500 text-xs mb-1">姓名 Name</p>
                  <p className="text-white font-medium">{viewingRegistration.captainName}</p>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-lg">
                  <p className="text-slate-500 text-xs mb-1">电话 Phone</p>
                  <p className="text-white font-medium">{viewingRegistration.captainPhone}</p>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-lg col-span-2">
                  <p className="text-slate-500 text-xs mb-1">邮箱 Email</p>
                  <p className="text-white font-medium">{viewingRegistration.captainEmail}</p>
                </div>
              </div>
            </div>

            {/* 团队与赛区 */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-green-400" />
                团队与赛区 Team & Region
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/60 rounded-lg">
                  <p className="text-slate-500 text-xs mb-1">团队名称 Team Name</p>
                  <p className="text-white font-medium">{viewingRegistration.teamName}</p>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-lg">
                  <p className="text-slate-500 text-xs mb-1">所属赛区 Region</p>
                  <p className="text-white font-medium">{getRegionLabel(viewingRegistration.region)}</p>
                </div>
              </div>
            </div>

            {/* 团队成员 */}
            {viewingRegistration.members.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-yellow-400" />
                  团队成员 Team Members ({viewingRegistration.members.length})
                </h4>
                <div className="space-y-2">
                  {viewingRegistration.members.map((member: TeamMember, idx: number) => (
                    <div key={member.id || idx} className="p-3 bg-slate-800/60 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium text-sm">成员 {idx + 1}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs">姓名</p>
                          <p className="text-slate-300">{member.fullName}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">电话</p>
                          <p className="text-slate-300">{member.phone}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">邮箱</p>
                          <p className="text-slate-300 truncate">{member.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <Button variant="secondary" onClick={closeRegistrationModal} className="flex-1">
                关闭
              </Button>
              <Button onClick={switchToEditMode} className="flex-1">
                <Edit3 className="w-4 h-4 mr-2" />
                修改报名信息
              </Button>
            </div>
          </div>
        )}

        {editingRegistration && registrationEditMode && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">队长姓名 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={regEditForm.captainName}
                onChange={e => updateRegField('captainName', e.target.value)}
                placeholder="请输入队长姓名"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {regEditErrors.captainName && <p className="text-red-400 text-sm mt-1">{regEditErrors.captainName}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">队长电话 <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={regEditForm.captainPhone}
                  onChange={e => updateRegField('captainPhone', e.target.value)}
                  placeholder="11位手机号"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {regEditErrors.captainPhone && <p className="text-red-400 text-sm mt-1">{regEditErrors.captainPhone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">队长邮箱 <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={regEditForm.captainEmail}
                  onChange={e => updateRegField('captainEmail', e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {regEditErrors.captainEmail && <p className="text-red-400 text-sm mt-1">{regEditErrors.captainEmail}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">团队名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={regEditForm.teamName}
                  onChange={e => updateRegField('teamName', e.target.value)}
                  placeholder="团队名称"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {regEditErrors.teamName && <p className="text-red-400 text-sm mt-1">{regEditErrors.teamName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">所属赛区 <span className="text-red-500">*</span></label>
                <select
                  value={regEditForm.region}
                  onChange={e => updateRegField('region', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="">选择赛区</option>
                  {REGIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                {regEditErrors.region && <p className="text-red-400 text-sm mt-1">{regEditErrors.region}</p>}
              </div>
            </div>

            {/* 团队成员编辑 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">团队成员</label>
              <div className="space-y-3">
                {regEditForm.members.map((member, index) => (
                  <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-medium">成员 {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => updateRegField('members', regEditForm.members.filter((_, i) => i !== index))}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={member.fullName}
                        onChange={e => updateRegMember(index, 'fullName', e.target.value)}
                        placeholder="姓名"
                        className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                      />
                      <input
                        type="tel"
                        value={member.phone}
                        onChange={e => updateRegMember(index, 'phone', e.target.value)}
                        placeholder="手机号"
                        className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                      />
                      <input
                        type="email"
                        value={member.email}
                        onChange={e => updateRegMember(index, 'email', e.target.value)}
                        placeholder="邮箱"
                        className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => updateRegField('members', [...regEditForm.members, { id: String(Date.now()), fullName: '', phone: '', email: '' }])}
                className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                添加成员
              </button>
              {regEditErrors.members && <p className="text-red-400 text-sm mt-1">{regEditErrors.members}</p>}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <Button variant="secondary" onClick={cancelEditMode} className="flex-1">
                取消
              </Button>
              <Button onClick={handleSaveRegistration} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                保存修改
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 退赛确认弹窗 */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="确认退赛"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <LogOut className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">确认退出该竞赛？</h3>
          <p className="text-slate-400 mb-6">
            退赛后您的报名信息和已提交作品将被一并清除，如需参赛需重新报名和提交。
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowWithdrawModal(false)} className="flex-1">取消</Button>
            <Button onClick={handleWithdraw} className="flex-1 bg-red-500 hover:bg-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              确认退赛
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
