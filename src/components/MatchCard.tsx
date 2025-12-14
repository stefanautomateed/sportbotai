/**
 * Match Card Component
 * 
 * A clickable card that links to the match preview page.
 * Used on homepage and match discovery pages.
 */

'use client';

import Link from 'next/link';
import TeamLogo from '@/components/ui/TeamLogo';
import LeagueLogo from '@/components/ui/LeagueLogo';
import MatchCountdown from '@/components/ui/MatchCountdown';

interface MatchCardProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sportKey: string;
  commenceTime: string;
  hotScore?: number;
  tags?: string[];
}

export default function MatchCard({
  matchId,
  homeTeam,
  awayTeam,
  league,
  sportKey,
  commenceTime,
  hotScore = 0,
  tags = [],
}: MatchCardProps) {
  // Generate match preview URL
  // Encode match info into URL-safe format
  const matchData = {
    homeTeam,
    awayTeam,
    league,
    sport: sportKey,
    kickoff: commenceTime,
  };
  const encodedMatchId = Buffer.from(JSON.stringify(matchData)).toString('base64');

  // Format match date
  const formatMatchDate = (dateString: string) => {
    const matchDate = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (matchDate.toDateString() === today.toDateString()) {
      return matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    if (matchDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Link
      href={`/match/${encodedMatchId}`}
      className="group relative bg-bg-card rounded-xl border border-divider p-3 sm:p-4 hover:border-primary/30 hover:bg-bg-elevated transition-all duration-300 ease-out block hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg touch-manipulation"
      data-card
    >
      {/* Hot Score Badge */}
      {hotScore >= 8 && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-[10px] font-bold text-white shadow-lg">
          HOT
        </div>
      )}

      {/* League & Time */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LeagueLogo leagueName={league || sportKey} sport={sportKey} size="sm" />
          <span className="text-xs text-gray-400 truncate max-w-[120px]">{league}</span>
        </div>
        <MatchCountdown commenceTime={commenceTime} size="sm" />
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between">
        {/* Home Team */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="transition-transform duration-300 group-hover:scale-110">
            <TeamLogo teamName={homeTeam} sport={sportKey} league={league} size="md" />
          </div>
          <span className="text-sm font-semibold text-white truncate">{homeTeam}</span>
        </div>

        <span className="text-gray-600 text-sm font-medium px-2 group-hover:text-gray-400 transition-colors">vs</span>

        {/* Away Team */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm font-semibold text-white truncate text-right">{awayTeam}</span>
          <div className="transition-transform duration-300 group-hover:scale-110">
            <TeamLogo teamName={awayTeam} sport={sportKey} league={league} size="md" />
          </div>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {tags.slice(0, 2).map((tag) => (
            <span 
              key={tag}
              className="text-[10px] px-2 py-0.5 bg-white/5 text-gray-400 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Match time + Analyze CTA */}
      <div className="mt-3 pt-3 border-t border-divider flex items-center justify-between">
        <span className="text-xs text-text-muted">{formatMatchDate(commenceTime)}</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-accent/15 text-accent border border-accent/30 rounded-full group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all">
          <span className="w-1.5 h-1.5 bg-accent rounded-full group-hover:bg-white animate-pulse"></span>
          Analyze
        </span>
      </div>
    </Link>
  );
}
