import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, FileText, Star, TrendingUp,
  Clock, BarChart3, ChevronRight,
  Sparkles, Target,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Card, Badge, Empty } from '@/components/ui';

export default function PlayerCenter() {
  const navigate = useNavigate();
  const {
    isAuthenticated, userRole,
    hackathons,
    getUserSubmissions, getScoreRecord,
    getHackathonById,
  } = useAppStore();

  // [API] 对接点：页面挂载时触发数据初始化
  // useEffect(() => {
  //   if (isAuthenticated && userRole === 'player') {
  //     useAppStore.getState().fetchPlayerData(user.id);
  //   }
  // }, [isAuthenticated, userRole, user?.id]);
  //
  // 在 store 中新增 fetchPlayerData(userId) 方法，并发请求：
  //   const [hackathons, submissions, teams] = await Promise.all([
  //     getHackathons(),
  //     getSubmissions({ userId }),
  //     getTeams({ userId }),
  //   ]);
  //   set({ hackathons, submissions, teams });

  const [activeTab, setActiveTab] = useState<'submissions' | 'scores'>('submissions');

  if (!isAuthenticated || userRole !== 'player') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center glass rounded-2xl p-12 max-w-md mx-auto">
          <User className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold text-white mb-2">选手中心</h3>
          <p className="text-slate-400 mb-6">需要选手账号登录后才能访问</p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 rounded-xl btn-gradient text-white font-semibold hover:opacity-90 transition-opacity"
          >
            登录
          </Link>
        </div>
      </div>
    );
  }

  const submissions = getUserSubmissions();

  // 统计数据
  const stats = useMemo(() => {
    const scored = submissions.filter(s => {
      const r = getScoreRecord(String(s.id));
      return r && (r.aiScore || r.expertScores.length > 0);
    });
    const avg = scored.length > 0
      ? Math.round(scored.reduce((sum, s) => {
          const r = getScoreRecord(String(s.id));
          return sum + (r?.finalScore || 0);
        }, 0) / scored.length * 10) / 10
      : 0;
    return {
      total: submissions.length,
      scored: scored.length,
      avgScore: avg,
    };
  }, [submissions, getScoreRecord]);

  // 各维度评分
  const dimensionScores = useMemo(() => {
    const dimensions = [
      { id: 'innovation', name: '创新性', total: 0, count: 0 },
      { id: 'technical', name: '技术难度', total: 0, count: 0 },
      { id: 'practicality', name: '实用性', total: 0, count: 0 },
      { id: 'business', name: '商业价值', total: 0, count: 0 },
    ];

    submissions.forEach(sub => {
      const record = getScoreRecord(String(sub.id));
      if (record?.aiScore) {
        record.aiScore.scores.forEach(s => {
          const dim = dimensions.find(d => d.id === s.criteriaId);
          if (dim) {
            dim.total += s.score;
            dim.count++;
          }
        });
      }
    });

    return dimensions.map(d => ({
      ...d,
      score: d.count > 0 ? Math.round(d.total / d.count) : 0,
    }));
  }, [submissions]);

  // 近期动态
  const recentActivity = useMemo(() => {
    return submissions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [submissions]);

  // 可参与的竞赛推荐
  const joinableHackathons = useMemo(() => {
    return hackathons.filter(h => h.status !== 'results_announced');
  }, [hackathons]);

  return (
    <div className="py-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">选手中心</h1>
          <p className="text-slate-400">管理你的竞赛参与和作品提交</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* Tab 切换 */}
            <Card className="overflow-hidden">
              <div className="flex border-b border-slate-700">
                {[
                  { key: 'submissions' as const, label: '我的作品', icon: FileText },
                  { key: 'scores' as const, label: '评分分析', icon: BarChart3 },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors relative ${
                      activeTab === tab.key
                        ? 'text-blue-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {activeTab === tab.key && (
                      <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-blue-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Tab: 我的作品 */}
                {activeTab === 'submissions' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">近期作品</h3>
                      {submissions.length > 0 && (
                        <Link
                          to="/my-submissions"
                          className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          查看全部
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                    {submissions.length > 0 ? (
                      <div className="space-y-3">
                        {submissions.slice(0, 5).map(sub => {
                          const record = getScoreRecord(String(sub.id));
                          const hack = getHackathonById(String(sub.hackathonId));
                          return (
                            <Link
                              key={String(sub.id)}
                              to="/my-submissions"
                              className="block p-4 bg-slate-800/40 rounded-xl hover:bg-slate-800/70 transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-white font-medium group-hover:text-blue-400 transition-colors truncate">
                                      {sub.title}
                                    </h4>
                                    <p className="text-slate-500 text-xs mt-0.5">
                                      {hack?.title} · {new Date(sub.createdAt).toLocaleDateString('zh-CN')}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {sub.technology.slice(0, 3).map(t => (
                                        <span key={t} className="px-2 py-0.5 rounded bg-slate-700/60 text-slate-400 text-xs">
                                          {t}
                                        </span>
                                      ))}
                                      {sub.technology.length > 3 && (
                                        <span className="px-2 py-0.5 rounded bg-slate-700/60 text-slate-500 text-xs">
                                          +{sub.technology.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  {(() => {
                                    const isScored = record && (record.aiScore || record.expertScores.length > 0);
                                    return isScored ? (
                                      <div>
                                        <p className="text-lg font-bold text-yellow-500">{record!.finalScore}</p>
                                        <p className="text-slate-500 text-xs">分</p>
                                      </div>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs">
                                        <Clock className="w-3 h-3" />
                                        待评分
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                        <p className="text-slate-400 mb-4">还没有提交任何作品</p>
                        <button
                          onClick={() => navigate('/my-submissions')}
                          className="px-5 py-2.5 rounded-xl btn-gradient text-white font-semibold hover:opacity-90 transition-opacity"
                        >
                          立即提交
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: 评分分析 */}
                {activeTab === 'scores' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">各维度评分概览</h3>
                    {submissions.length > 0 ? (
                      <div className="space-y-5">
                        {dimensionScores.map(dim => (
                          <div key={dim.id}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-slate-300 text-sm font-medium">{dim.name}</span>
                              <span className="text-white font-semibold">{dim.score}</span>
                            </div>
                            <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${dim.score}%`,
                                  background: dim.score >= 85
                                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                    : dim.score >= 70
                                    ? 'linear-gradient(90deg, #3b82f6, #2563eb)'
                                    : 'linear-gradient(90deg, #f59e0b, #d97706)',
                                }}
                              />
                            </div>
                          </div>
                        ))}
                        <div className="mt-6 p-4 bg-slate-800/40 rounded-xl">
                          <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <BarChart3 className="w-4 h-4 text-blue-400" />
                            <span>
                              综合平均分 <strong className="text-white">{stats.avgScore}</strong>
                            </span>
                            <span className="mx-2">·</span>
                            <span>
                              已评分 <strong className="text-green-400">{stats.scored}</strong> / {stats.total} 个作品
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Empty
                        icon={<BarChart3 className="w-12 h-12 text-slate-600" />}
                        title="暂无评分数据"
                        description="提交作品并完成评分后即可查看分析"
                      />
                    )}
                  </div>
                )}

              </div>
            </Card>

            {/* 近期动态 */}
            {recentActivity.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  近期动态
                </h3>
                <div className="space-y-3">
                  {recentActivity.map(sub => {
                    const hack = getHackathonById(String(sub.hackathonId));
                    const record = getScoreRecord(String(sub.id));
                    const isScored = record && (record.aiScore || record.expertScores.length > 0);
                    return (
                      <div key={String(sub.id)} className="flex items-center gap-4 text-sm">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1" />
                        <div className="flex-1 min-w-0">
                          <span className="text-slate-300">{sub.title}</span>
                          <span className="text-slate-500 mx-1.5">·</span>
                          <span className="text-slate-500">{hack?.title}</span>
                        </div>
                        <span className={`flex-shrink-0 ${isScored ? 'text-blue-400 font-medium' : 'text-slate-500'}`}>
                          {isScored
                            ? `评分 ${record!.finalScore}`
                            : new Date(sub.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* 右侧栏 */}
          <div className="space-y-6">
            {/* 可参与的竞赛 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                可参与竞赛
              </h3>
              <Link
                to="/hackathons"
                className="block w-full py-2.5 rounded-xl bg-blue-500/20 text-blue-400 text-center hover:bg-blue-500/30 transition-colors text-sm font-medium"
              >
                浏览竞赛
              </Link>
            </Card>

            {/* 可参与的竞赛推荐 */}
            {joinableHackathons.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  推荐参赛
                </h3>
                <div className="space-y-3">
                  {joinableHackathons.slice(0, 3).map(h => (
                    <Link
                      key={h.id}
                      to={`/hackathons/${h.id}`}
                      className="block p-3 bg-slate-800/40 rounded-xl hover:bg-slate-800/70 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-white font-medium truncate group-hover:text-blue-400 transition-colors">
                            {h.title}
                          </h4>
                          <p className="text-slate-500 text-xs mt-1">{h.location} · {h.currentParticipants}人参与</p>
                        </div>
                        <Badge
                          variant={h.status === 'competition_running' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {h.status === 'competition_running' ? '进行中' : '即将开始'}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* 统计概览 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                我的数据
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-800/40 rounded-xl text-center">
                  <p className="text-2xl font-bold text-blue-400">{submissions.length}</p>
                  <p className="text-slate-500 text-xs mt-1">提交作品</p>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl text-center">
                  <p className="text-2xl font-bold text-yellow-400">{stats.scored}</p>
                  <p className="text-slate-500 text-xs mt-1">已评分</p>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.avgScore}</p>
                  <p className="text-slate-500 text-xs mt-1">平均分</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}