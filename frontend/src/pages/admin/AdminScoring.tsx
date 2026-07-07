import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Cpu, Users, BarChart3, CheckCircle, RefreshCw, Save } from 'lucide-react';
import { useAppStore } from '@/store';
import type { ScoringConfig } from '@/types';

export default function AdminScoring() {
  const { 
    isAuthenticated, 
    userRole, 
    scoringConfig, 
    submissions, 
    teams, 
    scoreRecords, 
    runAIScoring,
    getLeaderboardByHackathon,
    hackathons 
  } = useAppStore();
  
  const [config, setConfig] = useState<ScoringConfig>(scoringConfig);
  const [saved, setSaved] = useState(false);
  const [runningAIScore, setRunningAIScore] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';

  if (!isAuthenticated || !isAdmin) {
    return (
    <div className="flex items-center justify-center py-16">
        <div className="text-center glass rounded-2xl p-12">
          <Settings className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold text-white mb-2">管理员入口</h3>
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
    totalSubmissions: submissions.length,
    scoredSubmissions: scoreRecords.filter(r => r.aiScore).length,
    expertScoredCount: scoreRecords.filter(r => r.expertScores.length > 0).length,
    avgScore: scoreRecords.length > 0 
      ? Math.round(scoreRecords.reduce((sum, r) => sum + r.finalScore, 0) / scoreRecords.length * 10) / 10 
      : 0,
  };

  return (
    <div className="py-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">评分管理</h1>
            <p className="text-slate-400">配置评分规则、管理AI评分、查看评分统计</p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-10">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalSubmissions}</p>
                <p className="text-sm text-slate-400">总提交数</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.scoredSubmissions}</p>
                <p className="text-sm text-slate-400">AI已评分</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.expertScoredCount}</p>
                <p className="text-sm text-slate-400">专家已评分</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.avgScore}</p>
                <p className="text-sm text-slate-400">平均分</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
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
                <div className="mb-4 p-3 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">
                  权重总和必须等于 100%，当前: {(totalWeight * 100).toFixed(1)}%
                </div>
              )}

              <div className="space-y-6">
                {config.criteria.map(criteria => (
                  <div key={criteria.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-white font-medium">{criteria.name}</span>
                        <span className="text-slate-500 text-sm ml-2">(当前 {(criteria.weight * 100).toFixed(0)}%)</span>
                      </div>
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
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                    <span className="text-slate-400 text-sm">%</span>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-green-500" />
                      <span className="text-white">专家评分</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={config.expertWeight * 100}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400"
                    />
                    <span className="text-slate-400 text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">AI评分管理</h2>
              
              <div className="mb-6">
                <p className="text-slate-400 text-sm mb-4">
                  点击按钮为未评分的作品触发AI评分。AI将根据项目描述、技术栈等信息自动打分。
                </p>
              </div>

              <div className="space-y-4">
                {submissions.slice(0, 6).map(submission => {
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
                        <div className="flex items-center gap-3">
                          {hasAIScore ? (
                            <div className="text-right">
                              <p className="text-yellow-500 font-semibold">
                                {record?.aiScore?.totalScore}
                              </p>
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
                    </div>
                  );
                })}
              </div>

              <Link
                to="/leaderboard"
                className="block mt-6 text-center py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                查看完整排行榜
              </Link>
            </div>

            <div className="glass rounded-2xl p-6 mt-6">
              <h2 className="text-xl font-semibold text-white mb-6">竞赛排行榜</h2>
              <div className="space-y-4">
                {hackathons.filter(h => h.status === 'ongoing' || h.status === 'completed').slice(0, 3).map(hackathon => {
                  const leaderboard = getLeaderboardByHackathon(hackathon.id);
                  return (
                    <div key={hackathon.id} className="p-4 bg-slate-800/50 rounded-xl">
                      <h4 className="text-white font-medium mb-3">{hackathon.title}</h4>
                      {leaderboard.length > 0 ? (
                        <div className="space-y-2">
                          {leaderboard.slice(0, 3).map(entry => (
                            <div key={entry.rank} className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">#{entry.rank} {entry.team.name}</span>
                              <span className="text-yellow-500 font-medium">{entry.score}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm">暂无数据</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
