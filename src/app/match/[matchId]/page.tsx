/**
 * Match Preview Page - The Core Product
 * 
 * This is the main product page where users understand a match.
 * Completely redesigned for pre-match intelligence, not betting.
 * 
 * Sections:
 * 1. Match Header (teams, time, league)
 * 2. Headlines (shareable viral facts)
 * 3. Form Comparison (visual side-by-side)
 * 4. H2H History (timeline view)
 * 5. Key Absences (impact-focused)
 * 6. AI Briefing (audio-first)
 * 7. Share Actions
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MatchPreviewClient from './MatchPreviewClient';

interface PageProps {
  params: Promise<{ matchId: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { matchId } = await params;
  
  // In production, fetch match data here
  // For now, return generic metadata
  return {
    title: `Match Preview | SportBot AI`,
    description: 'Get instant match intelligence with AI-powered pre-match analysis.',
    openGraph: {
      title: `Match Preview | SportBot AI`,
      description: 'Understand any match in 60 seconds',
      type: 'article',
    },
  };
}

export default async function MatchPreviewPage({ params }: PageProps) {
  const { matchId } = await params;
  
  if (!matchId) {
    notFound();
  }

  return <MatchPreviewClient matchId={matchId} />;
}
