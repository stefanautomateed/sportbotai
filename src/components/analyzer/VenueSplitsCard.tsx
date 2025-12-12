/**
 * Home/Away Splits Card
 * 
 * Shows how teams perform at home vs away.
 * Critical for understanding team dynamics.
 * 
 * "Arsenal at Home: W8 D1 L0 vs Away: W3 D2 L4"
 */

'use client';

import { VenueSplit } from '@/types';

interface VenueSplitsCardProps {
  homeTeam: string;
  awayTeam: string;
  homeSplit: VenueSplit | null;
  awaySplit: VenueSplit | null;
}

export default function VenueSplitsCard({
  homeTeam,
  awayTeam,
  homeSplit,
  awaySplit,
}: VenueSplitsCardProps) {
  if (!homeSplit && !awaySplit) {
    return null;
  }

  return (
    <div className="bg-[#0F1114] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
            <span className="text-lg">🏟️</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Home vs Away Form</h3>
            <p className="text-xs text-text-muted">Performance by venue</p>
          </div>
        </div>
      </div>

      {/* Splits */}
      <div className="p-4 space-y-6">
        {/* Home Team - Show their HOME form since they're playing at home */}
        {homeSplit && (
          <TeamVenueSplit 
            teamName={homeTeam}
            split={homeSplit}
            relevantVenue="home"
            label="Playing at HOME"
          />
        )}

        {/* Away Team - Show their AWAY form since they're playing away */}
        {awaySplit && (
          <TeamVenueSplit 
            teamName={awayTeam}
            split={awaySplit}
            relevantVenue="away"
            label="Playing AWAY"
          />
        )}
      </div>

      {/* Insights */}
      {(homeSplit?.insight || awaySplit?.insight) && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-white/5 rounded-xl space-y-1">
            {homeSplit?.insight && (
              <p className="text-xs text-text-secondary">🏠 {homeTeam}: {homeSplit.insight}</p>
            )}
            {awaySplit?.insight && (
              <p className="text-xs text-text-secondary">✈️ {awayTeam}: {awaySplit.insight}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamVenueSplit({ 
  teamName, 
  split, 
  relevantVenue,
  label,
}: { 
  teamName: string; 
  split: VenueSplit;
  relevantVenue: 'home' | 'away';
  label: string;
}) {
  const relevant = split[relevantVenue];
  const opposite = relevantVenue === 'home' ? split.away : split.home;
  
  const winRate = relevant.played > 0 
    ? ((relevant.wins / relevant.played) * 100).toFixed(0) 
    : '0';
  
  const oppositeWinRate = opposite.played > 0
    ? ((opposite.wins / opposite.played) * 100).toFixed(0)
    : '0';

  // Determine if there's a significant home/away difference
  const diff = parseFloat(winRate) - parseFloat(oppositeWinRate);
  const hasBigDifference = Math.abs(diff) > 20;

  return (
    <div className="space-y-3">
      {/* Team Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs">{relevantVenue === 'home' ? '🏠' : '✈️'}</span>
          <span className="text-sm font-medium text-white">{teamName}</span>
          <span className="text-xs text-text-muted">({label})</span>
        </div>
        <span className={`text-sm font-bold ${parseFloat(winRate) >= 50 ? 'text-green-400' : parseFloat(winRate) >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
          {winRate}% win rate
        </span>
      </div>

      {/* Record Comparison */}
      <div className="grid grid-cols-2 gap-3">
        {/* Relevant Venue Stats (highlighted) */}
        <div className={`p-3 rounded-xl border ${relevantVenue === 'home' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs">{relevantVenue === 'home' ? '🏠' : '✈️'}</span>
            <span className="text-xs text-text-muted uppercase">{relevantVenue === 'home' ? 'Home' : 'Away'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-400 font-bold">W{relevant.wins}</span>
            <span className="text-yellow-400 font-bold">D{relevant.draws}</span>
            <span className="text-red-400 font-bold">L{relevant.losses}</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
            <span>GF: {relevant.goalsFor}</span>
            <span>GA: {relevant.goalsAgainst}</span>
            {relevant.cleanSheets > 0 && <span>CS: {relevant.cleanSheets}</span>}
          </div>
        </div>

        {/* Opposite Venue Stats (faded) */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs opacity-50">{relevantVenue === 'home' ? '✈️' : '🏠'}</span>
            <span className="text-xs text-text-muted uppercase">{relevantVenue === 'home' ? 'Away' : 'Home'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-60">
            <span className="text-green-400 font-bold">W{opposite.wins}</span>
            <span className="text-yellow-400 font-bold">D{opposite.draws}</span>
            <span className="text-red-400 font-bold">L{opposite.losses}</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
            <span>GF: {opposite.goalsFor}</span>
            <span>GA: {opposite.goalsAgainst}</span>
          </div>
        </div>
      </div>

      {/* Venue difference indicator */}
      {hasBigDifference && (
        <div className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          ${diff > 0 
            ? 'bg-green-500/10 border border-green-500/20' 
            : 'bg-red-500/10 border border-red-500/20'}
        `}>
          <span>{diff > 0 ? '💪' : '📉'}</span>
          <span className={`text-xs ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {diff > 0 
              ? `${Math.abs(diff).toFixed(0)}% better ${relevantVenue === 'home' ? 'at home' : 'away'}`
              : `${Math.abs(diff).toFixed(0)}% worse ${relevantVenue === 'home' ? 'at home' : 'away'}`
            }
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact comparison for quick view
 */
export function VenueSplitCompact({
  teamName,
  split,
  venue,
}: {
  teamName: string;
  split: VenueSplit;
  venue: 'home' | 'away';
}) {
  const stats = split[venue];
  const winRate = stats.played > 0 ? ((stats.wins / stats.played) * 100).toFixed(0) : '0';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs">{venue === 'home' ? '🏠' : '✈️'}</span>
      <span className="text-xs text-text-muted">
        W{stats.wins} D{stats.draws} L{stats.losses}
      </span>
      <span className={`text-xs font-bold ${
        parseFloat(winRate) >= 50 ? 'text-green-400' : 
        parseFloat(winRate) >= 30 ? 'text-yellow-400' : 
        'text-red-400'
      }`}>
        ({winRate}%)
      </span>
    </div>
  );
}

/**
 * Single stat badge for inline display
 */
export function VenueStatBadge({
  record,
  venue,
}: {
  record: { wins: number; draws: number; losses: number; played: number };
  venue: 'home' | 'away';
}) {
  const winRate = record.played > 0 ? ((record.wins / record.played) * 100).toFixed(0) : '0';
  const isGood = parseFloat(winRate) >= 50;

  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs
      ${isGood ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}
    `}>
      <span>{venue === 'home' ? '🏠' : '✈️'}</span>
      <span className="font-medium">{winRate}%</span>
    </span>
  );
}
