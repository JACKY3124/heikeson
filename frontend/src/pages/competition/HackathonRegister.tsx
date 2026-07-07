import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileCheck, ArrowLeft, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import { Card } from '@/components/ui';

export interface TeamMember {
  id: string;
  fullName: string;
  phone: string;
  email: string;
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
  return { id, fullName: '', phone: '', email: '' };
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
  const { getHackathonById, user, createTeam } = useAppStore();
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

  if (hackathon.status !== 'ongoing') {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <FileCheck className={`w-16 h-16 mx-auto mb-4 ${hackathon.status === 'upcoming' ? 'text-amber-400' : 'text-slate-500'}`} />
        <h2 className="text-2xl font-bold text-white mb-2">{hackathon.title}</h2>
        <p className="text-lg mb-6" style={{ color: hackathon.status === 'upcoming' ? '#fbbf24' : '#94a3b8' }}>
          {hackathon.status === 'upcoming' ? '报名未开始' : '报名已结束'}
        </p>
        <p className="text-slate-400 mb-6">
          {hackathon.status === 'upcoming'
            ? `报名将在 ${new Date(hackathon.startDate).toLocaleDateString('zh-CN')} 开启`
            : `该竞赛已于 ${new Date(hackathon.endDate).toLocaleDateString('zh-CN')} 结束`}
        </p>
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

    const validMembers = form.members.filter(m => m.fullName.trim() && m.phone.trim() && m.email.trim());
    const requiredAdditional = minAdditionalMembers;
    if (validMembers.length < requiredAdditional) {
      newErrors.members = `每个团队人数要求 ${minTeamSize}-${maxTeamSize} 人（含队长），请至少填写 ${requiredAdditional} 名其他成员的完整信息`;
    }

    if (!form.agreeIP) newErrors.agreeIP = '请阅读并同意知识产权声明';
    if (!form.agreeParticipation) newErrors.agreeParticipation = '请阅读并同意参赛协议';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setSubmitting(true);

    setTimeout(() => {
      // 创建团队
      const validMembers = form.members.filter(m => m.fullName.trim() && m.phone.trim() && m.email.trim());
      const teamMembers = validMembers.map(m => ({
        id: `member-${m.id}`,
        name: m.fullName,
        email: m.email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.fullName}`,
        bio: '',
        skills: [],
        role: 'player' as const,
      }));

      const newTeam = createTeam(form.teamName, '', hackathon.id, teamMembers);

      // 保存完整报名记录到 localStorage
      if (hackathon && user) {
        saveRegistration({
          hackathonId: hackathon.id,
          userId: user.id,
          teamName: form.teamName,
          captainName: form.captainName,
          captainPhone: form.captainPhone,
          captainEmail: form.captainEmail,
          region: form.region,
          members: validMembers.map(m => ({ ...m })),
          submittedAt: new Date().toISOString(),
        });
      }

      if (!newTeam) {
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  if (submitted) {
    return (
      <div className="py-8 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">报名提交成功！</h2>
            <p className="text-slate-400 mb-4">
              团队 <span className="text-white font-medium">{form.teamName}</span> 已成功报名
              <span className="text-white font-medium"> {hackathon.title} </span>
              竞赛。
            </p>
            <p className="text-slate-500 text-sm">正在跳转到我的提交页面...</p>
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
