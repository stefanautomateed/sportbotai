/**
 * Analysis Results Component
 * 
 * Desktop-optimized 6-layer layout for analysis results.
 * Uses 2-3 column grids on desktop for efficient space use,
 * falls back to single column on mobile.
 * 
 * Layout Structure:
 * - Layer 1: Quick Glance (full width - hero section)
 * - Layer 1.5: Quick Stats + Key Factors (2-col)
 * - Layer 1.75: H2H + Injury Impact (2-col on desktop)
 * - Layer 2: League Context + Team Radar (2-col)
 * - Layer 2.25: Rest Schedule + Match Context (2-col)
 * - Layer 3: Confidence + Sport Insights (2-col)
 * - Layer 4: Analysis Accordion (full width)
 * - Layer 5: Extras (full width)
 * 
 * Mobile-first, scales beautifully to desktop with efficient layout.
 */

'use client';

import { AnalyzeResponse } from '@/types';
import QuickGlanceCard from './QuickGlanceCard';
import QuickStatsCard from './QuickStatsCard';
import KeyFactorsCard from './KeyFactorsCard';
import ConfidenceMeter from './ConfidenceMeter';
import SportInsightsCard from './SportInsightsCard';
import AnalysisAccordion from './AnalysisAccordion';
import ExtrasSection from './ExtrasSection';
import H2HStatsCard from './H2HStatsCard';
import LeagueContextCard from './LeagueContextCard';
import TeamComparisonRadar from './TeamComparisonRadar';
import MatchContextIndicators from './MatchContextIndicators';
import RestScheduleCard from './RestScheduleCard';
import InjuryImpactCard from './InjuryImpactCard';

interface AnalysisResultsProps {
  result: AnalyzeResponse;
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  // Error state
  if (!result.success && result.error) {
    return (
      <div className="bg-bg-card rounded-2xl border border-danger/30 shadow-card p-6 sm:p-8 max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 bg-danger/15 rounded-xl flex items-center justify-center">
            <svg className="w-7 h-7 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Analysis Error</h3>
            <p className="text-text-secondary leading-relaxed">{result.error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Check for available data
  const hasH2HData = result.momentumAndForm.h2hSummary && result.momentumAndForm.h2hSummary.totalMatches > 0;
  const hasInjuryData = result.injuryContext && (
    result.injuryContext.homeTeam?.players.length || 
    result.injuryContext.awayTeam?.players.length
  );

  return (
    <div className="space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      {/* ================================ */}
      {/* LAYER 1: HERO - Quick Glance    */}
      {/* Full width on all screens       */}
      {/* ================================ */}
      <section>
        <QuickGlanceCard result={result} />
      </section>

      {/* ================================ */}
      {/* LAYER 1.5: Quick Stats + Factors*/}
      {/* 2-col on tablet+                */}
      {/* ================================ */}
      <section>
        <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
          <QuickStatsCard result={result} />
          <KeyFactorsCard result={result} />
        </div>
      </section>

      {/* ================================ */}
      {/* LAYER 1.75: H2H + Injuries      */}
      {/* 2-col on large desktop          */}
      {/* ================================ */}
      {(hasH2HData || hasInjuryData) && (
        <section>
          <div className="flex items-center justify-between mb-3 lg:mb-4 px-1">
            <h2 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wider">
              Head-to-Head & Squad Status
            </h2>
            <span className="text-[10px] sm:text-xs text-accent">
              📊 Historical Data
            </span>
          </div>
          
          {/* If both available: side by side on desktop */}
          {hasH2HData && hasInjuryData ? (
            <div className="grid xl:grid-cols-2 gap-4 lg:gap-6">
              <H2HStatsCard
                homeTeam={result.matchInfo.homeTeam}
                awayTeam={result.matchInfo.awayTeam}
                h2hMatches={result.momentumAndForm.headToHead}
                h2hSummary={result.momentumAndForm.h2hSummary}
              />
              <InjuryImpactCard
                injuryContext={result.injuryContext!}
                homeTeam={result.matchInfo.homeTeam}
                awayTeam={result.matchInfo.awayTeam}
              />
            </div>
          ) : hasH2HData ? (
            <H2HStatsCard
              homeTeam={result.matchInfo.homeTeam}
              awayTeam={result.matchInfo.awayTeam}
              h2hMatches={result.momentumAndForm.headToHead}
              h2hSummary={result.momentumAndForm.h2hSummary}
            />
          ) : hasInjuryData ? (
            <InjuryImpactCard
              injuryContext={result.injuryContext!}
              homeTeam={result.matchInfo.homeTeam}
              awayTeam={result.matchInfo.awayTeam}
            />
          ) : null}
        </section>
      )}

      {/* ================================ */}
      {/* LAYER 2: Team Analytics         */}
      {/* League Context + Radar Chart    */}
      {/* 2-col on tablet+                */}
      {/* ================================ */}
      <section>
        <div className="flex items-center justify-between mb-3 lg:mb-4 px-1">
          <h2 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wider">
            Team Analytics
          </h2>
          <span className="text-[10px] sm:text-xs text-accent">
            📊 Advanced Stats
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
          <LeagueContextCard result={result} />
          <TeamComparisonRadar result={result} />
        </div>
      </section>

      {/* ================================ */}
      {/* LAYER 2.25: Rest + Context      */}
      {/* Rest Schedule + Match Indicators*/}
      {/* 2-col on large desktop          */}
      {/* ================================ */}
      <section>
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
          <RestScheduleCard result={result} />
          <div className="lg:flex lg:flex-col lg:justify-center">
            <MatchContextIndicators result={result} />
          </div>
        </div>
      </section>

      {/* ================================ */}
      {/* LAYER 3: Confidence & Insights  */}
      {/* 2-col on tablet+                */}
      {/* ================================ */}
      <section>
        <div className="flex items-center justify-between mb-3 lg:mb-4 px-1">
          <h2 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wider">
            Analysis Confidence
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
          <ConfidenceMeter result={result} />
          <SportInsightsCard result={result} />
        </div>
      </section>

      {/* ================================ */}
      {/* LAYER 4: Detailed Accordion     */}
      {/* Full width, collapsible         */}
      {/* ================================ */}
      <section>
        <div className="flex items-center justify-between mb-3 lg:mb-4 px-1">
          <h2 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wider">
            Detailed Analysis
          </h2>
          <span className="text-[10px] sm:text-xs text-text-muted">
            Tap to expand
          </span>
        </div>
        <AnalysisAccordion result={result} />
      </section>

      {/* ================================ */}
      {/* LAYER 5: Extras & Options       */}
      {/* Audio, Notes, Disclaimer        */}
      {/* ================================ */}
      <section>
        <div className="mb-3 lg:mb-4 px-1">
          <h2 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wider">
            More Options
          </h2>
        </div>
        <ExtrasSection result={result} />
      </section>
    </div>
  );
}
