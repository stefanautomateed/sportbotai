/**
 * Admin API: Get matches with predictions
 * 
 * Returns matches that have been pre-analyzed and have prediction data.
 * Used by admin blog panel to only show matches we can generate quality content for.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_EMAILS = [
  'gogecmaestrotib92@gmail.com',
  'aiinstamarketing@gmail.com',
  'gogani92@gmail.com',
  'stefan@automateed.com',
  'streamentor@gmail.com',
];

export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sportFilter = searchParams.get('sport') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100');

    // Get pending predictions (matches not yet played)
    const predictions = await prisma.prediction.findMany({
      where: {
        outcome: 'PENDING',
        kickoff: {
          gte: new Date(), // Only future matches
        },
        ...(sportFilter !== 'all' && { sport: sportFilter }),
      },
      orderBy: { kickoff: 'asc' },
      take: limit,
      select: {
        id: true,
        matchId: true,
        matchName: true,
        kickoff: true,
        sport: true,
        league: true,
        prediction: true,
        conviction: true,
        odds: true,
        createdAt: true,
      },
    });

    // Check which ones already have blog posts
    const matchIds = predictions.map(p => p.matchId);
    const existingPosts = await prisma.blogPost.findMany({
      where: { matchId: { in: matchIds } },
      select: { matchId: true, slug: true },
    });
    
    const postMap = new Map(existingPosts.map(p => [p.matchId, p.slug]));

    // Parse team names from matchName (format: "Team A vs Team B")
    const parseTeams = (matchName: string) => {
      const parts = matchName.split(' vs ');
      return {
        homeTeam: parts[0]?.trim() || matchName,
        awayTeam: parts[1]?.trim() || '',
      };
    };

    // Format response
    const matches = predictions.map(p => {
      const { homeTeam, awayTeam } = parseTeams(p.matchName);
      return {
        matchId: p.matchId,
        homeTeam,
        awayTeam,
        matchName: p.matchName,
        commenceTime: p.kickoff.toISOString(),
        sport: p.sport,
        league: p.league || p.sport,
        sportKey: p.sport,
        prediction: p.prediction,
        conviction: p.conviction,
        odds: p.odds,
        hasPrediction: true,
        hasBlogPost: postMap.has(p.matchId),
        blogSlug: postMap.get(p.matchId) || null,
      };
    });

    return NextResponse.json({
      success: true,
      matches,
      total: matches.length,
      withBlogPost: existingPosts.length,
      withoutBlogPost: matches.length - existingPosts.length,
    });

  } catch (error) {
    console.error('[Admin Predictions API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
