'use client';

import { TrendingMatch } from './trending';
import { TrendingMatchCard } from './TrendingMatchCard';

interface TrendingMatchesProps {
  matches: TrendingMatch[];
  selectedMatchId: string | null;
  onSelectMatch: (match: TrendingMatch) => void;
  isLoading?: boolean;
}

/**
 * Horizontal scrollable section showing trending/hot matches
 */
export function TrendingMatches({ 
  matches, 
  selectedMatchId, 
  onSelectMatch,
  isLoading = false,
}: TrendingMatchesProps) {
  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔥</span>
          <h3 className="text-sm font-semibold text-white">Trending Matches</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i}
              className="flex-shrink-0 w-[200px] h-[120px] rounded-xl bg-primary-navy/40 border border-gray-700/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <h3 className="text-sm font-semibold text-white">Trending Matches</h3>
          <span className="text-xs text-gray-500">
            ({matches.length} hot picks)
          </span>
        </div>
        <span className="text-[10px] text-gray-500 hidden sm:block">
          Based on bookmaker coverage & league importance
        </span>
      </div>

      {/* Scrollable row */}
      <div className="relative">
        {/* Gradient fade on right edge */}
        <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-primary-navy to-transparent z-10 pointer-events-none" />
        
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {matches.map((match) => (
            <TrendingMatchCard
              key={match.matchId}
              match={match}
              isSelected={selectedMatchId === match.matchId}
              onSelect={onSelectMatch}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
