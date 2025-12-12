/**
 * PreMatchInsightsPanel - The Ultimate Match Intelligence View
 * 
 * Combines all viral pre-match stats into one engaging panel:
 * - Headlines (shareable facts)
 * - Key Absences
 * - Streaks
 * - Venue Splits
 * - H2H Quick Stats
 * 
 * This is the "hero" component for pre-match understanding.
 */

'use client';

import React from 'react';
import { PreMatchInsights } from '@/types';
import MatchHeadlinesCard from './MatchHeadlinesCard';
import KeyAbsencesBanner from './KeyAbsencesBanner';
import StreaksCard, { StreakHighlight } from './StreaksCard';
import VenueSplitsCard from './VenueSplitsCard';

interface PreMatchInsightsPanelProps {
  insights: PreMatchInsights;
  homeTeam: string;
  awayTeam: string;
  isHomeGame?: boolean;
  className?: string;
  /** Compact mode shows less detail */
  compact?: boolean;
}

/**
 * Full Pre-Match Insights Panel
 * Shows all available viral stats in an organized layout
 */
export function PreMatchInsightsPanel({
  insights,
  homeTeam,
  awayTeam,
  isHomeGame = true,
  className = '',
  compact = false,
}: PreMatchInsightsPanelProps) {
  const hasHeadlines = insights.headlines && insights.headlines.length > 0;
  const hasAbsences = (insights.keyAbsences?.home?.length || 0) > 0 || 
                      (insights.keyAbsences?.away?.length || 0) > 0;
  const hasStreaks = (insights.streaks?.home?.length || 0) > 0 || 
                     (insights.streaks?.away?.length || 0) > 0;
  const hasVenueSplits = insights.venueSplits?.home || insights.venueSplits?.away;

  if (!hasHeadlines && !hasAbsences && !hasStreaks && !hasVenueSplits) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📊</span>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Pre-Match Intelligence
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
          Key stats at a glance
        </span>
      </div>

      {/* Headlines - Always first, most engaging */}
      {hasHeadlines && (
        <MatchHeadlinesCard 
          headlines={insights.headlines} 
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          compact={compact}
        />
      )}

      {/* Key Absences Banner - High importance */}
      {hasAbsences && (
        <KeyAbsencesBanner
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homeAbsences={insights.keyAbsences?.home || []}
          awayAbsences={insights.keyAbsences?.away || []}
          impactStatement={insights.keyAbsences?.impactStatement}
        />
      )}

      {/* Two-column layout for Streaks + Venue Splits */}
      {(hasStreaks || hasVenueSplits) && !compact && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Streaks */}
          {hasStreaks && (
            <StreaksCard
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              homeStreaks={insights.streaks?.home || []}
              awayStreaks={insights.streaks?.away || []}
            />
          )}

          {/* Venue Splits */}
          {hasVenueSplits && (
            <VenueSplitsCard
              homeSplit={insights.venueSplits?.home || null}
              awaySplit={insights.venueSplits?.away || null}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
            />
          )}
        </div>
      )}

      {/* Compact mode: inline streaks */}
      {hasStreaks && compact && (
        <div className="flex flex-wrap gap-2">
          {insights.streaks?.home?.slice(0, 2).map((streak, i) => (
            <StreakHighlight key={`h-${i}`} streak={streak} teamName={homeTeam} />
          ))}
          {insights.streaks?.away?.slice(0, 2).map((streak, i) => (
            <StreakHighlight key={`a-${i}`} streak={streak} teamName={awayTeam} />
          ))}
        </div>
      )}

      {/* Quick Stats Footer */}
      {insights.quickStats && (
        <QuickStatsBar quickStats={insights.quickStats} />
      )}
    </div>
  );
}

/**
 * Quick Stats Bar - Compact row of key metrics
 */
interface QuickStatsBarProps {
  quickStats: PreMatchInsights['quickStats'];
}

interface QuickStat {
  label: string;
  value: string;
  icon: string;
}

function QuickStatsBar({ quickStats }: QuickStatsBarProps) {
  if (!quickStats) return null;

  const stats: QuickStat[] = [
    quickStats.fixtureGoalsAvg !== null ? {
      label: 'Fixture Avg',
      value: `${quickStats.fixtureGoalsAvg} goals`,
      icon: '⚽',
    } : null,
    quickStats.combinedFormGoalsAvg !== null ? {
      label: 'Form Avg',
      value: `${quickStats.combinedFormGoalsAvg} goals`,
      icon: '📈',
    } : null,
    quickStats.bttsLikelihood ? {
      label: 'BTTS',
      value: quickStats.bttsLikelihood,
      icon: quickStats.bttsLikelihood === 'high' ? '🎯' : '📊',
    } : null,
  ].filter((stat): stat is QuickStat => stat !== null);

  if (stats.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      {stats.map((stat, i) => (
        <div 
          key={i}
          className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400"
        >
          <span>{stat.icon}</span>
          <span className="text-gray-500">{stat.label}:</span>
          <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Minimal insights summary for tight spaces
 */
interface InsightsSummaryProps {
  insights: PreMatchInsights;
  homeTeam: string;
  awayTeam: string;
}

export function PreMatchInsightsSummary({ 
  insights, 
  homeTeam, 
  awayTeam 
}: InsightsSummaryProps) {
  // Get most impactful headline
  const topHeadline = insights.headlines?.find(h => h.impactLevel === 'high') 
    || insights.headlines?.[0];

  // Get most notable streaks
  const topHomeStreak = insights.streaks?.home?.[0];
  const topAwayStreak = insights.streaks?.away?.[0];

  return (
    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
      {topHeadline && (
        <p className="flex items-center gap-1">
          <span>{topHeadline.icon}</span>
          <span>{topHeadline.text}</span>
        </p>
      )}
      {topHomeStreak && (
        <p className="flex items-center gap-1">
          <span>📊</span>
          <span>{homeTeam}: {topHomeStreak.description}</span>
        </p>
      )}
      {topAwayStreak && (
        <p className="flex items-center gap-1">
          <span>📊</span>
          <span>{awayTeam}: {topAwayStreak.description}</span>
        </p>
      )}
    </div>
  );
}

export default PreMatchInsightsPanel;
