/**
 * Match Preview Client Component
 * 
 * The heart of the pre-match intelligence experience.
 * Fetches match data and renders the preview.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import MatchHeader from '@/components/match-preview/MatchHeader';
import HeadlinesSection from '@/components/match-preview/HeadlinesSection';
import FormComparison from '@/components/match-preview/FormComparison';
import H2HTimeline from '@/components/match-preview/H2HTimeline';
import KeyAbsences from '@/components/match-preview/KeyAbsences';
import AIBriefing from '@/components/match-preview/AIBriefing';
import ShareActions from '@/components/match-preview/ShareActions';
import MatchPreviewSkeleton from '@/components/match-preview/MatchPreviewSkeleton';

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
    kickoff: string;
    venue?: string;
  };
  headlines: Array<{
    icon: string;
    text: string;
    category: string;
    impactLevel: 'high' | 'medium' | 'low';
  }>;
  form: {
    home: {
      recent: string; // "WWDLW"
      trend: 'up' | 'down' | 'stable';
      goalsScored: number;
      goalsConceded: number;
      lastMatches: Array<{
        opponent: string;
        result: 'W' | 'D' | 'L';
        score: string;
        date: string;
        home: boolean;
      }>;
    };
    away: {
      recent: string;
      trend: 'up' | 'down' | 'stable';
      goalsScored: number;
      goalsConceded: number;
      lastMatches: Array<{
        opponent: string;
        result: 'W' | 'D' | 'L';
        score: string;
        date: string;
        home: boolean;
      }>;
    };
  };
  h2h: {
    totalMeetings: number;
    homeWins: number;
    awayWins: number;
    draws: number;
    recentMeetings: Array<{
      date: string;
      homeTeam: string;
      awayTeam: string;
      score: string;
      venue: string;
    }>;
  };
  absences: {
    home: Array<{
      name: string;
      position: string;
      reason: string;
      impact: 'high' | 'medium' | 'low';
    }>;
    away: Array<{
      name: string;
      position: string;
      reason: string;
      impact: 'high' | 'medium' | 'low';
    }>;
  };
  briefing: {
    summary: string;
    keyPoints: string[];
    audioUrl?: string;
  };
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
        
        // Fetch match preview data
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
    return <MatchPreviewSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Match Not Found</h1>
          <p className="text-text-secondary mb-6">
            {error || "We couldn't find this match. It may have already been played or the link is incorrect."}
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary rounded-xl text-white font-medium hover:bg-primary/90 transition-colors"
          >
            <span>←</span>
            <span>Browse Matches</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto px-4 py-6 sm:py-10">
        {/* Back button */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">All Matches</span>
        </Link>

        {/* Match Header */}
        <MatchHeader 
          homeTeam={data.matchInfo.homeTeam}
          awayTeam={data.matchInfo.awayTeam}
          league={data.matchInfo.league}
          kickoff={data.matchInfo.kickoff}
          venue={data.matchInfo.venue}
        />

        {/* Main Content */}
        <div className="space-y-6 mt-8">
          {/* Headlines - The viral hook */}
          <HeadlinesSection 
            headlines={data.headlines}
            homeTeam={data.matchInfo.homeTeam}
            awayTeam={data.matchInfo.awayTeam}
          />

          {/* Form Comparison */}
          <FormComparison 
            homeTeam={data.matchInfo.homeTeam}
            awayTeam={data.matchInfo.awayTeam}
            homeForm={data.form.home}
            awayForm={data.form.away}
          />

          {/* H2H Timeline */}
          <H2HTimeline 
            homeTeam={data.matchInfo.homeTeam}
            awayTeam={data.matchInfo.awayTeam}
            h2h={data.h2h}
          />

          {/* Key Absences */}
          <KeyAbsences 
            homeAbsences={{
              team: data.matchInfo.homeTeam,
              absences: data.absences.home.map(a => ({
                player: a.name,
                position: a.position,
                reason: a.reason as 'injury' | 'suspension' | 'doubtful' | 'other',
                details: a.reason,
                impact: a.impact === 'high' ? 'high' : a.impact === 'medium' ? 'medium' : 'low',
              }))
            }}
            awayAbsences={{
              team: data.matchInfo.awayTeam,
              absences: data.absences.away.map(a => ({
                player: a.name,
                position: a.position,
                reason: a.reason as 'injury' | 'suspension' | 'doubtful' | 'other',
                details: a.reason,
                impact: a.impact === 'high' ? 'high' : a.impact === 'medium' ? 'medium' : 'low',
              }))
            }}
          />

          {/* AI Briefing */}
          <AIBriefing 
            briefing={{
              summary: data.briefing.summary,
              keyPoints: data.briefing.keyPoints,
              verdict: '',
              audioUrl: data.briefing.audioUrl,
            }}
            homeTeam={data.matchInfo.homeTeam}
            awayTeam={data.matchInfo.awayTeam}
          />

          {/* Share Actions */}
          <ShareActions 
            matchId={matchId}
            homeTeam={data.matchInfo.homeTeam}
            awayTeam={data.matchInfo.awayTeam}
            headline={data.headlines[0]?.text}
            kickoff={data.matchInfo.kickoff}
          />
        </div>

        {/* Footer disclaimer */}
        <p className="text-center text-xs text-text-muted mt-12 max-w-lg mx-auto">
          SportBot AI provides match intelligence for educational purposes. 
          This is not betting advice. Always gamble responsibly if you choose to bet.
        </p>
      </div>
    </div>
  );
}
