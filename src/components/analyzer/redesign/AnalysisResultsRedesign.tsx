/**
 * Analysis Results - Premium Redesign v2
 * 
 * Built around the core promise: "Understand any match in 60 seconds"
 * 
 * NEW Structure (scan-optimized):
 * 1. Quick Briefing Card (THE 60-second promise - first thing users see)
 * 2. Match Header (visual teams)
 * 3. Data Freshness + Actions row
 * 4. Verdict + Probability
 * 5. Team Comparison (visual stats)
 * 6. Key Insights grid
 * 7. Deep Analysis (expandable)
 * 8. Pro Insights Teaser (conversion)
 * 9. Disclaimer
 */

'use client';

import { useSession } from 'next-auth/react';
import { AnalyzeResponse } from '@/types';
import MatchHeader from './MatchHeader';
import VerdictModule from './VerdictModule';
import ProbabilityBars from './ProbabilityBars';
import KeyMetricsDisplay from './KeyMetricsDisplay';
import InsightCards from './InsightCards';
import DeepAnalysisSection from './DeepAnalysisSection';
import DisclaimerFooter from './DisclaimerFooter';
import InjuryImpactCard from '../InjuryImpactCard';
import ShareCard from '../ShareCard';
import CopyInsightsButton from '../CopyInsightsButton';
import ListenToAnalysisButton from '../ListenToAnalysisButton';
import QuickBriefingCard from '../QuickBriefingCard';
import DataFreshnessIndicator from '../DataFreshnessIndicator';
import { FormBadgesCompact } from '../FormTimeline';
import Link from 'next/link';

interface AnalysisResultsRedesignProps {
  result: AnalyzeResponse;
}

export default function AnalysisResultsRedesign({ result }: AnalysisResultsRedesignProps) {
  const { data: session } = useSession();
  const isPro = session?.user?.plan && session.user.plan !== 'FREE';
  
  // Error state
  if (!result.success && result.error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl bg-rose-500/5 border border-rose-500/20 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Analysis Error</h3>
              <p className="text-sm text-white/60 leading-relaxed">{result.error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check for injury data
  const hasInjuryData = result.injuryContext && (
    result.injuryContext.homeTeam?.players.length || 
    result.injuryContext.awayTeam?.players.length
  );

  // Check for form data
  const hasFormData = result.momentumAndForm && (
    result.momentumAndForm.homeForm?.length || 
    result.momentumAndForm.awayForm?.length
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* ===== SECTION 0: 60-SECOND BRIEFING (THE HERO PROMISE) ===== */}
      <div className="px-4 sm:px-6 lg:px-0 mb-6">
        <QuickBriefingCard result={result} />
      </div>

      {/* ===== SECTION 1: MATCH HEADER ===== */}
      <MatchHeader matchInfo={result.matchInfo} />

      {/* ===== SECTION 2: DATA FRESHNESS + ACTIONS ===== */}
      <div className="px-4 sm:px-6 lg:px-0 mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Data freshness badge */}
          <DataFreshnessIndicator 
            dataSource={result.matchInfo.sourceType || 'AI_ESTIMATE'}
            analysisTime={new Date().toISOString()}
            compact
          />
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <ListenToAnalysisButton result={result} />
            <CopyInsightsButton result={result} variant="icon" />
            <ShareCard result={result} />
          </div>
        </div>
      </div>

      {/* ===== SECTION 3: MAIN VERDICT ===== */}
      <div className="px-4 sm:px-6 lg:px-0 mt-6 sm:mt-8">
        <VerdictModule result={result} />
      </div>

      {/* ===== SECTION 4: PROBABILITY + METRICS ===== */}
      <div className="px-4 sm:px-6 lg:px-0 mt-6 sm:mt-8">
        <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Probability Bars - Takes 2 columns */}
          <div className="lg:col-span-2">
            <ProbabilityBars result={result} />
          </div>
          
          {/* Key Metrics - Takes 3 columns */}
          <div className="lg:col-span-3">
            <KeyMetricsDisplay result={result} />
          </div>
        </div>
      </div>

      {/* ===== SECTION 5: TEAM FORM COMPARISON ===== */}
      {hasFormData && (
        <div className="px-4 sm:px-6 lg:px-0 mt-6">
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-400 to-purple-500" />
              <span className="text-xs font-medium text-white/40 uppercase tracking-widest">Recent Form</span>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <span className="text-sm text-white/60 mb-2 block">{result.matchInfo.homeTeam}</span>
                <FormBadgesCompact form={result.momentumAndForm.homeForm || []} />
              </div>
              <div>
                <span className="text-sm text-white/60 mb-2 block">{result.matchInfo.awayTeam}</span>
                <FormBadgesCompact form={result.momentumAndForm.awayForm || []} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SECTION 6: KEY INSIGHTS ===== */}
      <div className="px-4 sm:px-6 lg:px-0 mt-8 sm:mt-10">
        <div className="flex items-center gap-2 px-1 mb-5">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-blue-500" />
          <span className="text-xs font-medium text-white/40 uppercase tracking-widest">Key Insights</span>
        </div>
        <InsightCards result={result} />
      </div>

      {/* ===== SECTION 7: INJURY IMPACT (if available) ===== */}
      {hasInjuryData && (
        <div className="px-4 sm:px-6 lg:px-0 mt-6">
          <InjuryImpactCard
            injuryContext={result.injuryContext!}
            homeTeam={result.matchInfo.homeTeam}
            awayTeam={result.matchInfo.awayTeam}
            sport={result.matchInfo.sport}
          />
        </div>
      )}

      {/* ===== SECTION 8: DEEP ANALYSIS ===== */}
      <div className="px-4 sm:px-6 lg:px-0 mt-8 sm:mt-10">
        <DeepAnalysisSection result={result} />
      </div>

      {/* ===== SECTION 9: PRO INSIGHTS TEASER (for free users) ===== */}
      {!isPro && (
        <div className="px-4 sm:px-6 lg:px-0 mt-8">
          <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Unlock Pro Insights</h3>
                <p className="text-sm text-white/60 mb-4">
                  Get 30 analyses/day, team intelligence profiles, full history access, and advanced value detection.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-white/5 rounded text-xs text-white/60">📊 Team Profiles</span>
                  <span className="px-2 py-1 bg-white/5 rounded text-xs text-white/60">⭐ My Teams</span>
                  <span className="px-2 py-1 bg-white/5 rounded text-xs text-white/60">📈 Full History</span>
                  <span className="px-2 py-1 bg-white/5 rounded text-xs text-white/60">🎯 Value Alerts</span>
                </div>
                <Link 
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors"
                >
                  Upgrade to Pro - €9.99/mo
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SECTION 10: DISCLAIMER ===== */}
      <div className="px-4 sm:px-6 lg:px-0">
        <DisclaimerFooter responsibleGamblingNote={result.responsibleGambling?.coreNote} />
      </div>
    </div>
  );
}
