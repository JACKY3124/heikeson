import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Users,
  ChevronRight,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Heart,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/store';

export default function ViewerCenter() {
  const { user, hackathons, teams, submissions, scoreRecords, announcements, refreshAnnouncements } = useAppStore();

  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentTarget, setCommentTarget] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [comments, setComments] = useState([
    { user: '技术爱好者', content: '这个区块链投票系统的架构设计太棒了！', time: '2分钟前' },
    { user: 'AI探索者', content: 'AI驱动的DeFi项目很有前景，期待后续发展', time: '5分钟前' },
    { user: '创新导师', content: '团队的技术实现非常扎实，看好这个项目', time: '8分钟前' },
  ]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    submissions.slice(0, 6).forEach((submission) => {
      initial[submission.id] = Math.floor(Math.random() * 120) + 20;
    });
    return initial;
  });
  const [likedSubmissions, setLikedSubmissions] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'competition_running' | 'registration_open' | 'results_announced'>('all');

  const activeHackathons = hackathons.filter((h) => h.status === 'competition_running');
  const upcomingHackathons = hackathons.filter((h) => h.status === 'registration_open');

  const filteredSubmissions = submissions
    .filter((s) => {
      if (filterStatus === 'all') return true;
      const h = hackathons.find((hh) => hh.id === s.hackathonId);
      if (!h) return false;
      if (filterStatus === 'results_announced') return h.status === 'results_announced';
      return h.status === filterStatus;
    })
    .slice(0, 6);

  const sortedAnnouncements = [...announcements].sort(
    (a, b) => new Date(b.date || b.createdAt || '').getTime() - new Date(a.date || a.createdAt || '').getTime()
  );
  const latestAnnouncement = sortedAnnouncements[0];
  const announcementsToShow = sortedAnnouncements.slice(1);

  const handleRefreshAnnouncements = async () => {
    setIsRefreshing(true);
    try {
      await refreshAnnouncements();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    handleRefreshAnnouncements();
  }, []);

  const handlePostComment = () => {
    if (!commentText.trim()) {
      commentInputRef.current?.focus();
      return;
    }
    const commenter = user?.name || '匿名观众';
    setComments((prev) => [
      { user: commenter, content: commentText, time: '刚刚' },
      ...prev,
    ]);
    setCommentText('');
    setCommentTarget(null);
    commentInputRef.current?.focus();
  };

  const handleStartComment = (submissionTitle: string) => {
    setCommentTarget(submissionTitle);
    commentInputRef.current?.focus();
  };

  const handleToggleLike = (id: string) => {
    setLikeCounts((prev) => ({
      ...prev,
      [id]: prev[id] + (likedSubmissions.includes(id) ? -1 : 1),
    }));
    setLikedSubmissions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const stats = [
    { icon: Trophy, label: '竞赛总数', value: hackathons.length, color: 'text-yellow-500', bg: 'bg-yellow-500/20' },
    { icon: Users, label: '作品总数', value: submissions.length, color: 'text-blue-500', bg: 'bg-blue-500/20' },
    { icon: TrendingUp, label: '进行中', value: activeHackathons.length, color: 'text-green-500', bg: 'bg-green-500/20' },
    { icon: BarChart3, label: '即将开始', value: upcomingHackathons.length, color: 'text-purple-500', bg: 'bg-purple-500/20' },
  ];

  return (
    <div className="py-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-blue-400/80 mb-2">观众专区</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">观赛大厅</h1>
              <p className="text-slate-400 mt-2">欢迎回来{user?.name ? `，${user.name}` : ''}，这里是作品浏览、排行榜与赛事公告的集中入口。</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/hackathons"
                className="inline-flex items-center gap-2 rounded-2xl border border-blue-500/30 bg-slate-950/80 px-5 py-3 text-sm text-blue-300 hover:bg-slate-900 transition-colors"
              >
                浏览竞赛
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/leaderboard"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-medium text-white hover:bg-blue-400 transition-colors"
              >
                查看排行榜
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="glass rounded-3xl p-5">
                <div className="flex items-center gap-4 mb-3">
                  <div className={`${stat.bg} w-12 h-12 rounded-2xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">{stat.label}</p>
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">实时更新数据，方便观众快速了解赛事状态。</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <div className="space-y-6">
            <section className="glass rounded-[32px] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white">公告栏</h2>
                  <p className="text-slate-400 text-sm">最新赛事公告、时间提醒与平台动态。</p>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshAnnouncements}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? '刷新中' : '刷新公告'}
                </button>
              </div>
              <div className="grid gap-4">
                {latestAnnouncement ? (
                  <article className="rounded-3xl border border-slate-700/60 bg-slate-950/70 p-5 shadow-xl">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-white font-semibold">{latestAnnouncement.title}</p>
                        <p className="text-slate-500 text-xs mt-1">{latestAnnouncement.date} · {latestAnnouncement.status}</p>
                      </div>
                      <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs text-blue-300">最新</span>
                    </div>
                    <p className="text-slate-400 mt-4 leading-7">{latestAnnouncement.content}</p>
                  </article>
                ) : (
                  <div className="rounded-3xl border border-slate-700/60 bg-slate-950/70 p-6 text-slate-400">暂无公告</div>
                )}

                {announcementsToShow.map((announcement) => (
                  <article key={announcement.id} className="rounded-3xl border border-slate-700/60 bg-slate-950/70 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-white font-semibold">{announcement.title}</p>
                        <p className="text-slate-500 text-xs mt-1">{announcement.date} · {announcement.status}</p>
                      </div>
                      <span className="rounded-full bg-slate-700/20 px-3 py-1 text-xs text-slate-300">{announcement.tag}</span>
                    </div>
                    <p className="text-slate-400 mt-4 leading-7">{announcement.content}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="glass rounded-[32px] p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">作品展示区</h2>
                    <p className="text-slate-400 text-sm">精选热门作品，支持点赞与评论。</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { label: '全部作品', value: 'all' },
                        { label: '进行中', value: 'ongoing' },
                        { label: '即将开始', value: 'upcoming' },
                        { label: '完赛回顾', value: 'completed' },
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setFilterStatus(item.value as any)}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${filterStatus === (item.value as any) ? 'bg-blue-500 text-white' : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800'}`}
                        >
                          <Filter className="w-4 h-4" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredSubmissions.map((submission) => {
                  const submissionTeam = teams.find((t) => t.id === String(submission.teamId));
                  const submissionHackathon = hackathons.find((h) => h.id === String(submission.hackathonId));
                  const liked = likedSubmissions.includes(String(submission.id));
                  return (
                    <div key={submission.id} className="rounded-[32px] border border-slate-700/60 bg-slate-950/80 shadow-xl overflow-hidden">
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={submissionHackathon?.coverImage || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=675&fit=crop'}
                          alt={submission.title}
                          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
                        <div className="absolute left-5 bottom-5 right-5">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-300">{submissionHackathon?.title || '未关联竞赛'}</p>
                          <h3 className="text-xl font-semibold text-white mt-2">{submission.title}</h3>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex rounded-full bg-slate-900/90 px-3 py-1 text-xs text-slate-300">{submissionTeam?.name || '匿名团队'}</span>
                          <span className="text-xs text-slate-400">{submission.createdAt}</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-6 mt-4 line-clamp-3">{submission.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {submission.technology.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-300">{tag}</span>
                          ))}
                        </div>
                        <div className="mt-5 flex items-center justify-start gap-2 text-slate-400 text-sm">
                          <button
                            type="button"
                            onClick={() => handleToggleLike(String(submission.id))}
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors ${liked ? 'bg-pink-500/15 text-pink-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                          >
                            <Heart className="w-4 h-4" />
                            {likeCounts[String(submission.id)] ?? 0}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartComment(submission.title)}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" /> 评论
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="glass rounded-[32px] p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">热门榜单</h2>
                  <p className="text-slate-400 text-sm">实时查看TOP作品排名。</p>
                </div>
                <Link to="/leaderboard" className="text-blue-400 text-sm hover:text-blue-300 transition-colors">查看全部</Link>
              </div>
              <div className="space-y-3">
                {scoreRecords.slice(0, 5).map((record, index) => {
                  const submission = submissions.find((item) => item.id === record.submissionId);
                  const team = teams.find((item) => item.id === record.teamId);
                  return (
                    <Link
                      key={record.submissionId}
                      to="/leaderboard"
                      className="flex items-center gap-3 rounded-3xl border border-slate-700/60 bg-slate-950/80 p-4 hover:border-blue-500/30 transition-colors"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold ${index === 0 ? 'bg-yellow-500/15 text-yellow-300' : index === 1 ? 'bg-slate-500/15 text-slate-300' : 'bg-slate-800 text-slate-300'}`}>
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm truncate">{submission?.title || '未知作品'}</p>
                        <p className="text-slate-500 text-xs truncate">{team?.name || '匿名团队'}</p>
                      </div>
                      <span className="ml-auto text-sm font-semibold text-white">{record.finalScore}</span>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="glass rounded-[32px] p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">赛事资讯</h2>
                  <p className="text-slate-400 text-sm">最新赛事动态与推荐。</p>
                </div>
                <Link to="/hackathons" className="text-blue-400 text-sm hover:text-blue-300 transition-colors">查看更多</Link>
              </div>
              <div className="space-y-3">
                {hackathons.slice(0, 3).map((hackathon) => (
                  <Link
                    key={hackathon.id}
                    to={`/hackathons/${hackathon.id}`}
                    className="block rounded-3xl border border-slate-700/60 bg-slate-950/80 p-4 hover:border-blue-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-white text-sm font-medium">{hackathon.title}</p>
                        <p className="text-slate-500 text-xs">{hackathon.startDate} - {hackathon.endDate}</p>
                      </div>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{hackathon.status === 'competition_running' ? '进行中' : hackathon.status === 'registration_open' ? '报名中' : '已结束'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="glass rounded-[32px] p-6">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-white">评论区</h2>
                <p className="text-slate-400 text-sm">参与讨论，与观众一起交流作品看点。</p>
              </div>
              <div className="space-y-3">
                {comments.slice(0, 3).map((comment, index) => (
                  <div key={index} className="rounded-3xl border border-slate-700/60 bg-slate-950/80 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-blue-300 font-semibold">{comment.user[0]}</div>
                      <div>
                        <p className="text-sm font-medium text-white">{comment.user}</p>
                        <p className="text-xs text-slate-500">{comment.time}</p>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm leading-7">{comment.content}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                  ref={commentInputRef}
                  placeholder={commentTarget ? `写下你对「${commentTarget}」的评论…` : '写下你的评论…'}
                  className="w-full rounded-3xl border border-slate-700/60 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handlePostComment}
                  className="w-full rounded-3xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-400 transition-colors"
                >
                  发送评论
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
