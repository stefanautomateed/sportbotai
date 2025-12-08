'use client';

import { TrendingMatch } from './trending';

interface TrendingMatchCardProps {
  match: TrendingMatch;
  isSelected: boolean;
  onSelect: (match: TrendingMatch) => void;
}

/**
 * Compact card for displaying a trending/hot match
 */
export function TrendingMatchCard({ match, isSelected, onSelect }: TrendingMatchCardProps) {
  const matchDate = new Date(match.commenceTime);
  const isToday = new Date().toDateString() === matchDate.toDateString();
  const isTomorrow = new Date(Date.now() + 86400000).toDateString() === matchDate.toDateString();
  
  const timeStr = matchDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  
  const dateStr = isToday 
    ? `Today ${timeStr}`
    : isTomorrow 
      ? `Tomorrow ${timeStr}`
      : matchDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

  // Get best odds for display (use the match's primary odds)
  const getBestOdds = () => {
    if (!match.odds) return null;
    
    return { 
      home: match.odds.home, 
      away: match.odds.away 
    };
  };
  
  const odds = getBestOdds();

  return (
    <button
      onClick={() => onSelect(match)}
      className={`
        flex-shrink-0 w-[200px] p-3 rounded-xl border text-left transition-all duration-200
        ${isSelected 
          ? 'bg-accent-lime/10 border-accent-lime shadow-lg shadow-accent-lime/10' 
          : 'bg-primary-navy/40 border-gray-700/50 hover:border-accent-cyan/50 hover:bg-primary-navy/60'
        }
      `}
    >
      {/* Hot Badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-semibold uppercase tracking-wide">
          🔥 Hot
        </span>
        {match.hotFactors.derbyScore > 0 && (
          <span className="text-[10px] text-yellow-400">⚔️ Derby</span>
        )}
      </div>

      {/* League */}
      <p className="text-[10px] text-gray-500 truncate mb-1.5">
        {match.league || match.sport}
      </p>

      {/* Teams */}
      <div className="space-y-1 mb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white truncate flex-1 mr-2">
            {match.homeTeam}
          </span>
          {odds?.home && (
            <span className="text-[10px] text-accent-cyan font-mono">
              {odds.home.toFixed(2)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-300 truncate flex-1 mr-2">
            {match.awayTeam}
          </span>
          {odds?.away && (
            <span className="text-[10px] text-accent-cyan font-mono">
              {odds.away.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Time */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          {dateStr}
        </span>
        <span className="text-[10px] text-gray-500">
          {match.bookmakers?.length || 0} books
        </span>
      </div>
    </button>
  );
}
