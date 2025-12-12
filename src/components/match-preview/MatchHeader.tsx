/**
 * Match Header Component
 * 
 * Displays the match title, teams, league, and kickoff time.
 * Clean, bold design focused on the matchup.
 */

'use client';

import { format, parseISO, isToday, isTomorrow } from 'date-fns';

interface MatchHeaderProps {
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoff: string;
  venue?: string;
}

export default function MatchHeader({
  homeTeam,
  awayTeam,
  league,
  kickoff,
  venue,
}: MatchHeaderProps) {
  // Format the kickoff time
  const kickoffDate = parseISO(kickoff);
  const dayLabel = isToday(kickoffDate) 
    ? 'Today' 
    : isTomorrow(kickoffDate) 
      ? 'Tomorrow' 
      : format(kickoffDate, 'EEEE, MMM d');
  const timeLabel = format(kickoffDate, 'HH:mm');

  return (
    <div className="text-center">
      {/* League badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 mb-6">
        <span className="text-sm text-text-secondary">{league}</span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-center gap-4 sm:gap-8">
        {/* Home Team */}
        <div className="flex-1 text-right">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center mx-auto sm:ml-auto sm:mr-0 mb-3 border border-white/10">
            <span className="text-2xl sm:text-3xl font-bold text-white">
              {homeTeam.substring(0, 3).toUpperCase()}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">{homeTeam}</h2>
          <span className="text-xs text-text-muted">Home</span>
        </div>

        {/* VS divider */}
        <div className="flex flex-col items-center">
          <div className="text-2xl sm:text-3xl font-bold text-text-muted">vs</div>
        </div>

        {/* Away Team */}
        <div className="flex-1 text-left">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center mx-auto sm:mr-auto sm:ml-0 mb-3 border border-white/10">
            <span className="text-2xl sm:text-3xl font-bold text-white">
              {awayTeam.substring(0, 3).toUpperCase()}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">{awayTeam}</h2>
          <span className="text-xs text-text-muted">Away</span>
        </div>
      </div>

      {/* Kickoff info */}
      <div className="mt-6 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{dayLabel} • {timeLabel}</span>
        </div>
        {venue && (
          <p className="text-sm text-text-muted">📍 {venue}</p>
        )}
      </div>
    </div>
  );
}
