/**
 * Key Absences Banner
 * 
 * Prominent display of important missing players.
 * This is one of the most impactful pieces of pre-match info.
 * 
 * Shows: Name, position, importance level, and reason (injury/suspension)
 */

'use client';

import { PlayerImportance } from '@/types';

interface AbsentPlayer {
  name: string;
  position: string;
  importance: PlayerImportance;
  reason?: string;
}

interface KeyAbsencesBannerProps {
  homeTeam: string;
  awayTeam: string;
  homeAbsences: AbsentPlayer[];
  awayAbsences: AbsentPlayer[];
  impactStatement?: string;
}

const importanceConfig: Record<PlayerImportance, { label: string; color: string; icon: string }> = {
  KEY: { label: 'Key Player', color: 'text-red-400 bg-red-500/20 border-red-500/30', icon: '⭐' },
  STARTER: { label: 'Starter', color: 'text-orange-400 bg-orange-500/20 border-orange-500/30', icon: '🔸' },
  ROTATION: { label: 'Rotation', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', icon: '🔹' },
  BACKUP: { label: 'Backup', color: 'text-text-muted bg-white/5 border-white/10', icon: '•' },
};

export default function KeyAbsencesBanner({
  homeTeam,
  awayTeam,
  homeAbsences,
  awayAbsences,
  impactStatement,
}: KeyAbsencesBannerProps) {
  // Filter to show only KEY and STARTER players
  const significantHomeAbsences = homeAbsences.filter(p => p.importance === 'KEY' || p.importance === 'STARTER');
  const significantAwayAbsences = awayAbsences.filter(p => p.importance === 'KEY' || p.importance === 'STARTER');

  // If no significant absences, show nothing or minimal
  if (significantHomeAbsences.length === 0 && significantAwayAbsences.length === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="text-sm font-medium text-green-400">Full Squads Available</p>
            <p className="text-xs text-text-muted">No major absences reported for either team</p>
          </div>
        </div>
      </div>
    );
  }

  const hasKeyAbsences = homeAbsences.some(p => p.importance === 'KEY') || 
                         awayAbsences.some(p => p.importance === 'KEY');

  return (
    <div className={`
      rounded-2xl border overflow-hidden
      ${hasKeyAbsences 
        ? 'bg-red-500/5 border-red-500/20' 
        : 'bg-orange-500/5 border-orange-500/20'}
    `}>
      {/* Header */}
      <div className={`
        px-4 py-3 border-b 
        ${hasKeyAbsences ? 'border-red-500/20 bg-red-500/10' : 'border-orange-500/20 bg-orange-500/10'}
      `}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{hasKeyAbsences ? '🚨' : '⚠️'}</span>
          <h3 className={`text-sm font-bold ${hasKeyAbsences ? 'text-red-400' : 'text-orange-400'}`}>
            Key Absences
          </h3>
          {impactStatement && (
            <span className="ml-auto text-xs text-text-muted">{impactStatement}</span>
          )}
        </div>
      </div>

      {/* Teams Side by Side */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
        {/* Home Team */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs">🏠</span>
            <span className="text-sm font-medium text-white">{homeTeam}</span>
            {significantHomeAbsences.length > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-white/10 rounded text-[10px] text-text-muted">
                {significantHomeAbsences.length} out
              </span>
            )}
          </div>
          <div className="space-y-2">
            {significantHomeAbsences.length > 0 ? (
              significantHomeAbsences.map((player, i) => (
                <AbsentPlayerItem key={i} player={player} />
              ))
            ) : (
              <p className="text-xs text-green-400">No key players missing</p>
            )}
          </div>
        </div>

        {/* Away Team */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs">✈️</span>
            <span className="text-sm font-medium text-white">{awayTeam}</span>
            {significantAwayAbsences.length > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-white/10 rounded text-[10px] text-text-muted">
                {significantAwayAbsences.length} out
              </span>
            )}
          </div>
          <div className="space-y-2">
            {significantAwayAbsences.length > 0 ? (
              significantAwayAbsences.map((player, i) => (
                <AbsentPlayerItem key={i} player={player} />
              ))
            ) : (
              <p className="text-xs text-green-400">No key players missing</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AbsentPlayerItem({ player }: { player: AbsentPlayer }) {
  const config = importanceConfig[player.importance];

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border ${config.color}`}>
      <span className="text-sm">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{player.name}</p>
        <p className="text-[10px] text-text-muted">{player.position}</p>
      </div>
      {player.reason && (
        <span className="text-[10px] text-text-muted bg-black/20 px-1.5 py-0.5 rounded">
          {player.reason}
        </span>
      )}
    </div>
  );
}

/**
 * Compact inline version for headers/quick view
 */
export function AbsencesBadge({ 
  homeAbsences, 
  awayAbsences 
}: { 
  homeAbsences: AbsentPlayer[];
  awayAbsences: AbsentPlayer[];
}) {
  const keyHomeOut = homeAbsences.filter(p => p.importance === 'KEY').length;
  const keyAwayOut = awayAbsences.filter(p => p.importance === 'KEY').length;
  const totalKey = keyHomeOut + keyAwayOut;

  if (totalKey === 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-xs text-red-400">
      <span>🚨</span>
      <span>{totalKey} key player{totalKey > 1 ? 's' : ''} out</span>
    </span>
  );
}

/**
 * Single-line summary for tight spaces
 */
export function AbsencesSummary({
  homeTeam,
  awayTeam,
  homeAbsences,
  awayAbsences,
}: KeyAbsencesBannerProps) {
  const keyHome = homeAbsences.filter(p => p.importance === 'KEY');
  const keyAway = awayAbsences.filter(p => p.importance === 'KEY');

  if (keyHome.length === 0 && keyAway.length === 0) {
    return <span className="text-green-400 text-xs">✓ No key absences</span>;
  }

  const parts: string[] = [];
  if (keyHome.length > 0) {
    parts.push(`${homeTeam}: ${keyHome.map(p => p.name).join(', ')}`);
  }
  if (keyAway.length > 0) {
    parts.push(`${awayTeam}: ${keyAway.map(p => p.name).join(', ')}`);
  }

  return (
    <span className="text-red-400 text-xs">
      ⚠️ Out: {parts.join(' | ')}
    </span>
  );
}
