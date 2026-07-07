import { Link } from 'react-router-dom';
import { Calendar, Users, MapPin, Award, Trophy, Clock } from 'lucide-react';
import type { Hackathon } from '@/types';
import { getCompetitionStatus, formatDate } from '@/utils/helpers';

interface HackathonCardProps {
  hackathon: Hackathon;
}

export default function HackathonCard({ hackathon }: HackathonCardProps) {
  const getStatusBadge = () => {
    const now = new Date().getTime();
    const regOpenTime = new Date(hackathon.registrationOpenTime || hackathon.startDate || '').getTime();
    const status = getCompetitionStatus(hackathon);

    switch (status) {
      case 'registration_open':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            报名中
          </span>
        );
      case 'registration_closed':
        if (now < regOpenTime) {
          return (
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
              即将开始
            </span>
          );
        }
        return (
          <span className="px-3 py-1 rounded-full bg-slate-500/20 text-slate-400 text-sm font-medium">
            报名截止
          </span>
        );
      case 'competition_running':
        return (
          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
            进行中
          </span>
        );
      case 'judging':
        return (
          <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium">
            评审中
          </span>
        );
      case 'results_announced':
        return (
          <span className="px-3 py-1 rounded-full bg-slate-500/20 text-slate-400 text-sm font-medium">
            已结束
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-slate-600/20 text-slate-400 text-sm font-medium">
            草稿
          </span>
        );
    }
  };

  const totalPrize = (hackathon.prizes || []).reduce((sum, p) => sum + p.amount, 0);

  return (
    <Link
      to={`/hackathons/${hackathon.id}`}
      className="group glass rounded-2xl overflow-hidden card-hover"
    >
      <div className="relative h-48 overflow-hidden">
        {hackathon.coverImage ? (
          <img
            src={hackathon.coverImage}
            alt={hackathon.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.classList.add('bg-gradient-to-br', 'from-blue-600/40', 'to-purple-600/40');
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600/40 to-purple-600/40 flex items-center justify-center">
            <Trophy className="w-16 h-16 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        <div className="absolute top-4 right-4">
          {getStatusBadge()}
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {hackathon.title}
        </h3>

        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
          {hackathon.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {(hackathon.categories || []).slice(0, 3).map((category) => (
            <span
              key={category}
              className="px-2 py-1 rounded-md bg-slate-700/50 text-slate-300 text-xs"
            >
              {category}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(hackathon.startDate || '')} - {formatDate(hackathon.endDate || '')}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{hackathon.currentParticipants}/{hackathon.maxParticipants}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">
              {hackathon.isVirtual
                ? (hackathon.location ? `线上 · ${hackathon.location}` : '线上')
                : hackathon.location}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">
              ¥{totalPrize.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
