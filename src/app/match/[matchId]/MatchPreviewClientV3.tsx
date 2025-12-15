/**
 * Match Preview Client Component V3 - Universal Signals Framework
 * 
 * Clean, minimal, confident analysis.
 * Universal design that works across ALL sports.
 * Zero betting advice. Pure match intelligence.
 * 
 * Uses the 5 normalized signals:
 * - Form
 * - Strength Edge
 * - Tempo
 * - Efficiency
 * - Availability
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  PremiumMatchHeader,
  ShareCard,
  UniversalSignalsDisplay,
} from '@/components/analysis';
import type { UniversalSignals } from '@/lib/universal-signals';

interface MatchPreviewClientProps {
  matchId: string;
}

interface MatchPreviewData {
  matchInfo: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    sport: string;
    hasDraw?: boolean;
    scoringUnit?: string;
    kickoff: string;
    venue?: string;
  };
  story: {
    favored: 'home' | 'away' | 'draw';
    confidence: 'strong' | 'moderate' | 'slight';
    narrative?: string;
    snapshot?: string[];
    riskFactors?: string[];
    supportingStats?: Array<{
      icon: string;
      stat: string;
      context: string;
    }>;
    audioUrl?: string;
  };
  // New Universal Signals (V3)
  universalSignals?: UniversalSignals;
  // Legacy signals format (backwards compatibility)
  signals?: {
    formLabel: string;
    strengthEdgeLabel: string;
    strengthEdgeDirection: string;
    tempoLabel: string;
    efficiencyLabel: string;
    availabilityLabel: string;
  };
  viralStats?: {
    h2h: { headline: string; favors: string };
    form: { home: string; away: string };
    keyAbsence: { player: string; team: string; impact: string } | null;
    streak: { text: string; team: string } | null;
  };
  headlines?: Array<{
    icon: string;
    text: string;
    favors: string;
    viral?: boolean;
  }>;
}

export default function MatchPreviewClient({ matchId }: MatchPreviewClientProps) {
  const { data: session } = useSession();
  const [data, setData] = useState<MatchPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchPreview = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/match-preview/${matchId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load match preview');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchPreview();
  }, [matchId]);

  if (loading) {
    return <PremiumSkeleton />;
  }

  if (error || !data || !data.matchInfo) {
    return (
      <div className="min-h-screen bg-[#050506] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Match Not Found</h1>
          <p className="text-zinc-500 mb-6 text-sm">
            {error || "We couldn't find this match. It may have already been played or the link is incorrect."}
          </p>
          <Link 
            href="/matches"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 rounded-xl text-white text-sm font-medium hover:bg-white/10 transition-colors border border-white/10"
          >
            <span>←</span>
            <span>Browse Matches</span>
          </Link>
        </div>
      </div>
    );
  }

  // Map confidence from old format if needed
  const mapConfidence = (conf: string): 'high' | 'medium' | 'low' => {
    if (conf === 'strong') return 'high';
    if (conf === 'slight') return 'low';
    return 'medium';
  };

  // Build snapshot from old format if not present
  const snapshot = data.story.snapshot || (data.story.supportingStats?.map(s => `${s.stat}: ${s.context}`) || []);
  
  // Build game flow from narrative
  const gameFlow = data.story.narrative || '';
  
  // Build risk factors
  const riskFactors = data.story.riskFactors || [];

  return (
    <div className="min-h-screen bg-[#050506]">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-white/[0.01] via-transparent to-transparent pointer-events-none" />
      
      <div className="relative max-w-2xl mx-auto px-4 py-6 sm:py-10">
        {/* Back navigation - Minimal */}
        <Link 
          href="/matches"
          className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">All Matches</span>
        </Link>

        {/* Match Header - Clean and premium */}
        <PremiumMatchHeader 
          homeTeam={data.matchInfo.homeTeam}
          awayTeam={data.matchInfo.awayTeam}
          league={data.matchInfo.league}
          sport={data.matchInfo.sport}
          kickoff={data.matchInfo.kickoff}
          venue={data.matchInfo.venue}
        />

        {/* Universal Signals Display - The Core Product */}
        {data.universalSignals && (
          <div className="mt-8">
            <UniversalSignalsDisplay
              signals={data.universalSignals}
              homeTeam={data.matchInfo.homeTeam}
              awayTeam={data.matchInfo.awayTeam}
            />
          </div>
        )}

        {/* Match Snapshot - AI Insights */}
        {snapshot && snapshot.length > 0 && (
          <div className="mt-6 rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-5">
            <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-4">
              Match Snapshot
            </h3>
            <ul className="space-y-2.5">
              {snapshot.slice(0, 4).map((insight, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-white/30 mt-2 flex-shrink-0" />
                  <span className="text-sm text-zinc-300 leading-relaxed">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Game Flow - How it unfolds */}
        {gameFlow && (
          <div className="mt-5 rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-5">
            <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-3">
              Game Flow
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {gameFlow}
            </p>
          </div>
        )}

        {/* Risk Factors */}
        {riskFactors && riskFactors.length > 0 && (
          <div className="mt-5 rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-5">
            <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="text-amber-500/80">⚠</span>
              Risk Factors
            </h3>
            <ul className="space-y-2">
              {riskFactors.map((risk, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-amber-500/40 mt-2 flex-shrink-0" />
                  <span className="text-sm text-zinc-500 leading-relaxed">{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Headline Quote (if available) */}
        {data.headlines && data.headlines.length > 0 && (
          <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06]">
            <p className="text-base text-white font-medium leading-relaxed">
              "{data.headlines[0].text}"
            </p>
            <p className="text-[10px] text-zinc-600 mt-2 uppercase tracking-wider">
              — SportBot Analysis
            </p>
          </div>
        )}

        {/* Share Card */}
        <div className="mt-8">
          <ShareCard
            matchId={matchId}
            homeTeam={data.matchInfo.homeTeam}
            awayTeam={data.matchInfo.awayTeam}
            verdict={data.headlines?.[0]?.text || `${data.matchInfo.homeTeam} vs ${data.matchInfo.awayTeam}`}
            kickoff={data.matchInfo.kickoff}
          />
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[11px] text-zinc-600 max-w-sm mx-auto">
            SportBot AI provides match intelligence for educational purposes only. 
            This is not betting advice. If you gamble, please do so responsibly.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Premium Loading Skeleton
 */
function PremiumSkeleton() {
  return (
    <div className="min-h-screen bg-[#050506]">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Back button skeleton */}
        <div className="h-4 w-24 bg-white/5 rounded mb-8" />
        
        {/* Header skeleton */}
        <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="h-5 w-32 bg-white/5 rounded" />
            <div className="h-4 w-24 bg-white/5 rounded" />
          </div>
          <div className="flex items-center justify-center gap-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 bg-white/5 rounded-full animate-pulse" />
              <div className="h-5 w-24 bg-white/5 rounded" />
            </div>
            <div className="w-14 h-14 bg-white/5 rounded-full" />
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 bg-white/5 rounded-full animate-pulse" />
              <div className="h-5 w-24 bg-white/5 rounded" />
            </div>
          </div>
        </div>

        {/* Analysis skeleton */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white/5 rounded-xl" />
              <div>
                <div className="h-3 w-20 bg-white/5 rounded mb-2" />
                <div className="h-5 w-32 bg-white/5 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-white/[0.02] rounded-xl animate-pulse" />
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-6">
            <div className="h-3 w-24 bg-white/5 rounded mb-4" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${100 - i * 10}%` }} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-6">
            <div className="h-3 w-32 bg-white/5 rounded mb-4" />
            <div className="h-16 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
