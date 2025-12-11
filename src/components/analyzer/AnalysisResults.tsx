/**
 * Analysis Results Component
 * 
 * Premium 6-layer layout for analysis results:
 * - Layer 1: Quick Glance Card (summary with key metrics + donut chart)
 * - Layer 1.5: Quick Stats + Key Factors (side by side on desktop)
 * - Layer 1.75: H2H Stats Card (enhanced head-to-head visualization)
 * - Layer 2: League Context + Team Comparison (standings & radar chart)
 * - Layer 2.25: Rest & Schedule Analysis (NEW: rest days, schedule density)
 * - Layer 2.5: Match Context Indicators (rest, rivalry, situational factors)
 * - Layer 3: Confidence Meter + Sport Insights (side by side)
 * - Layer 4: Analysis Accordion (detailed sections, collapsed by default)
 * - Layer 5: Extras Section (audio, notes, disclaimer)
 * 
 * Mobile-first, clean, scannable design with premium visualizations.
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

  // Check if we have H2H data to show
  const hasH2HData = result.momentumAndForm.h2hSummary && result.momentumAndForm.h2hSummary.totalMatches > 0;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      {/* Layer 1: Quick Glance - Key Metrics Summary with Donut Chart */}
      <section>
        <QuickGlanceCard result={result} />
      </section>

      {/* Layer 1.5: Quick Stats + Key Factors */}
      <section>
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <QuickStatsCard result={result} />
          <KeyFactorsCard result={result} />
        </div>
      </section>

      {/* Layer 1.75: H2H Stats Card (if data available) */}
      {hasH2HData && (
        <section>
          <H2HStatsCard
            homeTeam={result.matchInfo.homeTeam}
            awayTeam={result.matchInfo.awayTeam}
            h2hMatches={result.momentumAndForm.headToHead}
            h2hSummary={result.momentumAndForm.h2hSummary}
          />
        </section>
      )}

      {/* Layer 2: League Context + Team Comparison Radar (NEW) */}
      <section>
        <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
          <h2 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wider">
            Team Analytics
          </h2>
          <span className="text-[10px] sm:text-xs text-accent">
            📊 Advanced Stats
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <LeagueContextCard result={result} />
          <TeamComparisonRadar result={result} />
        </div>
      </section>

      {/* Layer 2.25: Rest & Schedule Analysis (NEW) */}
      <section>
        <RestScheduleCard result={result} />
      </section>

      {/* Layer 2.5: Match Context Indicators (NEW) */}
      <section>
        <MatchContextIndicators result={result} />
      </section>

      {/* Layer 3: Confidence Meter + Sport Insights */}
      <section>
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <ConfidenceMeter result={result} />
          <SportInsightsCard result={result} />
        </div>
      </section>

      {/* Layer 4: Detailed Analysis Accordion */}
      <section>
        <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
          <h2 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wider">
            Detailed Analysis
          </h2>
          <span className="text-[10px] sm:text-xs text-text-muted">
            Tap to expand
          </span>
        </div>
        <AnalysisAccordion result={result} />
      </section>

      {/* Layer 5: Extras - Audio, Notes, Disclaimer */}
      <section>
        <div className="mb-3 sm:mb-4 px-1">
          <h2 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wider">
            More Options
          </h2>
        </div>
        <ExtrasSection result={result} />
      </section>
    </div>
  );
}
