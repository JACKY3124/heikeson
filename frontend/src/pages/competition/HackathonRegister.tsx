import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileCheck, ArrowLeft, Plus, Trash2, CheckCircle, Clock, AlertCircle, Search, UserCheck } from 'lucide-react';
import { useAppStore } from '@/store';
import { Card } from '@/components/ui';
import { registerCompetition } from '@/api/hackathon';
import { getCompetitionStatus } from '@/utils/helpers';
import type { User } from '@/types';

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

interface RegistrationForm {
  captainName: string;
  captainPhone: string;
  captainEmail: string;
  teamName: string;
  region: string;
  members: TeamMember[];
  agreeIP: boolean;
  agreeParticipation: boolean;
}

const REGIONS = [
  { value: 'south', label: '华南 South China' },
  { value: 'north', label: '华北 North China' },
  { value: 'east', label: '华东 East China' },
  { value: 'hk_macao', label: '港澳 Hong Kong & Macao SARs' },
  { value: 'southeast_asia', label: '东南亚 Southeast Asia' },
];

function createEmptyMember(id: string): TeamMember {
  return { id, fullName: '', phone: '', email: '', memberType: 'unregistered' };
}

export function getRegistrations(): Record<string, RegistrationData> {
  try {
    return JSON.parse(localStorage.getItem('hackathon_registrations') || '{}');
  } catch {
    return {};
  }
}

export function saveRegistration(data: RegistrationData) {
  const registrations = getRegistrations();
  registrations[`${data.hackathonId}_${data.userId}`] = data;
  localStorage.setItem('hackathon_registrations', JSON.stringify(registrations));
}

export default function HackathonRegister() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getHackathonById, user, createTeam, users } = useAppStore();
  const hackathon = getHackathonById(id!);

  const minTeamSize = hackathon?.minTeamSize ?? 1;
  const maxTeamSize = hackathon?.maxTeamSize ?? 5;
  const minAdditionalMembers = Math.max(0, minTeamSize - 1);
  const maxAdditionalMembers = Math.max(0, maxTeamSize - 1);

  const initialMembers = (() => {
    return Array.from({ length: minAdditionalMembers }, (_, i) =>
      createEmptyMember(String(i + 1))
    );
  })();

  const [form, setForm] = useState<RegistrationForm>({
    captainName: user?.name || '',
    captainPhone: '',
    captainEmail: user?.email || '',
    teamName: '',
    region: '',
    members: initialMembers,
    agreeIP: false,
    agreeParticipation: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchForIndex, setSearchForIndex] = useState<number | null>(null);

  const handleSearchUsers = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = users.filter(u =>
        u.email.toLowerCase().includes(query.toLowerCase()) ||
        u.name.toLowerCase().includes(query.toLowerCase())
      ).filter(u => u.id !== user?.id);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const selectUserForMember = (selectedUser: User, index: number) => {
    setForm(prev => ({
      ...prev,
      members: prev.members.map((m, i) =>
        i === index
          ? {
              ...m,
              fullName: selectedUser.name,
              email: selectedUser.email,
              phone: '',
              memberType: 'registered',
              userId: String(selectedUser.id),
            }
          : m
      ),
    }));
    setShowSearchResults(false);
    setSearchQuery('');
    setSearchForIndex(null);
  };

  const updateMemberType = (index: number, type: MemberType) => {
    setForm(prev => ({
      ...prev,
      members: prev.members.map((m, i) =>
        i === index ? { ...m, memberType: type, userId: type === 'registered' ? m.userId : undefined } : m
      ),
    }));
  };

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        navigate('/my-submissions');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [submitted, navigate]);

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

  const competitionStatus = getCompetitionStatus(hackathon);
  const isRegistrationOpen = competitionStatus === 'registration_open';

  const regOpenTime = new Date(hackathon.registrationOpenTime || hackathon.startDate || '');
  const regDeadline = new Date(hackathon.registrationDeadline || hackathon.startDate || '');
  const startTime = new Date(hackathon.startDate || hackathon.startTime || '');

  if (!isRegistrationOpen) {
    let statusText = '';
    let color = '';
    let iconColor = '';
    let description = '';

    if (competitionStatus === 'registration_closed' && new Date().getTime() < regOpenTime.getTime()) {
      statusText = '报名未开始';
      color = '#fbbf24';
      iconColor = 'text-amber-400';
      description = `报名将于 ${regOpenTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 开启`;
    } else if (competitionStatus === 'registration_closed') {
      statusText = '报名已截止';
      color = '#94a3b8';
      iconColor = 'text-slate-500';
      description = `报名已于 ${regDeadline.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 截止`;
    } else if (competitionStatus === 'competition_running') {
      statusText = '比赛进行中';
      color = '#22c55e';
      iconColor = 'text-green-400';
      description = '报名已截止，比赛正在进行中';
    } else {
      statusText = '比赛已结束';
      color = '#64748b';
      iconColor = 'text-slate-500';
      description = `比赛已于 ${startTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} 结束`;
    }

    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center`}>
          <Clock className={`w-8 h-8 ${iconColor}`} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{hackathon.title}</h2>
        <p className="text-lg mb-6" style={{ color }}>
          {statusText}
        </p>
        <p className="text-slate-400 mb-6">{description}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-medium transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  const updateField = <K extends keyof RegistrationForm>(field: K, value: RegistrationForm[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateMember = (index: number, field: keyof TeamMember, value: string) => {
    setForm(prev => ({
      ...prev,
      members: prev.members.map((m, i) => i === index ? { ...m, [field]: value } : m),
    }));
  };

  const addMember = () => {
    if (form.members.length >= maxAdditionalMembers) return;
    setForm(prev => ({
      ...prev,
      members: [...prev.members, createEmptyMember(String(Date.now()))],
    }));
  };

  const removeMember = (index: number) => {
    if (form.members.length <= minAdditionalMembers) return;
    setForm(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.captainName.trim()) newErrors.captainName = '请输入队长姓名';
    if (!form.captainPhone.trim()) newErrors.captainPhone = '请输入队长电话';
    else if (!/^\d{11}$/.test(form.captainPhone.trim())) newErrors.captainPhone = '请输入有效的11位手机号';
    if (!form.captainEmail.trim()) newErrors.captainEmail = '请输入队长邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.captainEmail.trim())) newErrors.captainEmail = '请输入有效的邮箱地址';
    if (!form.teamName.trim()) newErrors.teamName = '请输入团队名称';
    if (!form.region) newErrors.region = '请选择所属赛区';

    if (minTeamSize > 1) {
      const validMembers = form.members.filter(m => {
        const hasName = m.fullName.trim();
        const hasPhone = m.memberType === 'registered' || m.phone.trim();
        const hasEmail = m.email.trim();
        return hasName && hasPhone && hasEmail;
      });
      const requiredAdditional = minTeamSize - 1;
      if (validMembers.length < requiredAdditional) {
        newErrors.members = `团队人数要求 ${minTeamSize}-${maxTeamSize} 人（含队长），请至少添加 ${requiredAdditional} 名成员`;
      }
    }

    if (!form.agreeIP) newErrors.agreeIP = '请阅读并同意知识产权声明';
    if (!form.agreeParticipation) newErrors.agreeParticipation = '请阅读并同意参赛协议';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    const registrations = getRegistrations();
    const existingReg = registrations[`${hackathon.id}_${user?.id}`];
    if (existingReg && existingReg.status !== 'withdrawn' && existingReg.status !== 'rejected') {
      setApiError('您已报名该竞赛，请勿重复报名');
      return;
    }
    
    setSubmitting(true);
    setApiError('');

    try {
      const validMembers = form.members.filter(m => {
        const hasName = m.fullName.trim();
        const hasPhone = m.memberType === 'registered' || m.phone.trim();
        const hasEmail = m.email.trim();
        return hasName && hasPhone && hasEmail;
      });

      const registerData = {
        teamName: form.teamName,
        region: form.region,
        captainName: form.captainName,
        captainPhone: form.captainPhone,
        captainEmail: form.captainEmail,
        members: validMembers.map(m => ({
          fullName: m.fullName,
          phone: m.phone,
          email: m.email,
          memberType: m.memberType,
          userId: m.userId,
        })),
        agreeIP: form.agreeIP,
        agreeParticipation: form.agreeParticipation,
      };

      await registerCompetition(parseInt(String(hackathon.id)), registerData);

      const teamMembers = validMembers.map(m => {
        if (m.memberType === 'registered' && m.userId) {
          const existingUser = users.find(u => String(u.id) === m.userId);
          if (existingUser) {
            return {
              id: String(existingUser.id),
              name: existingUser.name,
              email: existingUser.email,
              avatar: existingUser.avatar,
              bio: existingUser.bio || '',
              skills: existingUser.skills || [],
              role: 'player' as const,
            };
          }
        }
        return {
          id: `member-${m.id}`,
          name: m.fullName,
          email: m.email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.fullName}`,
          bio: '',
          skills: [],
          role: 'player' as const,
        };
      });

      createTeam(form.teamName, '', String(hackathon.id), teamMembers);

      if (hackathon && user) {
        saveRegistration({
          hackathonId: String(hackathon.id),
          userId: String(user.id),
          teamName: form.teamName,
          captainName: form.captainName,
          captainPhone: form.captainPhone,
          captainEmail: form.captainEmail,
          region: form.region,
          members: validMembers.map(m => ({ ...m })),
          submittedAt: new Date().toISOString(),
          status: 'pending',
        });
      }

      setSubmitting(false);
      setSubmitted(true);
    } catch (error: any) {
      setSubmitting(false);
      setApiError(error.message || '报名提交失败，请稍后重试');
    }
  };

  if (submitted) {
    return (
      <div className="py-8 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Clock className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">报名提交成功！</h2>
            <p className="text-slate-400 mb-4">
              团队 <span className="text-white font-medium">{form.teamName}</span> 已成功提交报名申请
              <span className="text-white font-medium"> {hackathon.title} </span>
              竞赛。
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-sm mb-4">
              <Clock className="w-4 h-4" />
              等待审核中
            </div>
            <p className="text-slate-500 text-sm">审核结果将通过邮件通知，请留意邮箱。正在跳转到我的提交页面...</p>
          </Card>
        </div>
      </div>
    );
  }

  const FieldNumber = ({ num }: { num: string }) => (
    <span className="text-red-500 font-bold mr-2">{num}</span>
  );

  const RequiredMark = () => <span className="text-red-500 ml-1">*</span>;

  return (
    <div className="py-8 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>

        <Card className="overflow-hidden">
          <div className="p-6 border-b border-slate-700 bg-slate-800/50">
            <h1 className="text-2xl font-bold text-white mb-2">竞赛报名</h1>
            <p className="text-slate-400">{hackathon.title}</p>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">报名截止：</span>
              <span className="text-amber-400 font-medium">
                {regDeadline.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-10">
            {/* 01 队长姓名 */}
            <div>
              <label className="block text-white font-medium mb-3">
                <FieldNumber num="01" />
                队长姓名 Team Captain Name
                <RequiredMark />
              </label>
              <input
                type="text"
                value={form.captainName}
                onChange={e => updateField('captainName', e.target.value)}
                placeholder="请输入"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {errors.captainName && <p className="text-red-400 text-sm mt-2">{errors.captainName}</p>}
            </div>

            {/* 02 队长电话 */}
            <div>
              <label className="block text-white font-medium mb-3">
                <FieldNumber num="02" />
                队长电话 Team Captain Phone Number
                <RequiredMark />
              </label>
              <input
                type="tel"
                value={form.captainPhone}
                onChange={e => updateField('captainPhone', e.target.value)}
                placeholder="请输入数字"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {errors.captainPhone && <p className="text-red-400 text-sm mt-2">{errors.captainPhone}</p>}
            </div>

            {/* 03 队长邮箱 */}
            <div>
              <label className="block text-white font-medium mb-3">
                <FieldNumber num="03" />
                队长邮箱 Team Captain Email Address
                <RequiredMark />
              </label>
              <input
                type="email"
                value={form.captainEmail}
                onChange={e => updateField('captainEmail', e.target.value)}
                placeholder="请输入"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {errors.captainEmail && <p className="text-red-400 text-sm mt-2">{errors.captainEmail}</p>}
            </div>

            {/* 04 团队名称 */}
            <div>
              <label className="block text-white font-medium mb-3">
                <FieldNumber num="04" />
                团队名称 Team Name
                <RequiredMark />
              </label>
              <input
                type="text"
                value={form.teamName}
                onChange={e => updateField('teamName', e.target.value)}
                placeholder="请输入"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {errors.teamName && <p className="text-red-400 text-sm mt-2">{errors.teamName}</p>}
            </div>

            {/* 05 所属赛区 */}
            <div>
              <label className="block text-white font-medium mb-3">
                <FieldNumber num="05" />
                所属赛区 Competition Region
                <RequiredMark />
              </label>
              <p className="text-slate-500 text-sm mb-3">请填写学校所在区域 Please select the region where your school is located</p>
              <div className="space-y-3">
                {REGIONS.map(region => (
                  <label
                    key={region.value}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      form.region === region.value
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      form.region === region.value ? 'border-blue-500' : 'border-slate-500'
                    }`}>
                      {form.region === region.value && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                    </div>
                    <input
                      type="radio"
                      name="region"
                      value={region.value}
                      checked={form.region === region.value}
                      onChange={() => updateField('region', region.value)}
                      className="sr-only"
                    />
                    <span className="text-white">{region.label}</span>
                  </label>
                ))}
              </div>
              {errors.region && <p className="text-red-400 text-sm mt-2">{errors.region}</p>}
            </div>

            {minTeamSize > 1 && (
            <>
              {/* 06 其他成员 */}
              <div>
                <label className="block text-white font-medium mb-2">
                  <FieldNumber num="06" />
                  其他团队成员信息 Additional Team Member Information
                </label>
                <p className="text-slate-500 text-sm mb-4">
                  每个团队人数 {minTeamSize}-{maxTeamSize} 人（含队长），请填写其他成员信息。
                  {maxAdditionalMembers > 0 && (
                    <>每个团队最多可添加 {maxAdditionalMembers} 名额外成员。</>
                  )}
                </p>
                <div className="space-y-4">
                  {form.members.map((member, index) => (
                    <div key={member.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-medium">成员 {index + 1} Member {index + 1}</span>
                        {form.members.length > minAdditionalMembers && (
                          <button
                            type="button"
                            onClick={() => removeMember(index)}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => updateMemberType(index, 'registered')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            member.memberType === 'registered'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          已注册用户
                        </button>
                        <button
                          type="button"
                          onClick={() => updateMemberType(index, 'unregistered')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            member.memberType === 'unregistered'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700'
                          }`}
                        >
                          未注册用户
                        </button>
                      </div>
                      {member.memberType === 'registered' ? (
                        <div className="relative">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              type="text"
                              value={searchForIndex === index ? searchQuery : member.email || member.fullName}
                              onChange={e => {
                                setSearchForIndex(index);
                                handleSearchUsers(e.target.value);
                              }}
                              placeholder="搜索用户（邮箱或姓名）"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                            />
                          </div>
                          {searchForIndex === index && showSearchResults && searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-xl">
                              {searchResults.map((u, i) => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => selectUserForMember(u, index)}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-700 transition-colors ${
                                    i !== searchResults.length - 1 ? 'border-b border-slate-700' : ''
                                  }`}
                                >
                                  <img src={u.avatar} alt="" className="w-7 h-7 rounded-full" />
                                  <div>
                                    <p className="text-white text-sm">{u.name}</p>
                                    <p className="text-slate-500 text-xs">{u.email}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={member.fullName}
                            onChange={e => updateMember(index, 'fullName', e.target.value)}
                            placeholder="姓名 Full Name"
                            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                          />
                          <input
                            type="tel"
                            value={member.phone}
                            onChange={e => updateMember(index, 'phone', e.target.value)}
                            placeholder="手机号码 Phone Number"
                            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                          />
                          <input
                            type="email"
                            value={member.email}
                            onChange={e => updateMember(index, 'email', e.target.value)}
                            placeholder="邮箱 Email Address"
                            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {errors.members && <p className="text-red-400 text-sm mt-2">{errors.members}</p>}
                {form.members.length < maxAdditionalMembers && (
                  <button
                    type="button"
                    onClick={addMember}
                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    添加成员
                  </button>
                )}
              </div>
            </>
          )}

            {/* 07 确认协议 */}
            <div>
              <label className="block text-white font-medium mb-3">
                <FieldNumber num="07" />
                请阅读并确认 Please read and confirm
                <RequiredMark />
              </label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 rounded-lg border border-slate-700 bg-slate-800/50 cursor-pointer">
                  <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    form.agreeIP ? 'bg-blue-500 border-blue-500' : 'border-slate-500'
                  }`}>
                    {form.agreeIP && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={form.agreeIP}
                    onChange={e => updateField('agreeIP', e.target.checked)}
                    className="sr-only"
                  />
                  <div className="text-sm">
                    <span className="text-white">已阅读并同意签署</span>
                    <a href="#" className="text-blue-400 hover:underline ml-1">《知识产权声明》</a>
                    <p className="text-slate-500 mt-1">I have read and agree to sign the Intellectual Property Statement.</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-4 rounded-lg border border-slate-700 bg-slate-800/50 cursor-pointer">
                  <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    form.agreeParticipation ? 'bg-blue-500 border-blue-500' : 'border-slate-500'
                  }`}>
                    {form.agreeParticipation && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={form.agreeParticipation}
                    onChange={e => updateField('agreeParticipation', e.target.checked)}
                    className="sr-only"
                  />
                  <div className="text-sm">
                    <span className="text-white">已阅读并同意</span>
                    <a href="#" className="text-blue-400 hover:underline ml-1">《参赛协议》</a>
                    <p className="text-slate-500 mt-1">I have read and agree to the Participation Agreement.</p>
                  </div>
                </label>
              </div>
              {(errors.agreeIP || errors.agreeParticipation) && (
                <p className="text-red-400 text-sm mt-2">请阅读并同意相关协议</p>
              )}
            </div>

            {/* 提交按钮 */}
            <div className="pt-6 border-t border-slate-700">
              {apiError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{apiError}</p>
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 rounded-xl btn-gradient text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-5 h-5" />
                    提交报名
                  </>
                )}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
