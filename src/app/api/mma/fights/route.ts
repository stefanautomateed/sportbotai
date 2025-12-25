/**
 * API Route: /api/mma/fights
 * 
 * Fetches UFC/MMA fight data from API-Sports.
 * Returns real confirmed fights with fighter photos.
 */

import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.API_FOOTBALL_KEY || '';
const MMA_API_URL = 'https://v1.mma.api-sports.io';

interface MMAFighter {
  id: number;
  name: string;
  logo: string;
  winner: boolean;
}

interface MMAFight {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  slug: string;
  is_main: boolean;
  category: string;
  status: {
    long: string;
    short: string;
  };
  fighters: {
    first: MMAFighter;
    second: MMAFighter;
  };
}

interface NormalizedMMAFight {
  id: string;
  eventName: string;
  date: string;
  category: string;
  isMainCard: boolean;
  status: string;
  fighter1: {
    id: string;
    name: string;
    photo: string;
    isWinner: boolean;
  };
  fighter2: {
    id: string;
    name: string;
    photo: string;
    isWinner: boolean;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const showAll = searchParams.get('all') === 'true';
    
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API_FOOTBALL_KEY not configured' },
        { status: 500 }
      );
    }

    // Get fights for current season
    const season = new Date().getFullYear();
    const response = await fetch(
      `${MMA_API_URL}/fights?season=${season}`,
      {
        headers: {
          'x-apisports-key': API_KEY,
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const fights: MMAFight[] = data.response || [];

    // Filter to upcoming fights (NS = Not Started) unless showAll is true
    const now = new Date();
    const filteredFights = showAll 
      ? fights 
      : fights.filter(f => {
          // Include upcoming fights (NS) or very recent finished fights
          const fightDate = new Date(f.timestamp * 1000);
          const isUpcoming = f.status.short === 'NS';
          const isRecent = f.status.short === 'FT' && 
            (now.getTime() - fightDate.getTime()) < 7 * 24 * 60 * 60 * 1000; // Within 7 days
          return isUpcoming || isRecent;
        });

    // Sort by date (upcoming first)
    filteredFights.sort((a, b) => a.timestamp - b.timestamp);

    // Normalize the data
    const normalizedFights: NormalizedMMAFight[] = filteredFights.map(fight => ({
      id: String(fight.id),
      eventName: fight.slug,
      date: fight.date,
      category: fight.category,
      isMainCard: fight.is_main,
      status: fight.status.short,
      fighter1: {
        id: String(fight.fighters.first.id),
        name: fight.fighters.first.name,
        photo: fight.fighters.first.logo,
        isWinner: fight.fighters.first.winner,
      },
      fighter2: {
        id: String(fight.fighters.second.id),
        name: fight.fighters.second.name,
        photo: fight.fighters.second.logo,
        isWinner: fight.fighters.second.winner,
      },
    }));

    // Group by event
    const eventGroups = normalizedFights.reduce((acc, fight) => {
      const eventName = fight.eventName;
      if (!acc[eventName]) {
        acc[eventName] = {
          eventName,
          date: fight.date,
          fights: [],
        };
      }
      acc[eventName].fights.push(fight);
      return acc;
    }, {} as Record<string, { eventName: string; date: string; fights: NormalizedMMAFight[] }>);

    return NextResponse.json({
      success: true,
      events: Object.values(eventGroups),
      fights: normalizedFights,
      total: normalizedFights.length,
    });
  } catch (error) {
    console.error('MMA fights API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MMA fights' },
      { status: 500 }
    );
  }
}
