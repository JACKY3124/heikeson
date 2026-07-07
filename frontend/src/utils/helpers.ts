import type { Hackathon, CompetitionStatus } from '@/types';

export function getCompetitionStatus(hackathon: Hackathon): CompetitionStatus {
  const now = new Date().getTime();
  
  const regOpenTime = new Date(hackathon.registrationOpenTime || hackathon.startDate || '').getTime();
  const regDeadline = new Date(hackathon.registrationDeadline || hackathon.startDate || '').getTime();
  const submissionDeadline = new Date(hackathon.submissionDeadline || hackathon.startDate || '').getTime();
  const judgingDeadline = new Date(hackathon.judgingDeadline || hackathon.endDate || '').getTime();
  const announcementTime = new Date(hackathon.announcementTime || hackathon.endDate || '').getTime();
  const startTime = new Date(hackathon.startDate || hackathon.startTime || '').getTime();

  if (isNaN(regOpenTime)) return 'draft';
  
  if (now < regOpenTime) return 'registration_closed';
  if (now >= regOpenTime && now <= regDeadline) return 'registration_open';
  if (now > regDeadline && now < startTime) return 'registration_closed';
  if (now >= startTime && now <= submissionDeadline) return 'competition_running';
  if (now > submissionDeadline && now <= judgingDeadline) return 'judging';
  if (now > judgingDeadline && now <= announcementTime) return 'judging';
  return 'results_announced';
}

export function canRegister(hackathon: Hackathon): boolean {
  const status = getCompetitionStatus(hackathon);
  return status === 'registration_open';
}

export function canSubmit(hackathon: Hackathon): boolean {
  const status = getCompetitionStatus(hackathon);
  return status === 'competition_running';
}

export function canScore(hackathon: Hackathon): boolean {
  const status = getCompetitionStatus(hackathon);
  return status === 'judging';
}

export function canViewLeaderboard(hackathon: Hackathon): boolean {
  const status = getCompetitionStatus(hackathon);
  return status === 'judging' || status === 'results_announced';
}

export function formatDate(date: string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date || '待定';
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date || '待定';
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function validateDateOrder(dates: { [key: string]: string }, order: string[]): string | null {
  for (let i = 0; i < order.length - 1; i++) {
    const current = dates[order[i]];
    const next = dates[order[i + 1]];
    if (!current || !next) continue;
    
    const currentTime = new Date(current).getTime();
    const nextTime = new Date(next).getTime();
    
    if (currentTime > nextTime) {
      const labels: { [key: string]: string } = {
        registrationOpenTime: '报名开始时间',
        registrationDeadline: '报名截止时间',
        startDate: '比赛开始时间',
        submissionDeadline: '作品提交截止时间',
        judgingDeadline: '评审截止时间',
        announcementTime: '榜单公示时间',
        endDate: '比赛结束时间',
      };
      return `${labels[order[i]]} 不能晚于 ${labels[order[i + 1]]}`;
    }
  }
  return null;
}