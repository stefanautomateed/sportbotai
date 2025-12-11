/**
 * Quick Stats Card Component
 * 
 * Sport-adaptive statistics display showing key metrics at a glance.
 * Automatically adapts content based on sport type:
 * - Soccer: Goals, Clean Sheets, H2H record
 * - Basketball: PPG, Form streak, H2H
 * - NFL: Points, Win rate, H2H
 * - MMA: Wins, Finishes, Record
 * 
 * Shows real data when available, gracefully degrades when not.
 * Enhanced with visual stat comparison bars and form timeline.
 */

'use client';

import { AnalyzeResponse, FormMatch, TeamStats } from '@/types';
import StatComparisonBar from './StatComparisonBar';

interface QuickStatsCardProps {
  result: AnalyzeResponse;
}

// Sport-specific stat configurations
const SPORT_STATS_CONFIG: Record<string, {
  primaryStats: { key: string; label: string; icon: string }[];
  formLabel: string;
  scoringUnit: string;
}> = {
  soccer: {
    primaryStats: [
      { key: 'goalsScored', label: 'Goals', icon: '⚽' },
      { key: 'goalsConceded', label: 'Conceded', icon: '🥅' },
      { key: 'cleanSheets', label: 'Clean Sheets', icon: '🧤' },
    ],
    formLabel: 'Recent Form',
    scoringUnit: 'goals',
  },
  basketball: {
    primaryStats: [
      { key: 'avgGoalsScored', label: 'Win %', icon: '🏀' },
      { key: 'goalsScored', label: 'Wins', icon: '✓' },
      { key: 'goalsConceded', label: 'Losses', icon: '✗' },
    ],
    formLabel: 'Last 5 Games',
    scoringUnit: 'points',
  },
  nba: {
    primaryStats: [
      { key: 'avgGoalsScored', label: 'Win %', icon: '🏀' },
      { key: 'goalsScored', label: 'Wins', icon: '✓' },
      { key: 'goalsConceded', label: 'Losses', icon: '✗' },
    ],
    formLabel: 'Last 5 Games',
    scoringUnit: 'points',
  },
  nfl: {
    primaryStats: [
      { key: 'goalsScored', label: 'Points', icon: '🏈' },
      { key: 'goalsConceded', label: 'Allowed', icon: '🛡️' },
      { key: 'avgGoalsScored', label: 'Avg PPG', icon: '📊' },
    ],
    formLabel: 'Last 5 Games',
    scoringUnit: 'points',
  },
  hockey: {
    primaryStats: [
      { key: 'goalsScored', label: 'Goals', icon: '🏒' },
      { key: 'goalsConceded', label: 'Allowed', icon: '🥅' },
      { key: 'cleanSheets', label: 'Shutouts', icon: '🧤' },
    ],
    formLabel: 'Last 5 Games',
    scoringUnit: 'goals',
  },
  mma: {
    primaryStats: [
      { key: 'goalsScored', label: 'Wins', icon: '🏆' },
      { key: 'goalsConceded', label: 'Losses', icon: '❌' },
      { key: 'cleanSheets', label: 'Finishes', icon: '💥' },
    ],
    formLabel: 'Fight History',
    scoringUnit: 'fights',
  },
  default: {
    primaryStats: [
      { key: 'goalsScored', label: 'Scored', icon: '✓' },
      { key: 'goalsConceded', label: 'Conceded', icon: '✗' },
    ],
    formLabel: 'Recent Form',
    scoringUnit: 'points',
  },
};

// Get sport config with fallback
function getSportStatsConfig(sport: string) {
  const normalized = sport.toLowerCase().replace(/[^a-z]/g, '');
  
  if (normalized.includes('soccer') || (normalized.includes('football') && !normalized.includes('american'))) {
    return SPORT_STATS_CONFIG.soccer;
  }
  if (normalized.includes('nba')) {
    return SPORT_STATS_CONFIG.nba;
  }
  if (normalized.includes('basketball')) {
    return SPORT_STATS_CONFIG.basketball;
  }
  if (normalized.includes('nfl') || normalized.includes('american')) {
    return SPORT_STATS_CONFIG.nfl;
  }
  if (normalized.includes('hockey') || normalized.includes('nhl')) {
    return SPORT_STATS_CONFIG.hockey;
  }
  if (normalized.includes('mma') || normalized.includes('ufc')) {
    return SPORT_STATS_CONFIG.mma;
  }
  
  return SPORT_STATS_CONFIG.default;
}

// Calculate form streak (e.g., "W3" for 3 wins in a row)
function getFormStreak(form: FormMatch[]): { streak: string; color: string } {
  if (!form || form.length === 0) return { streak: '-', color: 'text-text-muted' };
  
  const firstResult = form[0].result;
  let count = 0;
  
  for (const match of form) {
    if (match.result === firstResult) count++;
    else break;
  }
  
  const streakMap: Record<string, { prefix: string; color: string }> = {
    'W': { prefix: 'W', color: 'text-success' },
    'D': { prefix: 'D', color: 'text-warning' },
    'L': { prefix: 'L', color: 'text-danger' },
  };
  
  const { prefix, color } = streakMap[firstResult] || { prefix: '?', color: 'text-text-muted' };
  return { streak: `${prefix}${count}`, color };
}

// Render form badges (W/D/L pills)
function FormBadges({ form, limit = 5 }: { form?: FormMatch[]; limit?: number }) {
  if (!form || form.length === 0) {
    return <span className="text-text-muted text-xs">No data</span>;
  }
  
  const colorMap: Record<string, string> = {
    'W': 'bg-success/20 text-success border-success/30',
    'D': 'bg-warning/20 text-warning border-warning/30',
    'L': 'bg-danger/20 text-danger border-danger/30',
  };
  
  return (
    <div className="flex gap-1">
      {form.slice(0, limit).map((match, i) => (
        <span
          key={i}
          className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded text-[10px] sm:text-xs font-bold border ${colorMap[match.result] || 'bg-bg-tertiary text-text-muted'}`}
          title={match.opponent ? `vs ${match.opponent}: ${match.score || match.result}` : undefined}
        >
          {match.result}
        </span>
      ))}
    </div>
  );
}

// Get stat value from stats object
function getStatValue(stats: TeamStats | undefined, key: string): string {
  if (!stats) return '0';
  
  const value = (stats as any)[key];
  if (value === undefined || value === null) return '0';
  
  // Format percentages (values typically 0-1 for win rates)
  if (key === 'winPercentage' || (key === 'avgGoalsScored' && value <= 1)) {
    if (value <= 1) {
      return String(Math.round(value * 100));
    }
  }
  
  // Format averages/decimals
  if (key.includes('avg') && value > 1) {
    return typeof value === 'number' ? value.toFixed(1) : value;
  }
  
  // Integer values
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  
  return String(value);
}

export default function QuickStatsCard({ result }: QuickStatsCardProps) {
  const { matchInfo, momentumAndForm } = result;
  const config = getSportStatsConfig(matchInfo.sport);
  
  const hasRealData = momentumAndForm.formDataSource === 'API_FOOTBALL' || 
                      momentumAndForm.formDataSource === 'API_SPORTS';
  
  const homeStreak = getFormStreak(momentumAndForm.homeForm || []);
  const awayStreak = getFormStreak(momentumAndForm.awayForm || []);
  
  // H2H summary
  const h2h = momentumAndForm.h2hSummary;
  const hasH2H = h2h && h2h.totalMatches > 0;
  
  // Generate comparison stats for visual bars
  const comparisonStats = config.primaryStats.slice(0, 3).map((stat) => ({
    label: stat.label,
    home: parseFloat(getStatValue(momentumAndForm.homeStats, stat.key)) || 0,
    away: parseFloat(getStatValue(momentumAndForm.awayStats, stat.key)) || 0,
  })).filter(s => s.home > 0 || s.away > 0);

  return (
    <div className="bg-bg-card rounded-card border border-divider overflow-hidden">
      {/* Header with Data Source Badge */}
      <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-divider bg-bg-hover/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-sm">📊</span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-text-primary">Quick Stats</h3>
              <p className="text-[10px] sm:text-xs text-text-muted">
                {config.formLabel}
              </p>
            </div>
          </div>
          {/* Data Source Badge */}
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-chip text-[10px] font-medium ${
            hasRealData 
              ? 'bg-success/10 border-success/20 text-success' 
              : 'bg-warning/10 border-warning/20 text-warning'
          } border`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hasRealData ? 'bg-success animate-pulse' : 'bg-warning'}`}></span>
            {hasRealData ? 'Live' : 'Estimated'}
          </span>
        </div>
      </div>

      {/* Stats Content */}
      <div className="p-4 sm:p-5">
        {/* Visual Stat Comparison Bars */}
        {comparisonStats.length > 0 ? (
          <div className="space-y-4 mb-5">
            {/* Team Headers */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-success truncate max-w-[35%]">
                {matchInfo.homeTeam.split(' ').pop()}
              </span>
              <span className="text-[10px] text-text-muted">vs</span>
              <span className="text-xs font-semibold text-info truncate max-w-[35%] text-right">
                {matchInfo.awayTeam.split(' ').pop()}
              </span>
            </div>
            
            {/* Comparison Bars */}
            {comparisonStats.map((stat) => (
              <StatComparisonBar
                key={stat.label}
                label={stat.label}
                homeValue={stat.home}
                awayValue={stat.away}
                compact
              />
            ))}
          </div>
        ) : (
          /* Fallback message when no stats */
          <div className="text-center py-4 text-text-muted text-sm">
            No detailed statistics available
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-divider my-4"></div>

        {/* Form Section */}
        <div className="grid grid-cols-2 gap-4">
          {/* Home Form */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs text-text-muted">{config.formLabel}</span>
              <span className={`text-xs sm:text-sm font-bold ${homeStreak.color}`}>{homeStreak.streak}</span>
            </div>
            <FormBadges form={momentumAndForm.homeForm} />
          </div>

          {/* Away Form */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs text-text-muted">{config.formLabel}</span>
              <span className={`text-xs sm:text-sm font-bold ${awayStreak.color}`}>{awayStreak.streak}</span>
            </div>
            <FormBadges form={momentumAndForm.awayForm} />
          </div>
        </div>

        {/* H2H Summary (if available) */}
        {hasH2H && (
          <>
            <div className="border-t border-divider my-4"></div>
            <div className="bg-bg-hover rounded-lg p-3">
              <p className="text-[10px] sm:text-xs text-text-muted mb-2 text-center">
                Head-to-Head ({h2h!.totalMatches} matches)
              </p>
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                <div className="text-center">
                  <span className="text-lg sm:text-xl font-bold text-success">{h2h!.homeWins}</span>
                  <p className="text-[10px] sm:text-xs text-text-muted">Home</p>
                </div>
                <div className="text-center">
                  <span className="text-lg sm:text-xl font-bold text-text-secondary">{h2h!.draws}</span>
                  <p className="text-[10px] sm:text-xs text-text-muted">Draws</p>
                </div>
                <div className="text-center">
                  <span className="text-lg sm:text-xl font-bold text-info">{h2h!.awayWins}</span>
                  <p className="text-[10px] sm:text-xs text-text-muted">Away</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
