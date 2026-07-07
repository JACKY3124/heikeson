import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, CheckCircle, Users, FileText, Send, History, Search, ExternalLink, Video } from 'lucide-react';
import { useAppStore } from '@/store';
import type { ExpertScore, CriteriaScore } from '@/types';

export default function ExpertReview() {
  const { isAuthenticated, userRole, user, submissions, users, getPendingReviews, submitExpertScore, getScoreRecord, scoreRecords, teams } = useAppStore();
  
  // [API] 对接点：页面挂载时获取待评审列表（当前使用 getPendingReviews() 从 store 计算）
  // 对接后：store 的 getPendingReviews 内部调用 getPendingReviewsAPI()
  // useEffect(() => {
  //   if (isExpert) {
  //     useAppStore.getState().fetchPendingReviews();
  //   }
  // }, [isExpert]);

  const [activeView, setActiveView] = useState<'pending' | 'completed'>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({
    innovation: 0,
    technical: 0,
    practicality: 0,
    business: 0,
  });
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const pendingReviews = getPendingReviews();
  const isExpert = userRole === 'expert';

  const completedReviews = scoreRecords
    .filter(r => r.expertScores.some(es => es.expertId === user?.id))
    .map(r => {
      const submission = submissions.find(s => s.id === r.submissionId);
      let team = submission ? teams.find(t => t.id === submission.teamId) : null;
      if (!team && submission?.teamId?.startsWith('reg_')) {
        const userId = submission.teamId.replace(/^reg_/, '').split('_')[0];
        const submitter = users.find(u => u.id === userId);
        if (submitter) team = { id: submission.teamId, name: `${submitter.name} 的团队`, description: '', members: [submitter], hackathonId: submission.hackathonId, createdAt: submission.createdAt, maxMembers: 5, minMembers: 1, leaderId: submitter.id };
      }
      const myScore = r.expertScores.find(es => es.expertId === user?.id);
      return { record: r, submission, team, myScore };
    })
    .filter((item): item is typeof item & { submission: NonNullable<typeof item.submission>; team: NonNullable<typeof item.team>; myScore: NonNullable<typeof item.myScore> } =>
      !!item.submission && !!item.team && !!item.myScore
    )
    .filter(item =>
      !searchTerm || item.submission.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (!isAuthenticated || !isExpert) {
    return (
    <div className="flex items-center justify-center py-16">
        <div className="text-center glass rounded-2xl p-12">
          <Star className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold text-white mb-2">专家入口</h3>
          <p className="text-slate-400 mb-6">需要专家账号登录后才能访问</p>
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

  const criteria = [
    { id: 'innovation', name: '创新性', weight: 0.3, desc: '项目的创新程度和独特性' },
    { id: 'technical', name: '技术难度', weight: 0.25, desc: '技术实现的复杂度' },
    { id: 'practicality', name: '实用性', weight: 0.25, desc: '实际应用价值' },
    { id: 'business', name: '商业价值', weight: 0.2, desc: '商业化潜力' },
  ];

  const handleSubmitScore = () => {
    if (!selectedSubmission || !user) return;

    const criteriaScores: CriteriaScore[] = criteria.map(c => ({
      criteriaId: c.id,
      score: scores[c.id as keyof typeof scores],
      feedback: '',
    }));

    const totalScore = criteria.reduce((sum, c) => {
      return sum + scores[c.id as keyof typeof scores] * c.weight;
    }, 0);

    const expertScore: ExpertScore = {
      expertId: user.id,
      expertName: user.name,
      submissionId: selectedSubmission,
      scores: criteriaScores,
      totalScore: Math.round(totalScore * 10) / 10,
      comment,
      evaluatedAt: new Date().toISOString(),
    };

    submitExpertScore(expertScore);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedSubmission(null);
      setScores({ innovation: 0, technical: 0, practicality: 0, business: 0 });
      setComment('');
    }, 2000);
  };

  return (
    <div className="py-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">专家评审</h1>
            <p className="text-slate-400">评审参赛作品并提交评分</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-white">{pendingReviews.length} 待评审</span>
            </div>
            <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-white">{completedReviews.length} 已评审</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          <button
            onClick={() => { setActiveView('pending'); setSelectedSubmission(null); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeView === 'pending'
                ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-4 h-4" />
            待评审
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs ml-1">{pendingReviews.length}</span>
          </button>
          <button
            onClick={() => { setActiveView('completed'); setSelectedSubmission(null); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeView === 'completed'
                ? 'bg-green-500/20 text-green-400 shadow-lg shadow-green-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <History className="w-4 h-4" />
            已评审
            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs ml-1">{completedReviews.length}</span>
          </button>
        </div>

        {activeView === 'pending' ? (
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">待评审作品</h2>
              <div className="space-y-4">
                {pendingReviews.map(({ submission, team }) => {
                  const record = getScoreRecord(submission.id);
                  const hasScored = record?.expertScores.some(es => es.expertId === user?.id);
                  const isSelected = selectedSubmission === submission.id;

                  return (
                    <div
                      key={submission.id}
                      onClick={() => !hasScored && setSelectedSubmission(submission.id)}
                      className={`glass rounded-xl p-5 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/30'
                          : hasScored
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{submission.title}</h3>
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                              <Users className="w-4 h-4" />
                              <span>{team.name}</span>
                            </div>
                          </div>
                        </div>
                        {hasScored && (
                          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                            已评分
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                        {submission.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {submission.technology.map(tech => (
                          <span key={tech} className="px-2 py-1 rounded bg-slate-700/50 text-slate-300 text-xs">
                            {tech}
                          </span>
                        ))}
                      </div>
                      {record && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">已有 {record.expertScores.length} 位专家评分</span>
                            <span className="text-yellow-500">AI评分: {record.aiScore?.totalScore || '-'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {pendingReviews.length === 0 && (
                  <div className="glass rounded-xl p-8 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p className="text-white font-medium">暂无待评审作品</p>
                    <p className="text-slate-400 text-sm mt-2">所有作品已完成评审</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-4">提交评分</h2>
              {selectedSubmission ? (
                (() => {
                  const selectedSubmissionData = submissions.find(s => s.id === selectedSubmission);
                  if (!selectedSubmissionData) return null;
                  const selectedRecord = getScoreRecord(selectedSubmissionData.id);

                  return (
                    <div className="glass rounded-xl p-6">
                      <div className="mb-6">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-white">{selectedSubmissionData.title}</h3>
                          <button
                            onClick={() => setSelectedSubmission(null)}
                            className="text-xs text-slate-400 hover:text-white transition-colors"
                          >
                            返回选择
                          </button>
                        </div>
                        <p className="text-slate-400 text-sm mb-4">{selectedSubmissionData.description}</p>

                        <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            作品资料
                          </h4>
                          <div className="space-y-2">
                            {selectedSubmissionData.githubUrl && (
                              <a
                                href={selectedSubmissionData.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span className="truncate">{selectedSubmissionData.githubUrl}</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                            )}
                            {selectedSubmissionData.videoUrl && (
                              <a
                                href={selectedSubmissionData.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                <Video className="w-4 h-4" />
                                <span className="truncate">{selectedSubmissionData.videoUrl}</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                            )}
                            {!selectedSubmissionData.githubUrl && !selectedSubmissionData.videoUrl && (
                              <p className="text-slate-500 text-sm">暂无作品链接</p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {selectedSubmissionData.technology.map(tech => (
                              <span key={tech} className="px-2 py-1 rounded bg-slate-700/50 text-slate-300 text-xs">
                                {tech}
                              </span>
                            ))}
                          </div>
                          {selectedRecord && (
                            <div className="mt-3 pt-3 border-t border-slate-700/50">
                              <span className="text-slate-400 text-sm">
                                AI评分: <span className="text-yellow-500">{selectedRecord.aiScore?.totalScore ?? '-'}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-6">
                        {criteria.map(c => (
                          <div key={c.id}>
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="text-white font-medium">{c.name}</span>
                                <span className="text-slate-500 text-sm ml-2">(权重 {c.weight * 100}%)</span>
                              </div>
                              <span className="text-blue-400 font-semibold">{scores[c.id as keyof typeof scores]} 分</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={scores[c.id as keyof typeof scores]}
                              onChange={(e) => setScores(prev => ({ ...prev, [c.id]: Number(e.target.value) }))}
                              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <p className="text-slate-500 text-xs mt-1">{c.desc}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6">
                        <label className="block text-white font-medium mb-2">评语</label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="请输入您的评审意见..."
                          rows={4}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                        />
                      </div>

                      <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-400">总分</span>
                          <span className="text-2xl font-bold text-yellow-500">
                            {Math.round(criteria.reduce((sum, c) => sum + scores[c.id as keyof typeof scores] * c.weight, 0) * 10) / 10}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleSubmitScore}
                        disabled={submitted}
                        className={`w-full mt-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                          submitted
                            ? 'bg-green-500/20 text-green-400'
                            : 'btn-gradient text-white hover:opacity-90'
                        }`}
                      >
                        {submitted ? (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            已提交
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            提交评分
                          </>
                        )}
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="glass rounded-xl p-12 text-center">
                  <Star className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                  <p className="text-slate-400">请从左侧选择要评审的作品</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索已评审作品或团队..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                />
              </div>
              <span className="text-slate-400 text-sm">共 {completedReviews.length} 条记录</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {completedReviews.map(({ record, submission, team, myScore }) => (
                <div key={submission.id} className="glass rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{submission.title}</h3>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Users className="w-4 h-4" />
                          <span>{team.name}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                      已完成
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {myScore.scores.map(sc => {
                      const c = criteria.find(cr => cr.id === sc.criteriaId);
                      return (
                        <div key={sc.criteriaId} className="flex items-center justify-between px-2 py-1 bg-slate-800/50 rounded">
                          <span className="text-slate-400 text-xs">{c?.name}</span>
                          <span className="text-white text-sm font-medium">{sc.score}</span>
                        </div>
                      );
                    })}
                  </div>

                  {myScore.comment && (
                    <p className="text-slate-400 text-sm mb-3 italic">"{myScore.comment}"</p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                    <span className="text-slate-400 text-sm">
                      AI评分: <span className="text-yellow-500">{record.aiScore?.totalScore ?? '-'}</span>
                    </span>
                    <span className="text-green-400 font-bold">
                      你的评分: {myScore.totalScore}
                    </span>
                  </div>
                </div>
              ))}
              {completedReviews.length === 0 && (
                <div className="glass rounded-xl p-12 text-center col-span-2">
                  <History className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                  <p className="text-white font-medium">{searchTerm ? '未找到匹配的记录' : '还没有完成任何评审'}</p>
                  {!searchTerm && (
                    <p className="text-slate-400 text-sm mt-2">请在"待评审"标签页开始评审作品</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
