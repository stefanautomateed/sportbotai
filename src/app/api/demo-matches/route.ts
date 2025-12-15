/**
 * Demo Matches API
 * 
 * Serves pre-generated match analyses for anonymous users.
 * Zero API calls - instant response with curated content.
 * 
 * Endpoints:
 * - GET /api/demo-matches - List all demos (featured first)
 * - GET /api/demo-matches?sport=nba - Filter by sport
 * - GET /api/demo-matches?featured=true - Featured only
 * - GET /api/demo-matches?id=demo-nba-1 - Specific demo
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  DEMO_MATCHES, 
  getFeaturedDemos, 
  getDemosBySport, 
  getDemoById,
  getRandomFeaturedDemo,
} from '@/lib/demo-matches';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const id = searchParams.get('id');
  const sport = searchParams.get('sport');
  const featured = searchParams.get('featured');
  const random = searchParams.get('random');

  // Get specific demo by ID
  if (id) {
    const demo = getDemoById(id);
    if (!demo) {
      return NextResponse.json(
        { error: 'Demo not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(demo.data);
  }

  // Get random featured demo
  if (random === 'true') {
    const demo = getRandomFeaturedDemo();
    return NextResponse.json({
      demoId: demo.id,
      ...demo.data,
    });
  }

  // Filter by sport
  if (sport) {
    const demos = getDemosBySport(sport);
    return NextResponse.json({
      count: demos.length,
      demos: demos.map(d => ({
        id: d.id,
        sport: d.sport,
        league: d.league,
        featured: d.featured,
        matchInfo: d.data.matchInfo,
      })),
    });
  }

  // Featured only
  if (featured === 'true') {
    const demos = getFeaturedDemos();
    return NextResponse.json({
      count: demos.length,
      demos: demos.map(d => ({
        id: d.id,
        sport: d.sport,
        league: d.league,
        matchInfo: d.data.matchInfo,
      })),
    });
  }

  // Return all demos (summary only, not full data)
  return NextResponse.json({
    count: DEMO_MATCHES.length,
    demos: DEMO_MATCHES.map(d => ({
      id: d.id,
      sport: d.sport,
      league: d.league,
      featured: d.featured,
      matchInfo: d.data.matchInfo,
    })),
  });
}
