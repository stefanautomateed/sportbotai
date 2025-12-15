/**
 * Premium Match Header - Minimal, Clean Design
 * 
 * Shows teams, time, and league with premium aesthetics.
 * Works identically for all sports.
 */

'use client';

import TeamLogo from '@/components/ui/TeamLogo';
import LeagueLogo from '@/components/ui/LeagueLogo';

interface PremiumMatchHeaderProps {
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  kickoff: string;
  venue?: string;
}

export default function PremiumMatchHeader({
  homeTeam,
  awayTeam,
  league,
  sport,
  kickoff,
  venue,
}: PremiumMatchHeaderProps) {
  const kickoffDate = new Date(kickoff);
  const formattedDate = kickoffDate.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const formattedTime = kickoffDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Check if match is live or upcoming
  const now = new Date();
  const isUpcoming = kickoffDate > now;
  const timeDiff = kickoffDate.getTime() - now.getTime();
  const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60));
  const daysUntil = Math.floor(hoursUntil / 24);

  let timeLabel: string;
  if (!isUpcoming) {
    timeLabel = 'In Progress';
  } else if (daysUntil > 0) {
    timeLabel = `${daysUntil}d ${hoursUntil % 24}h`;
  } else if (hoursUntil > 0) {
    timeLabel = `${hoursUntil}h`;
  } else {
    const minutesUntil = Math.floor(timeDiff / (1000 * 60));
    timeLabel = `${minutesUntil}m`;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0b] border border-white/[0.06]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.015]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, white 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }} />
      </div>

      <div className="relative p-6 sm:p-8">
        {/* League and Time Row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <LeagueLogo leagueName={league} sport={sport} size="sm" className="opacity-70" />
            <span className="text-sm font-medium text-zinc-400">{league}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">{formattedDate}</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-400">{formattedTime}</span>
            {isUpcoming && (
              <>
                <span className="text-zinc-600">·</span>
                <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 text-xs">
                  {timeLabel}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-center gap-6 sm:gap-12">
          {/* Home Team */}
          <div className="flex flex-col items-center text-center flex-1 max-w-[140px] sm:max-w-[180px]">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 relative">
              <TeamLogo teamName={homeTeam} sport={sport} league={league} size="xl" className="object-contain" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-white leading-tight">
              {homeTeam}
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mt-1">Home</span>
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center">
              <span className="text-lg sm:text-xl font-bold text-zinc-500">VS</span>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center text-center flex-1 max-w-[140px] sm:max-w-[180px]">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 relative">
              <TeamLogo teamName={awayTeam} sport={sport} league={league} size="xl" className="object-contain" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-white leading-tight">
              {awayTeam}
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mt-1">Away</span>
          </div>
        </div>

        {/* Venue (if available) */}
        {venue && (
          <div className="mt-6 pt-4 border-t border-white/[0.04] text-center">
            <span className="text-xs text-zinc-500">📍 {venue}</span>
          </div>
        )}
      </div>
    </div>
  );
}
