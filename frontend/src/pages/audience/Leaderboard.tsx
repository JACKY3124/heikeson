import { useState } from 'react';
import {
  Trophy, Medal, Award, Star, Users,
  Cpu, UserCheck, TrendingUp, ChevronDown, Target, Code, BarChart3,
  Search,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { Team, Submission, ScoreRecord } from '@/types';
import { getCompetitionStatus } from '@/utils/helpers';

interface DisplayEntry {
  rank: number;
  team: Team;
  submission: Submission;
  displayScore: number;
  finalScore: number;
  aiScore?: ScoreRecord['aiScore'];
  expertScores?: ScoreRecord['expertScores'];
}

export default function Leaderboard() {
  const {
    hackathons, submissions, teams, users, scoreRecords,
    getLeaderboardByHackathon, scoringConfig,
  } = useAppStore();

  const [selectedHackathon, setSelectedHackathon] = useState<string>('all');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const activeHackathons = hackathons.filter(
    h => {
      const status = getCompetitionStatus(h);
      return status === 'judging' || status === 'results_announced';
    }
  );

  const criteria = scoringConfig.criteria;

  // 构建排行榜数据
  const displayLeaderboard: DisplayEntry[] = selectedHackathon === 'all'
    ? (scoreRecords
        .reduce<DisplayEntry[]>((acc, record) => {
          let team = teams.find(t => t.id === String(record.teamId));
          if (!team && String(record.teamId).startsWith('reg_')) {
            const userId = String(record.teamId).replace(/^reg_/, '').split('_')[0];
            const submitter = users.find(u => u.id === userId);
            if (submitter) team = { id: String(record.teamId), name: `${submitter.name} 的团队`, description: '', members: [submitter], hackathonId: String(record.hackathonId), createdAt: new Date().toISOString(), maxMembers: 5, minMembers: 1, leaderId: String(submitter.id) };
          }
          const submission = submissions.find(s => s.id === record.submissionId);
          if (!team || !submission) return acc;
          acc.push({
            rank: 0, team, submission,
            displayScore: record.finalScore, finalScore: record.finalScore,
            aiScore: record.aiScore, expertScores: record.expertScores,
          });
          return acc;
        }, [])
        .sort((a, b) => b.displayScore - a.displayScore)
        .map((entry, idx) => ({ ...entry, rank: idx + 1 })))
    : getLeaderboardByHackathon(selectedHackathon).map(entry => ({
        rank: entry.rank, team: entry.team, submission: entry.submission,
        displayScore: entry.score, finalScore: entry.score,
        aiScore: scoreRecords.find(r => r.submissionId === entry.submission.id)?.aiScore,
        expertScores: scoreRecords.find(r => r.submissionId === entry.submission.id)?.expertScores,
      } satisfies DisplayEntry));

  const top3 = displayLeaderboard.slice(0, 3);
  const rest = displayLeaderboard.slice(3);

  // 搜索：按竞赛名模糊匹配全部竞赛
  const searchSuggestions = searchQuery.trim()
    ? hackathons.filter(h =>
        h.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];


  /** 高亮匹配文字 */
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <>{text}</>;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);
    return <>{before}<span className="text-blue-400 font-semibold">{match}</span>{after}</>;
  };

  const totalTeams = displayLeaderboard.length;
  const avgScore = totalTeams > 0
    ? Math.round(displayLeaderboard.reduce((s, e) => s + e.displayScore, 0) / totalTeams * 10) / 10
    : 0;

  return (
    <div className="py-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* 页头 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="text-white font-semibold text-sm">Leaderboard</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            竞赛<span className="gradient-text">排行榜</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            实时追踪各竞赛团队表现，见证顶尖创新者的诞生
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: '参赛团队', value: totalTeams, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: Star, label: '平均评分', value: avgScore, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { icon: TrendingUp, label: '最高分', value: displayLeaderboard[0]?.displayScore || 0, color: 'text-green-400', bg: 'bg-green-500/10' },
            { icon: Target, label: '竞赛数', value: activeHackathons.length, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          ].map((stat, i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-slate-500 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* 竞赛选择 + 搜索 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => { setSelectedHackathon('all'); setSearchQuery(''); }}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                selectedHackathon === 'all'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              全部竞赛
            </button>
            {activeHackathons.map(h => (
              <button
                key={String(h.id)}
                onClick={() => { setSelectedHackathon(String(h.id)); setSearchQuery(''); }}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedHackathon === String(h.id)
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <img src={h.coverImage} alt="" className="w-5 h-4 rounded object-cover" />
                {h.title}
              </button>
            ))}
          </div>
          {/* 竞赛名搜索框 + 下拉建议 */}
          <div className="relative flex-shrink-0 sm:ml-auto w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
                if (!e.target.value.trim()) setSelectedHackathon('all');
              }}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setShowSuggestions(false);
                  setSearchQuery('');
                  setSelectedHackathon('all');
                }
              }}
              placeholder="搜索竞赛名..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
            {/* 下拉模糊匹配建议 */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl overflow-hidden z-50">
                {searchSuggestions.map(h => (
                  <button
                    key={String(h.id)}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      setSearchQuery(h.title);
                      setSelectedHackathon(String(h.id));
                      setShowSuggestions(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-0"
                  >
                    <img src={h.coverImage} alt="" className="w-6 h-5 rounded object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{highlightMatch(h.title, searchQuery)}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {h.status === 'competition_running' ? '进行中' : h.status === 'judging' ? '评审中' : '已结束'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {/* 无匹配提示 */}
            {showSuggestions && searchQuery.trim() && searchSuggestions.length === 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="px-4 py-4 text-center text-slate-500 text-sm">
                  未找到匹配的竞赛
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 评分权重提示 */}
        <div className="flex items-center gap-6 mb-8 px-5 py-3 glass rounded-xl text-sm">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">AI 评分权重</span>
            <span className="text-purple-400 font-semibold">
              {(scoringConfig.aiWeight * 100).toFixed(0)}%
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-green-400" />
            <span className="text-slate-400">专家评分权重</span>
            <span className="text-green-400 font-semibold">
              {(scoringConfig.expertWeight * 100).toFixed(0)}%
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">最少专家评分</span>
            <span className="text-white font-semibold">{scoringConfig.minExpertScores} 人</span>
          </div>
        </div>

        {displayLeaderboard.length > 0 ? (
          <>
            {/* 前三名 - Podium 领奖台 */}
            {top3.length > 0 && (
              <div className="grid md:grid-cols-3 gap-5 mb-10">
                {/* 第二名（左边） */}
                {top3[1] && (
                  <div className="order-2 md:order-1">
                    <PodiumCard entry={top3[1]} rank={2} criteria={criteria} />
                  </div>
                )}
                {/* 第一名（中间，更高） */}
                {top3[0] && (
                  <div className="order-1 md:order-2 md:-mt-4">
                    <PodiumCard entry={top3[0]} rank={1} criteria={criteria} />
                  </div>
                )}
                {/* 第三名（右边） */}
                {top3[2] && (
                  <div className="order-3 md:order-3">
                    <PodiumCard entry={top3[2]} rank={3} criteria={criteria} />
                  </div>
                )}
              </div>
            )}

            {/* 4+ 排名列表 */}
            {rest.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  其他排名
                </h3>
                {rest.map(entry => (
                  <RankRow
                    key={entry.rank}
                    entry={entry}
                    isExpanded={expandedEntry === String(entry.submission.id)}
                    onToggle={() => setExpandedEntry(
                      expandedEntry === String(entry.submission.id) ? null : String(entry.submission.id)
                    )}
                    criteria={criteria}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="glass rounded-3xl p-16 text-center">
            <Trophy className="w-20 h-20 mx-auto mb-6 text-slate-600" />
            <h3 className="text-2xl font-semibold text-white mb-3">暂无排名数据</h3>
            <p className="text-slate-500 text-lg">
              {selectedHackathon === 'all'
                ? '比赛进行中，排名将在作品提交截止后更新'
                : '该竞赛暂无评分记录'}
            </p>
          </div>
        )}

        {/* 底部奖金 */}
        <div className="mt-16">
          <h3 className="text-xl font-bold text-white text-center mb-8">
            <span className="gradient-text">奖金池</span>
          </h3>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { rank: 1, prize: '¥50,000', label: '一等奖', icon: Trophy, color: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/30', iconColor: 'text-yellow-500' },
              { rank: 2, prize: '¥30,000', label: '二等奖', icon: Medal, color: 'from-slate-400/20 to-slate-500/10', border: 'border-slate-400/30', iconColor: 'text-slate-300' },
              { rank: 3, prize: '¥10,000', label: '三等奖', icon: Award, color: 'from-amber-500/20 to-orange-600/10', border: 'border-amber-500/30', iconColor: 'text-amber-500' },
            ].map((prize, i) => (
              <div key={i} className={`rounded-2xl p-8 text-center bg-gradient-to-br ${prize.color} border ${prize.border} backdrop-blur-sm`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center`}>
                  <prize.icon className={`w-8 h-8 ${prize.iconColor}`} />
                </div>
                <p className="text-3xl font-bold text-white mb-2">{prize.prize}</p>
                <p className="text-slate-400">{prize.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 前三名领奖台卡片 */
function PodiumCard({
  entry,
  rank,
  criteria,
}: {
  entry: DisplayEntry;
  rank: 1 | 2 | 3;
  criteria: { id: string; name: string }[];
}) {
  const badge = getRankBadge(rank);
  const IconComponent = badge!.icon;

  return (
    <div className={`h-full rounded-2xl overflow-hidden border ${rank === 1 ? 'border-yellow-500/40 shadow-xl shadow-yellow-500/10' : rank === 2 ? 'border-slate-400/30' : 'border-amber-500/30'} bg-slate-900/80 backdrop-blur-sm`}>
      {/* 顶部渐变条 */}
      <div className={`h-1.5 bg-gradient-to-r ${badge!.bg}`} />
      <div className="p-6">
        {/* 排名徽章 */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${badge!.bg} flex items-center justify-center shadow-lg ${badge!.glow}`}>
            <IconComponent className={`w-6 h-6 text-white`} />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${badge!.text}`}>
              {rank === 1 ? 'CHAMPION' : rank === 2 ? 'RUNNER-UP' : '3RD PLACE'}
            </p>
            <p className="text-white font-bold text-2xl">{entry.displayScore}</p>
          </div>
        </div>

        {/* 团队信息 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-bold text-lg truncate">{entry.submission.title}</h3>
          </div>
        </div>

        {/* 技术标签 */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {entry.submission.technology.slice(0, 3).map(tech => (
            <span key={tech} className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 text-xs font-medium">
              {tech}
            </span>
          ))}
        </div>

        {/* 评分维度条 */}
        <div className="space-y-2.5">
          {criteria.slice(0, 4).map(c => {
            const score = entry.aiScore?.scores.find(s => s.criteriaId === c.id)?.score || 0;
            return (
              <div key={c.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">{c.name}</span>
                  <span className="text-slate-300 font-medium">{score}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${score >= 85 ? 'from-emerald-400 to-green-500' : score >= 70 ? 'from-blue-400 to-cyan-500' : 'from-amber-400 to-yellow-500'}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** 4+ 排名行 */
function RankRow({
  entry,
  isExpanded,
  onToggle,
  criteria,
}: {
  entry: DisplayEntry;
  isExpanded: boolean;
  onToggle: () => void;
  criteria: { id: string; name: string }[];
}) {
  const getScoreBarColor = (s: number) => {
    if (s >= 85) return 'from-emerald-400 to-green-500';
    if (s >= 70) return 'from-blue-400 to-cyan-500';
    if (s >= 50) return 'from-amber-400 to-yellow-500';
    return 'from-red-400 to-orange-500';
  };

  return (
    <div
      className={`rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm transition-all cursor-pointer hover:border-slate-600/50 hover:bg-slate-800/50`}
      onClick={onToggle}
    >
      <div className="px-5 py-4 flex items-center gap-4">
        {/* 排名 */}
        <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center flex-shrink-0">
          <span className="text-slate-300 font-bold text-sm">#{entry.rank}</span>
        </div>

        {/* 团队信息 */}
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium truncate">{entry.submission.title}</h4>
          <p className="text-slate-500 text-xs truncate">{entry.team.name}</p>
        </div>

        {/* 分数进度条 */}
        <div className="hidden sm:flex items-center gap-3 flex-1 max-w-[200px]">
          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getScoreBarColor(entry.displayScore)}`}
              style={{ width: `${Math.min(entry.displayScore, 100)}%` }}
            />
          </div>
        </div>

        {/* 分数 */}
        <div className="text-right flex-shrink-0">
          <p className="text-white font-bold text-lg">{entry.displayScore}</p>
          <p className="text-slate-500 text-[10px]">分</p>
        </div>

        {/* 展开按钮 */}
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
      </div>

      {/* 展开详情 */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-0 border-t border-slate-700/30 mt-1 mx-5">
          <div className="pt-4 grid md:grid-cols-2 gap-5">
            {/* 评分明细 */}
            <div>
              <p className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" /> 评分明细
              </p>

              {entry.aiScore && (
                <div className="mb-3 p-3 bg-purple-500/10 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-purple-400 text-xs font-medium">AI 评分</span>
                    </div>
                    <span className="text-purple-400 font-bold text-sm">{entry.aiScore.totalScore}</span>
                  </div>
                  <div className="space-y-1.5">
                    {criteria.map(c => {
                      const s = entry.aiScore?.scores.find(sc => sc.criteriaId === c.id);
                      return (
                        <div key={c.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{c.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full bg-gradient-to-r ${getScoreBarColor(s?.score || 0)}`} style={{ width: `${s?.score || 0}%` }} />
                            </div>
                            <span className="text-slate-300 w-5 text-right">{s?.score || '-'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {entry.expertScores && entry.expertScores.length > 0 && (
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400 text-xs font-medium">
                        专家评分（{entry.expertScores.length}人）
                      </span>
                    </div>
                    <span className="text-green-400 font-bold text-sm">
                      {Math.round(entry.expertScores.reduce((s, e) => s + e.totalScore, 0) / entry.expertScores.length * 10) / 10}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {entry.expertScores.map(es => es.expertName).join('、')}
                  </div>
                </div>
              )}
            </div>

            {/* 项目信息 */}
            <div>
              <p className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" /> 项目信息
              </p>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                {entry.submission.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {entry.submission.technology.map(tech => (
                  <span key={tech} className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs">
                    {tech}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                {entry.team.members.map(m => m.name).join(' · ')}
              </p>
              {entry.aiScore?.feedback && (
                <p className="mt-2 text-xs text-slate-600 italic leading-relaxed bg-white/5 rounded-lg p-2.5">
                  "{entry.aiScore.feedback}"
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 排名图标和颜色 */
function getRankBadge(rank: number) {
  switch (rank) {
    case 1: return { icon: Trophy, bg: 'from-amber-400 to-yellow-600', text: 'text-yellow-500', glow: 'shadow-yellow-500/30' };
    case 2: return { icon: Medal, bg: 'from-slate-300 to-slate-500', text: 'text-slate-400', glow: 'shadow-slate-400/20' };
    case 3: return { icon: Award, bg: 'from-amber-500 to-orange-700', text: 'text-amber-500', glow: 'shadow-amber-500/20' };
    default: return null;
  }
}
