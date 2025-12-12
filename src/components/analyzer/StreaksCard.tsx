/**
 * Streaks Display Card
 * 
 * Shows notable winning/losing/scoring streaks.
 * These are highly shareable stats.
 * 
 * Examples:
 * - "🔥 5 wins in a row"
 * - "💀 Winless in 8 matches"
 * - "⚽ Scored in 12 consecutive games"
 */

'use client';

import { TeamStreak } from '@/types';

interface StreaksCardProps {
  homeTeam: string;
  awayTeam: string;
  homeStreaks: TeamStreak[];
  awayStreaks: TeamStreak[];
}

const streakConfig: Record<TeamStreak['type'], { 
  icon: string; 
  color: string; 
  bgColor: string;
  positiveLabel: string;
  negativeLabel: string;
}> = {
  win: { 
    icon: '🔥', 
    color: 'text-green-400', 
    bgColor: 'bg-green-500/15',
    positiveLabel: 'wins',
    negativeLabel: 'win streak',
  },
  loss: { 
    icon: '💀', 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/15',
    positiveLabel: 'losses',
    negativeLabel: 'losing streak',
  },
  draw: { 
    icon: '🤝', 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-500/15',
    positiveLabel: 'draws',
    negativeLabel: 'draw streak',
  },
  unbeaten: { 
    icon: '🛡️', 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/15',
    positiveLabel: 'unbeaten',
    negativeLabel: 'unbeaten run',
  },
  winless: { 
    icon: '😰', 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-500/15',
    positiveLabel: 'without a win',
    negativeLabel: 'winless streak',
  },
  scored: { 
    icon: '⚽', 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/15',
    positiveLabel: 'games scoring',
    negativeLabel: 'scoring streak',
  },
  cleanSheet: { 
    icon: '🧤', 
    color: 'text-indigo-400', 
    bgColor: 'bg-indigo-500/15',
    positiveLabel: 'clean sheets',
    negativeLabel: 'CS streak',
  },
  conceded: { 
    icon: '🥅', 
    color: 'text-pink-400', 
    bgColor: 'bg-pink-500/15',
    positiveLabel: 'games conceding',
    negativeLabel: 'conceding streak',
  },
  btts: { 
    icon: '⚔️', 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/15',
    positiveLabel: 'BTTS games',
    negativeLabel: 'BTTS streak',
  },
  over25: { 
    icon: '📊', 
    color: 'text-teal-400', 
    bgColor: 'bg-teal-500/15',
    positiveLabel: 'over 2.5 games',
    negativeLabel: 'O2.5 streak',
  },
};

export default function StreaksCard({
  homeTeam,
  awayTeam,
  homeStreaks,
  awayStreaks,
}: StreaksCardProps) {
  // Filter to significant streaks (3+ for most, 5+ for scoring/conceding)
  const filterSignificant = (streaks: TeamStreak[]) => 
    streaks.filter(s => {
      if (['scored', 'conceded', 'btts', 'over25'].includes(s.type)) {
        return s.count >= 4;
      }
      return s.count >= 3;
    }).sort((a, b) => b.count - a.count);

  const significantHome = filterSignificant(homeStreaks);
  const significantAway = filterSignificant(awayStreaks);

  if (significantHome.length === 0 && significantAway.length === 0) {
    return null; // Don't show if no notable streaks
  }

  return (
    <div className="bg-[#0F1114] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <span className="text-lg">📈</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Notable Streaks</h3>
            <p className="text-xs text-text-muted">Current form patterns</p>
          </div>
        </div>
      </div>

      {/* Streaks Grid */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
        {/* Home Team */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs">🏠</span>
            <span className="text-sm font-medium text-white">{homeTeam}</span>
          </div>
          <div className="space-y-2">
            {significantHome.length > 0 ? (
              significantHome.slice(0, 4).map((streak, i) => (
                <StreakBadge key={i} streak={streak} />
              ))
            ) : (
              <p className="text-xs text-text-muted">No notable streaks</p>
            )}
          </div>
        </div>

        {/* Away Team */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs">✈️</span>
            <span className="text-sm font-medium text-white">{awayTeam}</span>
          </div>
          <div className="space-y-2">
            {significantAway.length > 0 ? (
              significantAway.slice(0, 4).map((streak, i) => (
                <StreakBadge key={i} streak={streak} />
              ))
            ) : (
              <p className="text-xs text-text-muted">No notable streaks</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StreakBadge({ streak }: { streak: TeamStreak }) {
  const config = streakConfig[streak.type];
  const contextLabel = streak.context === 'all' ? '' : 
                       streak.context === 'home' ? ' (H)' : 
                       streak.context === 'away' ? ' (A)' : ' (H2H)';

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl ${config.bgColor} border border-white/5`}>
      <span className="text-lg">{config.icon}</span>
      <div className="flex-1">
        <p className={`text-sm font-bold ${config.color}`}>
          {streak.count} {config.positiveLabel}{contextLabel}
        </p>
        {streak.description && (
          <p className="text-[10px] text-text-muted mt-0.5">{streak.description}</p>
        )}
      </div>
      {streak.isActive && (
        <span className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] text-white/60 uppercase">
          Active
        </span>
      )}
    </div>
  );
}

/**
 * Compact inline streak display
 */
export function StreaksInline({ streaks, teamName }: { streaks: TeamStreak[]; teamName: string }) {
  const topStreak = streaks
    .filter(s => s.count >= 3)
    .sort((a, b) => b.count - a.count)[0];

  if (!topStreak) return null;

  const config = streakConfig[topStreak.type];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${config.bgColor} border border-white/10`}>
      <span>{config.icon}</span>
      <span className={`text-xs ${config.color}`}>
        {topStreak.count} {config.positiveLabel}
      </span>
    </span>
  );
}

/**
 * Single highlight streak for hero display
 */
export function StreakHighlight({ 
  streak, 
  teamName 
}: { 
  streak: TeamStreak; 
  teamName: string;
}) {
  const config = streakConfig[streak.type];

  return (
    <div className={`
      flex items-center gap-3 p-4 rounded-2xl 
      ${config.bgColor} border border-white/10
    `}>
      <span className="text-3xl">{config.icon}</span>
      <div>
        <p className={`text-lg font-bold ${config.color}`}>
          {streak.count} {config.positiveLabel}
        </p>
        <p className="text-sm text-text-secondary">{teamName}</p>
        {streak.description && (
          <p className="text-xs text-text-muted mt-1">{streak.description}</p>
        )}
      </div>
    </div>
  );
}
