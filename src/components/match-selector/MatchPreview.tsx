/**
 * Match Preview Component
 * 
 * Shows detailed preview of the selected match.
 * Displays odds, implied probabilities, and action button.
 */

'use client';

import { MatchData } from '@/types';
import { SportConfig } from '@/lib/config/sportsConfig';
import { formatMatchDate } from './utils';

interface MatchPreviewProps {
  match: MatchData;
  sportConfig: SportConfig | null;
  onAnalyze: () => void;
  loading?: boolean;
  loadingOdds?: boolean;
}

export default function MatchPreview({
  match,
  sportConfig,
  onAnalyze,
  loading = false,
  loadingOdds = false,
}: MatchPreviewProps) {
  const hasDraw = sportConfig?.hasDraw ?? true;
  const hasOdds = match.odds && match.odds.home > 0;

  return (
    <div className="bg-primary-900 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{sportConfig?.icon || '🏆'}</span>
            <span className="text-gray-400 text-sm">{match.league}</span>
          </div>
          <span className="text-gray-500 text-sm">{formatMatchDate(match.commenceTime)}</span>
        </div>
      </div>

      {/* Teams */}
      <div className="px-6 py-8">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center flex-1">
            <p className="text-xl md:text-2xl font-bold text-white">{match.homeTeam}</p>
            <p className="text-xs text-gray-500 mt-1">
              {sportConfig?.participantTerm === 'player' ? '' : 'Home'}
            </p>
          </div>
          <div className="px-4">
            <span className="text-gray-600 text-xl font-light">vs</span>
          </div>
          <div className="text-center flex-1">
            <p className="text-xl md:text-2xl font-bold text-white">{match.awayTeam}</p>
            <p className="text-xs text-gray-500 mt-1">
              {sportConfig?.participantTerm === 'player' ? '' : 'Away'}
            </p>
          </div>
        </div>
      </div>

      {/* Odds */}
      <div className="px-6 pb-6">
        {loadingOdds ? (
          <div className="text-center py-6">
            <div className="animate-spin w-6 h-6 border-2 border-accent-cyan border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Loading odds...</p>
          </div>
        ) : hasOdds ? (
          <>
            <div className={`grid gap-3 ${hasDraw ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {/* Home */}
              <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                <p className="text-xs text-gray-500 mb-2">
                  {sportConfig?.participantTerm === 'player' ? 'Winner 1' : '1 (Home)'}
                </p>
                <p className="text-2xl font-bold text-accent-green">{match.odds.home.toFixed(2)}</p>
                {match.impliedProbabilities?.home && (
                  <p className="text-xs text-gray-500 mt-1">
                    {match.impliedProbabilities.home.toFixed(1)}%
                  </p>
                )}
              </div>

              {/* Draw */}
              {hasDraw && match.odds.draw && (
                <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                  <p className="text-xs text-gray-500 mb-2">X (Draw)</p>
                  <p className="text-2xl font-bold text-gray-300">{match.odds.draw.toFixed(2)}</p>
                  {match.impliedProbabilities?.draw && (
                    <p className="text-xs text-gray-500 mt-1">
                      {match.impliedProbabilities.draw.toFixed(1)}%
                    </p>
                  )}
                </div>
              )}

              {/* Away */}
              <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                <p className="text-xs text-gray-500 mb-2">
                  {sportConfig?.participantTerm === 'player' ? 'Winner 2' : '2 (Away)'}
                </p>
                <p className="text-2xl font-bold text-accent-cyan">{match.odds.away.toFixed(2)}</p>
                {match.impliedProbabilities?.away && (
                  <p className="text-xs text-gray-500 mt-1">
                    {match.impliedProbabilities.away.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>

            {/* Over/Under if available */}
            {match.odds.over && match.odds.under && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500 text-center mb-3">
                  Total {sportConfig?.scoringUnit || 'points'} O/U {match.odds.overUnderLine}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Over</p>
                    <p className="text-lg font-bold text-accent-lime">{match.odds.over.toFixed(2)}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Under</p>
                    <p className="text-lg font-bold text-accent-cyan">{match.odds.under.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-gray-500 text-sm">
            Odds not available for this match
          </div>
        )}
      </div>

      {/* Analyze Button */}
      <div className="px-6 pb-6">
        <button
          onClick={onAnalyze}
          disabled={loading || !hasOdds}
          className={`
            w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200
            ${loading || !hasOdds
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-accent-lime text-primary-900 hover:bg-accent-lime/90 shadow-lg shadow-accent-lime/20'
            }
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </span>
          ) : hasOdds ? (
            `Analyze ${sportConfig?.matchTerm || 'Match'}`
          ) : (
            'Odds required for analysis'
          )}
        </button>
      </div>
    </div>
  );
}
