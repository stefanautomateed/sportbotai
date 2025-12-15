/**
 * Match Preview Page - The Core Product V3
 * 
 * Premium, minimal match intelligence.
 * Clean design that works across ALL sports.
 * Zero betting advice. Pure understanding.
 * 
 * "Understand any match in 60 seconds"
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MatchPreviewClientV3 from './MatchPreviewClientV3';

interface PageProps {
  params: Promise<{ matchId: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { matchId } = await params;
  
  return {
    title: `Match Analysis | SportBot AI`,
    description: 'Premium match intelligence powered by AI. Understand any match in 60 seconds.',
    openGraph: {
      title: `Match Analysis | SportBot AI`,
      description: 'Premium match intelligence powered by AI',
      type: 'article',
    },
  };
}

export default async function MatchPreviewPage({ params }: PageProps) {
  const { matchId } = await params;
  
  if (!matchId) {
    notFound();
  }

  return <MatchPreviewClientV3 matchId={matchId} />;
}
