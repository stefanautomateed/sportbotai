/**
 * Goals Timing Pattern Card
 * 
 * Visual display of when each team typically scores goals.
 * Shows distribution across 15-minute periods.
 * 
 * "Late goal specialists - 46% of goals after 60'"
 */

'use client';

import { GoalsTimingPattern } from '@/types';

interface GoalsTimingCardProps {
  homePattern: GoalsTimingPattern | null;
  awayPattern: GoalsTimingPattern | null;
  homeTeam: string;
  awayTeam: string;
}

const timeLabels = ['0-15\'', '16-30\'', '31-45\'', '46-60\'', '61-75\'', '76-90\''];
const timeKeys: (keyof GoalsTimingPattern)[] = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90'];

export default function GoalsTimingCard({
  homePattern,
  awayPattern,
  homeTeam,
  awayTeam,
}: GoalsTimingCardProps) {
  if (!homePattern && !awayPattern) {
    return null;
  }

  return (
    <div className="bg-[#0F1114] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
            <span className="text-lg">⏱️</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Goals by Time Period</h3>
            <p className="text-xs text-text-muted">When they typically score</p>
          </div>
        </div>
      </div>

      {/* Patterns */}
      <div className="p-4 space-y-6">
        {/* Home Team */}
        {homePattern && (
          <TeamTimingPattern 
            pattern={homePattern}
            teamName={homeTeam}
            color="primary"
          />
        )}

        {/* Away Team */}
        {awayPattern && (
          <TeamTimingPattern 
            pattern={awayPattern}
            teamName={awayTeam}
            color="accent"
          />
        )}
      </div>

      {/* Combined Insight */}
      {homePattern?.insight || awayPattern?.insight ? (
        <div className="px-4 pb-4">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <p className="text-xs text-text-secondary">
              {homePattern?.insight && <span className="block">🏠 {homeTeam}: {homePattern.insight}</span>}
              {awayPattern?.insight && <span className="block mt-1">✈️ {awayTeam}: {awayPattern.insight}</span>}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TeamTimingPattern({ 
  pattern, 
  teamName, 
  color 
}: { 
  pattern: GoalsTimingPattern; 
  teamName: string;
  color: 'primary' | 'accent';
}) {
  const maxValue = Math.max(
    pattern['0-15'], pattern['16-30'], pattern['31-45'],
    pattern['46-60'], pattern['61-75'], pattern['76-90']
  );

  const colorClasses = {
    primary: {
      bar: 'bg-primary',
      text: 'text-primary',
      bg: 'bg-primary/10',
    },
    accent: {
      bar: 'bg-accent',
      text: 'text-accent',
      bg: 'bg-accent/10',
    },
  };

  const colors = colorClasses[color];

  // Find the peak period
  const periods = timeKeys.map((key, i) => ({
    key,
    label: timeLabels[i],
    value: pattern[key] as number,
  }));
  
  const peakPeriod = periods.reduce((max, p) => p.value > max.value ? p : max, periods[0]);

  return (
    <div>
      {/* Team Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white">{teamName}</span>
        <span className="text-xs text-text-muted">
          {pattern.totalGoals} goals analyzed
        </span>
      </div>

      {/* Time Bars */}
      <div className="space-y-2">
        {periods.map(({ key, label, value }) => {
          const width = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const isPeak = value === peakPeriod.value && value > 0;
          
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-12 text-right">{label}</span>
              <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${colors.bar} ${isPeak ? 'ring-1 ring-white/30' : ''}`}
                  style={{ width: `${width}%` }}
                />
                {value > 0 && (
                  <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold ${value > 15 ? 'text-white' : 'text-text-muted'}`}>
                    {value}%
                  </span>
                )}
              </div>
              {isPeak && (
                <span className="text-xs">🔥</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick stat */}
      <div className="mt-3 flex items-center gap-4 text-xs">
        <span className={`${colors.text} font-medium`}>
          Peak: {peakPeriod.label} ({peakPeriod.value}%)
        </span>
        <span className="text-text-muted">
          2nd Half: {pattern['46-60'] + pattern['61-75'] + pattern['76-90']}%
        </span>
      </div>
    </div>
  );
}

/**
 * Compact version showing just the hottest periods
 */
export function GoalsTimingCompact({ 
  pattern, 
  teamName 
}: { 
  pattern: GoalsTimingPattern | null;
  teamName: string;
}) {
  if (!pattern) return null;

  const secondHalf = pattern['46-60'] + pattern['61-75'] + pattern['76-90'];
  const isLateScorer = pattern['76-90'] > 25;
  const isFirstHalfScorer = (pattern['0-15'] + pattern['16-30'] + pattern['31-45']) > 55;

  let label = '';
  let emoji = '⚽';
  
  if (isLateScorer) {
    label = 'Late goal threat';
    emoji = '🔥';
  } else if (isFirstHalfScorer) {
    label = 'Fast starter';
    emoji = '⚡';
  } else if (secondHalf > 55) {
    label = 'Second half specialist';
    emoji = '📈';
  }

  if (!label) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
      <span className="text-xs">{emoji}</span>
      <span className="text-xs text-green-400">{teamName}: {label}</span>
    </div>
  );
}
