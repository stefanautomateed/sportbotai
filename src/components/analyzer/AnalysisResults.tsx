/**
 * Analysis Results Component - Premium 3-Tier Hierarchy
 * 
 * Tier 1 (Core Summary): Visually loud, essential information
 * - Core Verdict Card (hero)
 * - Match Story (AI narrative)
 * 
 * Tier 2 (Key Insights): Grouped, lighter background
 * - Momentum + Confidence
 * - Quick Stats + Key Factors  
 * - Injury Impact (if available)
 * 
 * Tier 3 (Deep Dive): Collapsible, secondary
 * - H2H, League Context, Radar
 * - Rest Schedule, Match Context
 * - Full Accordion
 * 
 * iOS 17 + Tesla UI inspired design with proper contrast.
 */

'use client';

import { useState } from 'react';
import { AnalyzeResponse } from '@/types';
import CoreVerdictCard from './CoreVerdictCard';
import MatchStoryCard from './MatchStoryCard';
import SectionDivider from './SectionDivider';
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
import QuickBriefingCard from './QuickBriefingCard';
import OddsComparisonCard from './OddsComparisonCard';
import ShareCard from './ShareCard';
import CopyInsightsButton from './CopyInsightsButton';
import PreMatchInsightsPanel from './PreMatchInsightsPanel';

interface AnalysisResultsProps {
  result: AnalyzeResponse;
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [showQuickBriefing, setShowQuickBriefing] = useState(true);
  
  // Guard against missing essential data (older/malformed analyses)
  if (!result || !result.matchInfo || !result.probabilities) {
    return (
      <div className="bg-[#0F1114] rounded-2xl border border-warning/30 shadow-card p-6 sm:p-8 max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 bg-warning/15 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Legacy Analysis</h3>
            <p className="text-text-secondary leading-relaxed">
              This analysis was saved in an older format and cannot be displayed in full. 
              The data structure has been updated since this analysis was created.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (!result.success && result.error) {
    return (
      <div className="bg-[#0F1114] rounded-2xl border border-danger/30 shadow-card p-6 sm:p-8 max-w-2xl mx-auto">
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

  // Check for available data - with null safety for older analyses
  const hasH2HData = result.momentumAndForm?.h2hSummary && result.momentumAndForm.h2hSummary.totalMatches > 0;
  const hasInjuryData = result.injuryContext && (
    result.injuryContext.homeTeam?.players.length || 
    result.injuryContext.awayTeam?.players.length
  );
  const hasPreMatchInsights = result.preMatchInsights && (
    (result.preMatchInsights.headlines?.length || 0) > 0 ||
    (result.preMatchInsights.streaks?.home?.length || 0) > 0 ||
    (result.preMatchInsights.streaks?.away?.length || 0) > 0
  );
  const hasMomentumAndForm = !!result.momentumAndForm;

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* ============================================ */}
      {/* 60-SECOND BRIEFING (Always visible first)   */}
      {/* Quick summary with audio option             */}
      {/* ============================================ */}
      
      {showQuickBriefing && (
        <section className="mb-8">
          <QuickBriefingCard 
            result={result} 
            onExpandToFull={() => setShowQuickBriefing(false)}
          />
        </section>
      )}

      {/* ============================================ */}
      {/* SHARE & COPY ACTIONS                        */}
      {/* ============================================ */}
      
      <div className="flex items-center justify-end gap-2 mb-6">
        <CopyInsightsButton result={result} variant="compact" />
        <ShareCard result={result} />
      </div>

      {/* ============================================ */}
      {/* TIER 1: CORE SUMMARY                        */}
      {/* Visually loud, essential information        */}
      {/* ============================================ */}
      
      <section className="space-y-6">
        {/* Hero: Core Verdict */}
        <CoreVerdictCard result={result} />
        
        {/* Match Story - AI Narrative */}
        <MatchStoryCard result={result} />
      </section>

      {/* ============================================ */}
      {/* PRE-MATCH INSIGHTS (Viral Stats)            */}
      {/* Headlines, Streaks, Venue Splits            */}
      {/* ============================================ */}
      
      {hasPreMatchInsights && (
        <>
          <SectionDivider label="Pre-Match Intel" icon="📊" variant="primary" />
          <section className="bg-[#0A0D10] rounded-2xl p-4 lg:p-6 border border-white/5">
            <PreMatchInsightsPanel
              insights={result.preMatchInsights!}
              homeTeam={result.matchInfo.homeTeam}
              awayTeam={result.matchInfo.awayTeam}
              isHomeGame={true}
            />
          </section>
        </>
      )}

      {/* ============================================ */}
      {/* TIER 2: KEY INSIGHTS                        */}
      {/* Grouped insights, lighter card background   */}
      {/* ============================================ */}
      
      <SectionDivider label="Key Insights" icon="📊" variant="primary" />
      
      <section className="space-y-4 lg:space-y-6">
        {/* Row 1: Data Quality (if good) + Sport Insights */}
        <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
          {/* ConfidenceMeter only renders when data quality is good (≥65) */}
          <ConfidenceMeter result={result} />
          <div className="bg-[#0A0D10] rounded-2xl p-1">
            <SportInsightsCard result={result} />
          </div>
        </div>
        
        {/* Row 2: Quick Stats + Key Factors */}
        <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-[#0A0D10] rounded-2xl p-1">
            <QuickStatsCard result={result} />
          </div>
          <div className="bg-[#0A0D10] rounded-2xl p-1">
            <KeyFactorsCard result={result} />
          </div>
        </div>
        
        {/* Injury Impact (if available) - Full width in Tier 2 */}
        {hasInjuryData && (
          <div className="bg-[#0A0D10] rounded-2xl p-1">
            <InjuryImpactCard
              injuryContext={result.injuryContext!}
              homeTeam={result.matchInfo.homeTeam}
              awayTeam={result.matchInfo.awayTeam}
              sport={result.matchInfo.sport}
            />
          </div>
        )}
        
        {/* Probability Comparison (neutral, educational) */}
        {result.oddsComparison && (
          <div className="bg-[#0A0D10] rounded-2xl p-1">
            <OddsComparisonCard
              oddsComparison={result.oddsComparison}
              homeTeam={result.matchInfo.homeTeam}
              awayTeam={result.matchInfo.awayTeam}
            />
          </div>
        )}
      </section>

      {/* ============================================ */}
      {/* TIER 3: DEEP DIVE                           */}
      {/* Collapsible, secondary details              */}
      {/* ============================================ */}
      
      <SectionDivider label="Deep Analysis" icon="🔬" variant="secondary" />
      
      {/* Expand/Collapse Toggle */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowDeepDive(!showDeepDive)}
          className="group flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-200"
        >
          <span className="text-sm text-text-secondary group-hover:text-white transition-colors">
            {showDeepDive ? 'Hide' : 'Show'} Detailed Stats
          </span>
          <svg 
            className={`w-4 h-4 text-text-muted group-hover:text-accent transition-all duration-200 ${showDeepDive ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {/* Collapsible Deep Dive Content */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showDeepDive ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <section className="space-y-4 lg:space-y-6 pb-6">
          
          {/* H2H Stats (if available) */}
          {hasH2HData && (
            <div className="bg-[#080A0D] rounded-xl border border-white/5 p-1">
              <H2HStatsCard
                homeTeam={result.matchInfo.homeTeam}
                awayTeam={result.matchInfo.awayTeam}
                sport={result.matchInfo.sport}
                h2hMatches={result.momentumAndForm.headToHead}
                h2hSummary={result.momentumAndForm.h2hSummary}
              />
            </div>
          )}
          
          {/* League Context + Team Radar */}
          <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
            <div className="bg-[#080A0D] rounded-xl border border-white/5 p-1">
              <LeagueContextCard result={result} />
            </div>
            <div className="bg-[#080A0D] rounded-xl border border-white/5 p-1">
              <TeamComparisonRadar result={result} />
            </div>
          </div>
          
          {/* Rest Schedule + Match Context */}
          <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
            <div className="bg-[#080A0D] rounded-xl border border-white/5 p-1">
              <RestScheduleCard result={result} />
            </div>
            <div className="bg-[#080A0D] rounded-xl border border-white/5 p-1">
              <MatchContextIndicators result={result} />
            </div>
          </div>
        </section>
      </div>

      {/* ============================================ */}
      {/* TIER 3B: DETAILED ACCORDION                 */}
      {/* Full technical breakdown                    */}
      {/* ============================================ */}
      
      <section className="mt-2">
        <div className="bg-[#080A0D] rounded-xl border border-white/5 p-1">
          <AnalysisAccordion result={result} />
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER: EXTRAS                              */}
      {/* Audio, Notes, Disclaimer                    */}
      {/* ============================================ */}
      
      <SectionDivider label="More" icon="⚙️" variant="subtle" className="mt-8" />
      
      <section>
        <ExtrasSection result={result} />
      </section>
    </div>
  );
}
