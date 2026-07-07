import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Users, Trophy, BarChart3, FileText, CheckCircle, RefreshCw, Save, Cpu, TrendingUp, Shield, AlertCircle, Pencil, Trash2, Plus } from 'lucide-react';
import { useAppStore } from '@/store';
import type { ScoringConfig, UserRole, Hackathon, User } from '@/types';
import { Modal } from '@/components/ui';

const roleConfig: Partial<Record<UserRole, { label: string; color: string }>> = {
  player: { label: '选手', color: 'text-blue-400 bg-blue-500/20' },
  expert: { label: '专家', color: 'text-purple-400 bg-purple-500/20' },
  admin: { label: '管理员', color: 'text-red-400 bg-red-500/20' },
};

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = roleConfig[role];
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg?.color || 'text-slate-400 bg-slate-500/20'}`}>
      {cfg?.label || role}
    </span>
  );
}

export default function AdminDashboard() {
  const {
    isAuthenticated,
    userRole,
    hackathons,
    teams,
    submissions,
    scoreRecords,
    scoringConfig,
    runAIScoring,
    getLeaderboardByHackathon,
    users,
    user,
    updateUserRole,
    deleteUser,
    createHackathon,
    updateHackathon,
    deleteHackathon,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'competitions' | 'scoring' | 'analytics' | 'system'>('overview');
  const [config, setConfig] = useState<ScoringConfig>(scoringConfig);
  const [saved, setSaved] = useState(false);
  const [runningAIScore, setRunningAIScore] = useState<string | null>(null);
  const [confirmRoleChange, setConfirmRoleChange] = useState<{ userId: string; newRole: UserRole } | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [editingHackathon, setEditingHackathon] = useState<Hackathon | null>(null);
  const [hackathonForm, setHackathonForm] = useState<Partial<Hackathon>>({});
  const [deletingHackathon, setDeletingHackathon] = useState<Hackathon | null>(null);
  const [rawPrizesText, setRawPrizesText] = useState('');
  const [rawCategoriesText, setRawCategoriesText] = useState('');
  const [rawOrganizersText, setRawOrganizersText] = useState('');
  const [rawRulesText, setRawRulesText] = useState('');
  const [hackathonError, setHackathonError] = useState('');

  const isAdmin = userRole === 'admin';

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center glass rounded-2xl p-12">
          <Shield className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold text-white mb-2">管理员后台</h3>
          <p className="text-slate-400 mb-6">需要管理员账号登录后才能访问</p>
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl btn-gradient text-white font-semibold hover:opacity-90 transition-opacity"
          >
            登录
          </Link>
        </div>
      </div>
    );
  }

  const handleWeightChange = (criteriaId: string, newWeight: number) => {
    setConfig(prev => ({
      ...prev,
      criteria: prev.criteria.map(c =>
        c.id === criteriaId ? { ...c, weight: newWeight } : c
      ),
    }));
    setSaved(false);
  };

  const handleSaveConfig = () => {
    setConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRunAIScore = (submissionId: string) => {
    setRunningAIScore(submissionId);
    runAIScoring(submissionId);
    setTimeout(() => setRunningAIScore(null), 1500);
  };

  const totalWeight = config.criteria.reduce((sum, c) => sum + c.weight, 0);
  const isWeightValid = Math.abs(totalWeight - 1) < 0.01;

  const stats = {
    totalUsers: users.length,
    totalTeams: teams.length,
    totalSubmissions: submissions.length,
    avgScore: scoreRecords.length > 0
      ? Math.round(scoreRecords.reduce((sum, r) => sum + r.finalScore, 0) / scoreRecords.length * 10) / 10
      : 0,
  };

  const tabs = [
    { id: 'overview', label: '概览', icon: BarChart3 },
    { id: 'users', label: '用户管理', icon: Users },
    { id: 'competitions', label: '竞赛管理', icon: Trophy },
    { id: 'scoring', label: '评分配置', icon: Settings },
    { id: 'analytics', label: '数据分析', icon: TrendingUp },
  ];

  return (
    <div className="py-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">管理员后台</h1>
            <p className="text-slate-400">管理系统各项功能和配置</p>
          </div>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                    <p className="text-sm text-slate-400">总用户数</p>
                  </div>
                </div>
              </div>
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.totalTeams}</p>
                    <p className="text-sm text-slate-400">参赛团队</p>
                  </div>
                </div>
              </div>
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.totalSubmissions}</p>
                    <p className="text-sm text-slate-400">作品提交</p>
                  </div>
                </div>
              </div>
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.avgScore}</p>
                    <p className="text-sm text-slate-400">平均评分</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">进行中的竞赛</h2>
                <div className="space-y-3">
                  {hackathons.filter(h => h.status === 'ongoing').map(hackathon => (
                    <div key={hackathon.id} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-medium">{hackathon.title}</h3>
                        <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">进行中</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>{hackathon.currentParticipants} 参赛者</span>
                        <span>{teams.filter(t => t.hackathonId === hackathon.id).length} 团队</span>
                      </div>
                    </div>
                  ))}
                  {hackathons.filter(h => h.status === 'ongoing').length === 0 && (
                    <p className="text-slate-400 text-center py-4">暂无进行中的竞赛</p>
                  )}
                </div>
              </div>

              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">待评分作品</h2>
                <div className="space-y-3">
                  {submissions.filter(s => {
                    const record = scoreRecords.find(r => r.submissionId === s.id);
                    return !record?.aiScore;
                  }).slice(0, 5).map(submission => (
                    <div key={submission.id} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-medium">{submission.title}</h3>
                          <p className="text-slate-400 text-sm">{teams.find(t => t.id === submission.teamId)?.name}</p>
                        </div>
                        <button
                          onClick={() => handleRunAIScore(submission.id)}
                          disabled={runningAIScore === submission.id}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm"
                        >
                          <Cpu className="w-4 h-4" />
                          AI评分
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="glass rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">用户概览</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="text-slate-400">参赛选手</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'player').length}</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-purple-500" />
                    <span className="text-slate-400">专家评审</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'expert').length}</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Settings className="w-5 h-5 text-yellow-500" />
                    <span className="text-slate-400">管理员</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">所有用户</h2>
                <span className="text-sm text-slate-400">共 {users.length} 人</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="pb-3 pr-4 text-sm font-medium text-slate-400">用户</th>
                      <th className="pb-3 pr-4 text-sm font-medium text-slate-400">邮箱</th>
                      <th className="pb-3 pr-4 text-sm font-medium text-slate-400">当前角色</th>
                      <th className="pb-3 pr-4 text-sm font-medium text-slate-400">分配角色</th>
                      <th className="pb-3 text-sm font-medium text-slate-400">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full bg-slate-700" />
                            <span className="text-white font-medium">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-slate-400">{u.email}</td>
                        <td className="py-3 pr-4">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              onChange={(e) => setConfirmRoleChange({ userId: u.id, newRole: e.target.value as UserRole })}
                              className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-blue-500 transition-colors"
                            >
                              <option value="player">选手</option>
                              <option value="expert">专家</option>
                              <option value="admin">管理员</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => setDeletingUser(u)}
                            disabled={u.id === user?.id}
                            title={u.id === user?.id ? '不能注销当前登录账户' : '注销账户'}
                            className={`p-2 rounded-lg transition-colors ${
                              u.id === user?.id
                                ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">团队列表</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="pb-3 text-sm font-medium text-slate-400">团队名称</th>
                      <th className="pb-3 text-sm font-medium text-slate-400">所属竞赛</th>
                      <th className="pb-3 text-sm font-medium text-slate-400">成员数</th>
                      <th className="pb-3 text-sm font-medium text-slate-400">作品数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.slice(0, 10).map(team => (
                      <tr key={team.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                        <td className="py-3 text-white">{team.name}</td>
                        <td className="py-3 text-slate-400">{hackathons.find(h => h.id === team.hackathonId)?.title}</td>
                        <td className="py-3 text-slate-400">{users.filter(u => u.teamId === team.id || team.members.some(m => m.id === u.id)).length}</td>
                        <td className="py-3 text-slate-400">{submissions.filter(s => s.teamId === team.id).length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'competitions' && (
          <div className="space-y-6">
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">竞赛管理</h2>
                <button
                  onClick={() => {
                    const defaults: Hackathon = {
                      id: `hack-${Date.now()}`,
                      title: '',
                      description: '',
                      coverImage: '',
                      startDate: new Date().toISOString().split('T')[0],
                      endDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
                      status: 'upcoming',
                      prizes: [],
                      categories: [],
                      maxParticipants: 100,
                      currentParticipants: 0,
                      organizers: [],
                      location: '',
                      isVirtual: true,
                      rules: [],
                      minTeamSize: 1,
                      maxTeamSize: 5,
                    };
                    setEditingHackathon(defaults);
                    setHackathonForm({ ...defaults });
                    setRawPrizesText('');
                    setRawCategoriesText('');
                    setRawOrganizersText('');
                    setRawRulesText('');
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg btn-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  新增竞赛
                </button>
              </div>
              <div className="space-y-4">
                {hackathons.map(hackathon => (
                  <div key={hackathon.id} className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-start justify-between mb-3 gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium">{hackathon.title}</h3>
                        <p className="text-slate-400 text-sm truncate">{hackathon.description.slice(0, 50)}...</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          hackathon.status === 'ongoing' ? 'bg-green-500/20 text-green-400' :
                          hackathon.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {hackathon.status === 'ongoing' ? '进行中' :
                           hackathon.status === 'upcoming' ? '即将开始' : '已结束'}
                        </span>
                        <button
                          onClick={() => {
                            setEditingHackathon(hackathon);
                            setHackathonForm({ ...hackathon });
                            setRawPrizesText((hackathon.prizes || []).map(p => `${p.description}:${p.amount}`).join('\n'));
                            setRawCategoriesText((hackathon.categories || []).join('\n'));
                            setRawOrganizersText((hackathon.organizers || []).join('\n'));
                            setRawRulesText((hackathon.rules || []).join('\n'));
                          }}
                          className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          title="编辑"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingHackathon(hackathon)}
                          className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <span>参赛者: {hackathon.currentParticipants}/{hackathon.maxParticipants}</span>
                      <span>团队: {teams.filter(t => t.hackathonId === hackathon.id).length}</span>
                      <span>作品: {submissions.filter(s => s.hackathonId === hackathon.id).length}</span>
                      <span>奖金: ¥{hackathon.prizes.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scoring' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">评分权重配置</h2>
                <button
                  onClick={handleSaveConfig}
                  disabled={!isWeightValid || saved}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    saved
                      ? 'bg-green-500/20 text-green-400'
                      : isWeightValid
                        ? 'btn-gradient text-white hover:opacity-90'
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {saved ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      已保存
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      保存配置
                    </>
                  )}
                </button>
              </div>

              {!isWeightValid && (
                <div className="mb-4 p-3 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  权重总和必须等于 100%，当前: {(totalWeight * 100).toFixed(1)}%
                </div>
              )}

              <div className="space-y-6">
                {config.criteria.map(criteria => (
                  <div key={criteria.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{criteria.name}</span>
                      <span className="text-blue-400">{(criteria.weight * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={criteria.weight * 100}
                      onChange={(e) => handleWeightChange(criteria.id, Number(e.target.value) / 100)}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <p className="text-slate-500 text-xs mt-1">{criteria.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <h3 className="text-white font-medium mb-4">AI与专家权重分配</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-5 h-5 text-purple-500" />
                      <span className="text-white">AI评分</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={config.aiWeight * 100}
                        onChange={(e) => {
                          const aiWeight = Number(e.target.value) / 100;
                          setConfig(prev => ({
                            ...prev,
                            aiWeight,
                            expertWeight: 1 - aiWeight,
                          }));
                        }}
                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-green-500" />
                      <span className="text-white">专家评分</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={config.expertWeight * 100}
                        readOnly
                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">AI评分管理</h2>
              <div className="space-y-4">
                {submissions.slice(0, 8).map(submission => {
                  const record = scoreRecords.find(r => r.submissionId === submission.id);
                  const hasAIScore = !!record?.aiScore;
                  const team = teams.find(t => t.id === submission.teamId);

                  return (
                    <div key={submission.id} className="p-4 bg-slate-800/50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">{submission.title}</h4>
                          <p className="text-slate-400 text-sm">{team?.name}</p>
                        </div>
                        {hasAIScore ? (
                          <div className="text-right">
                            <p className="text-yellow-500 font-semibold">{record?.aiScore?.totalScore}</p>
                            <p className="text-slate-500 text-xs">已完成</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRunAIScore(submission.id)}
                            disabled={runningAIScore === submission.id}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                          >
                            <RefreshCw className={`w-4 h-4 ${runningAIScore === submission.id ? 'animate-spin' : ''}`} />
                            {runningAIScore === submission.id ? '评分中...' : 'AI评分'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">评分分布</h2>
                <div className="space-y-3">
                  {['90-100', '80-90', '70-80', '60-70', '60以下'].map((range, index) => {
                    const count = scoreRecords.filter(r => {
                      if (index === 0) return r.finalScore >= 90;
                      if (index === 1) return r.finalScore >= 80 && r.finalScore < 90;
                      if (index === 2) return r.finalScore >= 70 && r.finalScore < 80;
                      if (index === 3) return r.finalScore >= 60 && r.finalScore < 70;
                      return r.finalScore < 60;
                    }).length;
                    const percentage = scoreRecords.length > 0 ? (count / scoreRecords.length * 100) : 0;
                    return (
                      <div key={range} className="flex items-center gap-3">
                        <span className="w-16 text-slate-400 text-sm">{range}分</span>
                        <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-12 text-white text-sm text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">竞赛统计</h2>
                <div className="space-y-4">
                  {hackathons.map(hackathon => {
                    const leaderboard = getLeaderboardByHackathon(hackathon.id);
                    const avgScore = leaderboard.length > 0
                      ? Math.round(leaderboard.reduce((sum, l) => sum + l.score, 0) / leaderboard.length * 10) / 10
                      : 0;
                    return (
                      <div key={hackathon.id} className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-medium">{hackathon.title}</h3>
                          <span className="text-blue-400 text-sm">平均分: {avgScore || '-'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>参赛团队: {teams.filter(t => t.hackathonId === hackathon.id).length}</span>
                          <span>作品: {submissions.filter(s => s.hackathonId === hackathon.id).length}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!confirmRoleChange}
        onClose={() => setConfirmRoleChange(null)}
        title="确认修改角色？"
        size="sm"
      >
        {confirmRoleChange && (() => {
          const targetUser = users.find(u => u.id === confirmRoleChange.userId);
          const currentRole = roleConfig[targetUser?.role || 'player']?.label || targetUser?.role;
          const newRole = roleConfig[confirmRoleChange.newRole]?.label || confirmRoleChange.newRole;
          return (
            <div>
              <p className="text-slate-300 text-sm mb-6">
                你正在将 <span className="text-white font-medium">{targetUser?.name}</span> 的角色从
                <span className="text-white font-medium"> {currentRole} </span>
                改为
                <span className="text-white font-medium"> {newRole}</span>。
                确认后该用户将立即获得新身份权限。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmRoleChange(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700/50 text-white font-semibold hover:bg-slate-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    updateUserRole(confirmRoleChange.userId, confirmRoleChange.newRole);
                    setConfirmRoleChange(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl btn-gradient text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  确认修改
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
      <Modal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="确认注销账户？"
        size="sm"
      >
        {deletingUser && (
          <div>
            <p className="text-slate-300 text-sm mb-6">
              你确定要注销账户 <span className="text-white font-medium">{deletingUser.name}</span>（{deletingUser.email}）吗？
              注销后该用户将无法登录，相关数据可能不再关联。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-700/50 text-white font-semibold hover:bg-slate-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  deleteUser(deletingUser.id);
                  setDeletingUser(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-semibold hover:bg-red-500/30 transition-colors"
              >
                确认注销
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!editingHackathon}
        onClose={() => {
          setEditingHackathon(null);
          setHackathonForm({});
          setRawPrizesText('');
          setRawCategoriesText('');
          setRawOrganizersText('');
          setRawRulesText('');
          setHackathonError('');
        }}
        title={editingHackathon?.title ? '编辑竞赛' : '新增竞赛'}
        size="md"
      >
        {editingHackathon && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">竞赛名称</label>
              <input
                type="text"
                value={hackathonForm.title || ''}
                onChange={(e) => setHackathonForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="输入竞赛名称"
              />
              {hackathonError && <p className="text-red-400 text-xs mt-1">{hackathonError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">竞赛描述</label>
              <textarea
                value={hackathonForm.description || ''}
                onChange={(e) => setHackathonForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                rows={3}
                placeholder="输入竞赛描述"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">封面图片</label>
              <input
                type="text"
                value={hackathonForm.coverImage || ''}
                onChange={(e) => setHackathonForm(prev => ({ ...prev, coverImage: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors mb-2"
                placeholder="输入图片URL，例如 https://images.unsplash.com/..."
              />
              {hackathonForm.coverImage && (
                <img
                  src={hackathonForm.coverImage}
                  alt="封面预览"
                  className="w-full h-32 object-cover rounded-lg bg-slate-700"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">开始日期</label>
                <input
                  type="date"
                  value={hackathonForm.startDate || ''}
                  onChange={(e) => setHackathonForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">结束日期</label>
                <input
                  type="date"
                  value={hackathonForm.endDate || ''}
                  onChange={(e) => setHackathonForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">状态</label>
                <select
                  value={hackathonForm.status || 'upcoming'}
                  onChange={(e) => setHackathonForm(prev => ({ ...prev, status: e.target.value as Hackathon['status'] }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white appearance-none focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="upcoming">即将开始</option>
                  <option value="ongoing">进行中</option>
                  <option value="completed">已结束</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">最大参赛者</label>
                <input
                  type="number"
                  value={hackathonForm.maxParticipants || 100}
                  onChange={(e) => setHackathonForm(prev => ({ ...prev, maxParticipants: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">地点</label>
                <input
                  type="text"
                  value={hackathonForm.location || ''}
                  onChange={(e) => setHackathonForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="如：北京"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">举办方式</label>
                <select
                  value={hackathonForm.isVirtual === undefined ? 'true' : String(hackathonForm.isVirtual)}
                  onChange={(e) => setHackathonForm(prev => ({ ...prev, isVirtual: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white appearance-none focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="true">线上</option>
                  <option value="false">线下</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">类别（每行一个）</label>
              <textarea
                value={rawCategoriesText}
                onChange={(e) => {
                  const raw = e.target.value;
                  setRawCategoriesText(raw);
                  const categories = raw.split('\n').map(s => s.trim()).filter(Boolean);
                  setHackathonForm(prev => ({ ...prev, categories }));
                }}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                rows={3}
                placeholder="人工智能&#10;区块链&#10;Web3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">奖项（每行一个，格式：名次:金额）</label>
              <textarea
                value={rawPrizesText}
                onChange={(e) => {
                  const raw = e.target.value;
                  setRawPrizesText(raw);
                  const lines = raw.split('\n').map(s => s.trim()).filter(Boolean);
                  const prizes = lines.map((line, idx) => {
                    const [desc, amount] = line.split(/[:：]/);
                    return { rank: idx + 1, amount: Number(amount) || 0, description: desc ? desc.trim() : `第${idx + 1}名` };
                  });
                  setHackathonForm(prev => ({ ...prev, prizes }));
                }}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                rows={4}
                placeholder={`一等奖:50000
二等奖:30000
三等奖:10000`}
              />
              {hackathonForm.prizes && hackathonForm.prizes.length > 0 && (
                <div className="mt-2 p-2 bg-slate-800/50 rounded-lg text-sm">
                  <p className="text-slate-400 mb-1">已解析奖项：</p>
                  <div className="flex flex-wrap gap-2">
                    {hackathonForm.prizes.map((p) => (
                      <span key={p.rank} className="px-2 py-1 rounded bg-slate-700 text-slate-200 text-xs">
                        {p.description}：¥{p.amount.toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">主办方（每行一个）</label>
              <textarea
                value={rawOrganizersText}
                onChange={(e) => {
                  const raw = e.target.value;
                  setRawOrganizersText(raw);
                  const organizers = raw.split('\n').map(s => s.trim()).filter(Boolean);
                  setHackathonForm(prev => ({ ...prev, organizers }));
                }}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                rows={3}
                placeholder="阿里云&#10;清华大学"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">竞赛规则（每行一条）</label>
              <textarea
                value={rawRulesText}
                onChange={(e) => {
                  const raw = e.target.value;
                  setRawRulesText(raw);
                  setHackathonForm(prev => ({ ...prev, rules: raw.split('\n').map(s => s.trim()).filter(Boolean) }));
                }}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                rows={4}
                placeholder={`团队人数3-5人
必须在规定时间内完成作品
作品必须是原创
使用指定技术栈`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">最少团队人数</label>
                <input
                  type="number"
                  min={1}
                  value={hackathonForm.minTeamSize || 1}
                  onChange={(e) => setHackathonForm(prev => ({ ...prev, minTeamSize: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">最多团队人数</label>
                <input
                  type="number"
                  min={1}
                  value={hackathonForm.maxTeamSize || 5}
                  onChange={(e) => setHackathonForm(prev => ({ ...prev, maxTeamSize: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setEditingHackathon(null);
                  setHackathonForm({});
                  setRawPrizesText('');
                  setRawCategoriesText('');
                  setRawOrganizersText('');
                  setRawRulesText('');
                  setHackathonError('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-700/50 text-white font-semibold hover:bg-slate-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!hackathonForm.title?.trim()) {
                    setHackathonError('请输入竞赛名称');
                    return;
                  }
                  setHackathonError('');
                  // 判断是新增还是编辑
                  const isCreate = !editingHackathon?.title;
                  if (isCreate) {
                    createHackathon(hackathonForm);
                  } else {
                    updateHackathon({ ...editingHackathon, ...hackathonForm } as Hackathon);
                  }
                  setEditingHackathon(null);
                  setHackathonForm({});
                  setRawPrizesText('');
                  setRawCategoriesText('');
                  setRawOrganizersText('');
                  setRawRulesText('');
                  setHackathonError('');
                }}
                className="flex-1 py-2.5 rounded-xl btn-gradient text-white font-semibold hover:opacity-90 transition-opacity"
              >
                保存
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!deletingHackathon}
        onClose={() => setDeletingHackathon(null)}
        title="确认删除竞赛？"
        size="sm"
      >
        {deletingHackathon && (
          <div>
            <p className="text-slate-300 text-sm mb-6">
              你确定要删除竞赛 <span className="text-white font-medium">{deletingHackathon.title}</span> 吗？
              删除后该竞赛下的团队和作品数据将保留，但不再展示。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingHackathon(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-700/50 text-white font-semibold hover:bg-slate-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  deleteHackathon(deletingHackathon.id);
                  setDeletingHackathon(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-semibold hover:bg-red-500/30 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
