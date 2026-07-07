import { useState } from 'react';
import { Search, Filter, Calendar, Users, MapPin } from 'lucide-react';
import { useAppStore } from '@/store';
import HackathonCard from '@/components/HackathonCard';

export default function Hackathons() {
  const { hackathons } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'registration_open' | 'competition_running' | 'results_announced'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'participants' | 'prize'>('date');

  const filteredHackathons = hackathons
    .filter((h) => {
      if (statusFilter !== 'all' && h.status !== statusFilter) return false;
      if (searchQuery && !h.title.toLowerCase().includes(searchQuery.toLowerCase()) && !h.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.startDate || '').getTime() - new Date(b.startDate || '').getTime();
        case 'participants':
          return (b.currentParticipants ?? 0) - (a.currentParticipants ?? 0);
        case 'prize':
          const prizeA = (a.prizes ?? []).reduce((sum, p) => sum + p.amount, 0);
          const prizeB = (b.prizes ?? []).reduce((sum, p) => sum + p.amount, 0);
          return prizeB - prizeA;
        default:
          return 0;
      }
    });

  const stats = [
    { icon: Calendar, label: '全部竞赛', value: hackathons.length },
    { icon: Users, label: '总参赛者', value: hackathons.reduce((sum, h) => sum + (h.currentParticipants ?? 0), 0) },
    { icon: MapPin, label: '举办城市', value: new Set(hackathons.map(h => h.location)).size },
  ];

  return (
    <div className="py-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">竞赛列表</h1>
          <p className="text-slate-400">探索各类精彩的黑客松竞赛</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {stats.map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass rounded-xl p-6 mb-10">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索竞赛..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="pl-12 pr-8 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="all">全部状态</option>
                  <option value="upcoming">即将开始</option>
                  <option value="ongoing">进行中</option>
                  <option value="completed">已结束</option>
                </select>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="date">按日期排序</option>
                <option value="participants">按参赛者排序</option>
                <option value="prize">按奖金排序</option>
              </select>
            </div>
          </div>
        </div>

        {filteredHackathons.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHackathons.map((hackathon) => (
              <HackathonCard key={hackathon.id} hackathon={hackathon} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl p-12 text-center">
            <Search className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h3 className="text-xl font-semibold text-white mb-2">未找到竞赛</h3>
            <p className="text-slate-400">尝试调整筛选条件或搜索关键词</p>
          </div>
        )}
      </div>
    </div>
  );
}
