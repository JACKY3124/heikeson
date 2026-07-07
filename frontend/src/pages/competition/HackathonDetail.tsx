import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar, Users, MapPin, CheckCircle, FileText,
  Edit3, Save, X, ClipboardList, Plus, LogOut, Clock,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Button, Modal } from '@/components/ui';
import { getCompetitionStatus } from '@/utils/helpers';
import {
  getRegistrations as getRegistrationsFromStorage,
  saveRegistration as saveRegistrationToStorage,
  type RegistrationData,
  type TeamMember,
} from './HackathonRegister';

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

export default function HackathonDetail() {
  const { id } = useParams<{ id: string }>();
  const { getHackathonById, isAuthenticated, user, submissions, teams, deleteSubmission } = useAppStore();
  const hackathon = getHackathonById(id!);
  const competitionStatus = hackathon ? getCompetitionStatus(hackathon) : 'draft';

  // 报名管理状态
  const [showRegModal, setShowRegModal] = useState(false);
  const [regViewMode, setRegViewMode] = useState<'view' | 'edit'>('view');
  const [regEditForm, setRegEditForm] = useState({
    captainName: '',
    captainPhone: '',
    captainEmail: '',
    teamName: '',
    region: '',
    members: [] as TeamMember[],
  });
  const [regEditErrors, setRegEditErrors] = useState<Record<string, string>>({});
  const [currentRegistration, setCurrentRegistration] = useState<RegistrationData | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  if (!hackathon) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-4xl mb-4">404</p>
          <p className="text-slate-400">竞赛未找到</p>
        </div>
      </div>
    );
  }

  // 检查是否已报名
  const registrations = getRegistrationsFromStorage();
  const hasRegistered = user ? !!registrations[`${hackathon.id}_${user.id}`] : false;
  const myRegistration: RegistrationData | undefined = user ? registrations[`${hackathon.id}_${user.id}`] : undefined;

  const formatDate = (date: string) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date || '待定';
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const totalPrize = (hackathon.prizes || []).reduce((sum, p) => sum + p.amount, 0);

  // ===== 报名信息管理函数 =====
  const openEditRegistration = () => {
    if (!myRegistration) return;
    setCurrentRegistration(myRegistration);
    setRegEditForm({
      captainName: myRegistration.captainName,
      captainPhone: myRegistration.captainPhone,
      captainEmail: myRegistration.captainEmail,
      teamName: myRegistration.teamName,
      region: myRegistration.region,
      members: [...myRegistration.members],
    });
    setRegEditErrors({});
    setRegViewMode('edit');
    setShowRegModal(true);
  };

  const switchToEdit = () => {
    if (!currentRegistration) return;
    setRegEditForm({
      captainName: currentRegistration.captainName,
      captainPhone: currentRegistration.captainPhone,
      captainEmail: currentRegistration.captainEmail,
      teamName: currentRegistration.teamName,
      region: currentRegistration.region,
      members: [...currentRegistration.members],
    });
    setRegEditErrors({});
    setRegViewMode('edit');
  };

  const cancelEdit = () => {
    if (currentRegistration) {
      setRegViewMode('view');
      setRegEditErrors({});
    }
  };

  const closeRegModal = () => {
    setShowRegModal(false);
    setCurrentRegistration(null);
    setRegViewMode('view');
  };

  const updateRegField = (field: string, value: string | TeamMember[]) => {
    setRegEditForm(prev => ({ ...prev, [field]: value }));
    if (regEditErrors[field]) {
      setRegEditErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateMember = (index: number, field: keyof TeamMember, value: string) => {
    setRegEditForm(prev => ({
      ...prev,
      members: prev.members.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));
  };

  const validateRegForm = () => {
    const errors: Record<string, string> = {};
    if (!regEditForm.captainName.trim()) errors.captainName = '请输入队长姓名';
    if (!regEditForm.captainPhone.trim()) errors.captainPhone = '请输入队长电话';
    else if (!/^\d{11}$/.test(regEditForm.captainPhone.trim())) errors.captainPhone = '请输入有效的11位手机号';
    if (!regEditForm.captainEmail.trim()) errors.captainEmail = '请输入队长邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEditForm.captainEmail.trim())) errors.captainEmail = '请输入有效的邮箱地址';
    if (!regEditForm.teamName.trim()) errors.teamName = '请输入团队名称';
    if (!regEditForm.region) errors.region = '请选择所属赛区';
    setRegEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveRegistration = () => {
    if (!validateRegForm() || !currentRegistration) return;
    const updated: RegistrationData = {
      ...currentRegistration,
      captainName: regEditForm.captainName,
      captainPhone: regEditForm.captainPhone,
      captainEmail: regEditForm.captainEmail,
      teamName: regEditForm.teamName,
      region: regEditForm.region,
      members: regEditForm.members.filter(m => m.fullName.trim() || m.phone.trim() || m.email.trim()),
    };
    saveRegistrationToStorage(updated);
    setCurrentRegistration(updated);
    setRegViewMode('view');
    setRegEditErrors({});
  };

  const openWithdrawModal = () => setShowWithdrawModal(true);
  const closeWithdrawModal = () => setShowWithdrawModal(false);

  const handleWithdraw = () => {
    if (!user || !hackathon) return;
    const regs = getRegistrationsFromStorage();
    const regKey = `${hackathon.id}_${user.id}`;
    if (regs[regKey]) {
      regs[regKey] = { ...regs[regKey], status: 'withdrawn' as const };
      localStorage.setItem('hackathon_registrations', JSON.stringify(regs));
    }

    // 同步删除该竞赛下属于当前用户的提交作品
    const userTeamIds = new Set(teams.filter(t => t.members.some(m => m.id === user.id)).map(t => t.id));
    submissions
      .filter(s =>
        String(s.hackathonId) === String(hackathon.id) &&
        (userTeamIds.has(String(s.teamId)) || String(s.teamId).startsWith(`reg_${user.id}_`))
      )
      .forEach(s => deleteSubmission(String(s.id)));

    setShowWithdrawModal(false);
  };

  return (
    <div>
      <div className="relative h-72 overflow-hidden">
        <img
          src={hackathon.coverImage}
          alt={hackathon.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="flex items-center gap-3 mb-4">
            {competitionStatus === 'registration_open' && (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium">
                报名中
              </span>
            )}
            {competitionStatus === 'registration_closed' && new Date().getTime() < new Date(hackathon.registrationOpenTime || hackathon.startDate || '').getTime() && (
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
                即将开始
              </span>
            )}
            {competitionStatus === 'competition_running' && (
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
                进行中
              </span>
            )}
            {competitionStatus === 'judging' && (
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium">
                评审中
              </span>
            )}
            {competitionStatus === 'results_announced' && (
              <span className="px-3 py-1 rounded-full bg-slate-500/20 text-slate-400 text-sm font-medium">
                已结束
              </span>
            )}
            {hackathon.isVirtual && (
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium">
                线上赛
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{hackathon.title}</h1>
          <div className="flex flex-wrap gap-6 text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{formatDate(hackathon.startDate || '')} - {formatDate(hackathon.endDate || '')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span className={competitionStatus === 'registration_open' ? 'text-amber-400' : ''}>
                {competitionStatus === 'registration_open' && hackathon.registrationDeadline
                  ? `报名中 · 截止 ${formatDate(hackathon.registrationDeadline || '')}`
                  : competitionStatus === 'competition_running'
                    ? '比赛进行中'
                    : competitionStatus === 'registration_closed' && new Date().getTime() < new Date(hackathon.registrationOpenTime || hackathon.startDate || '').getTime()
                      ? `报名未开始 · ${formatDate(hackathon.registrationOpenTime || hackathon.startDate || '')}开启`
                      : '报名已结束'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>{hackathon.currentParticipants}/{hackathon.maxParticipants} 参赛者</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>{hackathon.isVirtual ? (hackathon.location ? `线上 · ${hackathon.location}` : '线上') : hackathon.location}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8 pr-0 lg:pr-40">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">竞赛介绍</h2>
              <p className="text-slate-300 leading-relaxed">{hackathon.description}</p>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">竞赛规则</h2>
              <ul className="space-y-3">
                {(hackathon.rules || []).map((rule, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6 sticky top-28 self-start">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">奖项设置</h2>
              <div className="space-y-4">
                {(hackathon.prizes || []).map((prize) => (
                  <div key={prize.rank} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        prize.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                        prize.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                        'bg-amber-600/20 text-amber-600'
                      }`}>
                        {prize.rank}
                      </div>
                      <span className="text-white font-medium">{prize.description}</span>
                    </div>
                    <span className="text-xl font-bold text-green-400">¥{prize.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
                <span className="text-slate-400">总奖金池</span>
                <span className="text-2xl font-bold text-green-400">¥{totalPrize.toLocaleString()}</span>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">主办方</h2>
              <div className="flex flex-wrap gap-2">
                {(hackathon.organizers || []).map((organizer) => (
                  <span key={organizer} className="px-4 py-2 rounded-full bg-slate-700/50 text-slate-300">
                    {organizer}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">分类标签</h2>
              <div className="flex flex-wrap gap-2">
                {(hackathon.categories || []).map((category) => (
                  <span key={category} className="px-4 py-2 rounded-full bg-blue-500/10 text-blue-400">
                    {category}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {isAuthenticated ? (
                hasRegistered && myRegistration && myRegistration.status !== 'withdrawn' ? (
                  <>
                    <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                          <ClipboardList className="w-4 h-4 text-purple-400" />
                          {myRegistration.status === 'pending' ? '报名待审核' : 
                           myRegistration.status === 'approved' ? '报名已通过' :
                           myRegistration.status === 'rejected' ? '报名已拒绝' : '已退赛'}
                        </span>
                        <div className="flex gap-1.5">
                          {myRegistration.status === 'approved' && (
                            <button
                              onClick={openWithdrawModal}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="退赛"
                            >
                              <LogOut className="w-4 h-4" />
                            </button>
                          )}
                          {(myRegistration.status === 'pending' || myRegistration.status === 'approved') && (
                            <button
                              onClick={openEditRegistration}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                              title="修改报名信息"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-white text-sm font-medium">{myRegistration.teamName}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {getRegionLabel(myRegistration.region)} · {(myRegistration.members?.length ?? 0) + 1}人 · 队长: {myRegistration.captainName}
                      </p>
                      {myRegistration.status === 'pending' && (
                        <div className="mt-2 flex items-center gap-1 text-blue-400 text-xs">
                          <Clock className="w-3 h-3" />
                          等待审核中，请留意邮箱通知
                        </div>
                      )}
                      {myRegistration.status === 'rejected' && (
                        <div className="mt-2 text-red-400 text-xs">
                          报名未通过审核，请重新报名
                        </div>
                      )}
                    </div>

                    {myRegistration.status === 'approved' && competitionStatus === 'competition_running' && (
                      <Link
                        to="/my-submissions"
                        className="w-full py-4 rounded-xl btn-gradient text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                      >
                        <FileText className="w-5 h-5" />
                        提交作品
                      </Link>
                    )}
                  </>
                ) : (
                  competitionStatus === 'registration_open' ? (
                    <Link
                      to={`/hackathons/${hackathon.id}/register`}
                      className="w-full py-4 rounded-xl btn-gradient text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                      <Users className="w-5 h-5" />
                      立即报名
                    </Link>
                  ) : (
                    <>
                      <div
                        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                          competitionStatus === 'registration_closed' && new Date().getTime() < new Date(hackathon.registrationOpenTime || hackathon.startDate || '').getTime()
                            ? 'bg-slate-700/50 text-slate-400'
                            : 'bg-slate-700/50 text-slate-500'
                        }`}
                      >
                        <Users className="w-5 h-5" />
                        {competitionStatus === 'registration_closed' && new Date().getTime() < new Date(hackathon.registrationOpenTime || hackathon.startDate || '').getTime()
                          ? '报名未开始'
                          : competitionStatus === 'competition_running'
                            ? '比赛进行中'
                            : '报名已结束'}
                      </div>
                      {competitionStatus === 'registration_closed' && new Date().getTime() < new Date(hackathon.registrationOpenTime || hackathon.startDate || '').getTime() && (
                        <p className="text-center text-slate-500 text-sm">
                          报名将于 {new Date(hackathon.registrationOpenTime || hackathon.startDate || '').toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} 开启
                        </p>
                      )}
                    </>
                  )
                )
              ) : (
                <>
                  {competitionStatus === 'registration_open' ? (
                    <Link
                      to="/login"
                      className="w-full py-4 rounded-xl btn-gradient text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                      立即报名
                    </Link>
                  ) : (
                    <div
                      className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                        competitionStatus === 'registration_closed' && new Date().getTime() < new Date(hackathon.registrationOpenTime || hackathon.startDate || '').getTime()
                          ? 'bg-slate-700/50 text-slate-400'
                          : 'bg-slate-700/50 text-slate-500'
                      }`}
                    >
                      {competitionStatus === 'registration_closed' && new Date().getTime() < new Date(hackathon.registrationOpenTime || hackathon.startDate || '').getTime()
                        ? '报名未开始'
                        : competitionStatus === 'competition_running'
                          ? '比赛进行中'
                          : '报名已结束'}
                    </div>
                  )}
                  <p className="text-center text-slate-400 text-sm">
                    需要登录后才能报名参加
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 报名信息查看/编辑弹窗 */}
      <Modal
        isOpen={showRegModal}
        onClose={regViewMode === 'edit' ? cancelEdit : closeRegModal}
        title={regViewMode === 'edit' ? '修改报名信息' : '报名详情'}
        size="lg"
      >
        {currentRegistration && regViewMode === 'view' && (
          <div className="space-y-5">
            <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <h4 className="text-white font-semibold mb-1">{hackathon.title}</h4>
              <p className="text-slate-400 text-sm">
                报名时间: {new Date(currentRegistration.submittedAt).toLocaleString('zh-CN')}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                队长信息 Captain Info
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/60 rounded-lg">
                  <p className="text-slate-500 text-xs mb-1">姓名 Name</p>
                  <p className="text-white font-medium">{currentRegistration.captainName}</p>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-lg">
                  <p className="text-slate-500 text-xs mb-1">电话 Phone</p>
                  <p className="text-white font-medium">{currentRegistration.captainPhone}</p>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-lg col-span-2">
                  <p className="text-slate-500 text-xs mb-1">邮箱 Email</p>
                  <p className="text-white font-medium">{currentRegistration.captainEmail}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-green-400" />
                团队与赛区 Team & Region
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/60 rounded-lg">
                  <p className="text-slate-500 text-xs mb-1">团队名称 Team Name</p>
                  <p className="text-white font-medium">{currentRegistration.teamName}</p>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-lg">
                  <p className="text-slate-500 text-xs mb-1">所属赛区 Region</p>
                  <p className="text-white font-medium">{getRegionLabel(currentRegistration.region)}</p>
                </div>
              </div>
            </div>

            {(currentRegistration.members?.length ?? 0) > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-yellow-400" />
                  团队成员 ({currentRegistration.members?.length ?? 0})
                </h4>
                <div className="space-y-2">
                  {currentRegistration.members.map((member, idx) => (
                    <div key={member.id || idx} className="p-3 bg-slate-800/60 rounded-lg">
                      <span className="text-white font-medium text-sm">成员 {idx + 1}</span>
                      <div className="grid grid-cols-3 gap-2 text-sm mt-2">
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

            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <Button variant="secondary" onClick={closeRegModal} className="flex-1">关闭</Button>
              <Button onClick={switchToEdit} className="flex-1">
                <Edit3 className="w-4 h-4 mr-2" />
                修改报名信息
              </Button>
            </div>
          </div>
        )}

        {currentRegistration && regViewMode === 'edit' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">队长姓名 <span className="text-red-500">*</span></label>
              <input
                type="text" value={regEditForm.captainName}
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
                  type="tel" value={regEditForm.captainPhone}
                  onChange={e => updateRegField('captainPhone', e.target.value)}
                  placeholder="11位手机号"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {regEditErrors.captainPhone && <p className="text-red-400 text-sm mt-1">{regEditErrors.captainPhone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">队长邮箱 <span className="text-red-500">*</span></label>
                <input
                  type="email" value={regEditForm.captainEmail}
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
                  type="text" value={regEditForm.teamName}
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
                      <input type="text" value={member.fullName} onChange={e => updateMember(index, 'fullName', e.target.value)} placeholder="姓名" className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm" />
                      <input type="tel" value={member.phone} onChange={e => updateMember(index, 'phone', e.target.value)} placeholder="手机号" className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm" />
                      <input type="email" value={member.email} onChange={e => updateMember(index, 'email', e.target.value)} placeholder="邮箱" className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm" />
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => updateRegField('members', [...regEditForm.members, { id: String(Date.now()), fullName: '', phone: '', email: '', memberType: 'unregistered' }])}
                className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" /> 添加成员
              </button>
              {regEditErrors.members && <p className="text-red-400 text-sm mt-1">{regEditErrors.members}</p>}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <Button variant="secondary" onClick={cancelEdit} className="flex-1">取消</Button>
              <Button onClick={handleSaveRegistration} className="flex-1">
                <Save className="w-4 h-4 mr-2" /> 保存修改
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 退赛确认弹窗 */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={closeWithdrawModal}
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
            <Button variant="secondary" onClick={closeWithdrawModal} className="flex-1">取消</Button>
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
