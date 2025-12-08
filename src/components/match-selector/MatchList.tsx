/**
 * Match List Component
 * 
 * Renders a list of matches in a compact, clean format.
 * Each match shows teams, date/time, and an action button.
 */

'use client';

import { MatchData } from '@/types';
import { formatMatchDate, formatShortDate, formatTime } from './utils';

interface MatchListProps {
  matches: MatchData[];
  selectedMatchId?: string;
  onMatchSelect: (match: MatchData) => void;
  loading?: boolean;
  compact?: boolean;
}

export default function MatchList({
  matches,
  selectedMatchId,
  onMatchSelect,
  loading = false,
  compact = false,
}: MatchListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-16" />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No matches found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {matches.map((match) => {
        const isSelected = match.matchId === selectedMatchId;
        
        return (
          <button
            key={match.matchId}
            onClick={() => onMatchSelect(match)}
            className={`
              w-full text-left p-3 rounded-xl transition-all duration-200
              ${isSelected
                ? 'bg-primary-900 text-white shadow-lg'
                : 'bg-white border border-gray-100 hover:border-accent-cyan hover:shadow-sm'
              }
            `}
          >
            <div className="flex items-center justify-between gap-3">
              {/* Match Info */}
              <div className="flex-1 min-w-0">
                {/* Teams */}
                <div className={`font-medium ${isSelected ? 'text-white' : 'text-gray-900'} ${compact ? 'text-sm' : ''}`}>
                  <span className="truncate">{match.homeTeam}</span>
                  <span className={`mx-2 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>vs</span>
                  <span className="truncate">{match.awayTeam}</span>
                </div>
                
                {/* Date/Time */}
                <div className={`text-xs mt-1 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                  {formatMatchDate(match.commenceTime)}
                </div>
              </div>

              {/* Odds preview (if available) */}
              {match.odds && match.odds.home > 0 && !compact && (
                <div className={`flex gap-2 text-xs ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                  <span className={`px-2 py-1 rounded ${isSelected ? 'bg-white/10' : 'bg-gray-100'}`}>
                    {match.odds.home.toFixed(2)}
                  </span>
                  {match.odds.draw && (
                    <span className={`px-2 py-1 rounded ${isSelected ? 'bg-white/10' : 'bg-gray-100'}`}>
                      {match.odds.draw.toFixed(2)}
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded ${isSelected ? 'bg-white/10' : 'bg-gray-100'}`}>
                    {match.odds.away.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Select indicator */}
              <div className={`flex-shrink-0 ${isSelected ? 'text-accent-lime' : 'text-gray-400'}`}>
                {isSelected ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
