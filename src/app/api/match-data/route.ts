/**
 * API Route: /api/match-data
 * 
 * Fetches and processes match data from The Odds API.
 * Returns structured match data ready for analysis.
 * 
 * Endpoints:
 * - GET /api/match-data?sportKey=soccer_epl - Get all events for a sport
 * - GET /api/match-data?sportKey=soccer_epl&eventId=abc123 - Get specific event with odds
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getEvents,
  getOdds,
  getEventOdds,
  calculateAverageOdds,
  oddsToImpliedProbability,
  OddsEvent,
} from '@/lib/odds-api';
import { MatchData, MatchDataResponse } from '@/types';

/**
 * GET /api/match-data
 * 
 * Query params:
 * - sportKey: Required. The sport key (e.g., "soccer_epl")
 * - eventId: Optional. If provided, fetches odds for specific event
 * - includeOdds: Optional. If "true", includes odds with events list (uses quota)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sportKey = searchParams.get('sportKey');
    const eventId = searchParams.get('eventId');
    const includeOdds = searchParams.get('includeOdds') === 'true';

    // Validate API key
    const apiKey = process.env.ODDS_API_KEY;
    if (!apiKey) {
      return NextResponse.json<MatchDataResponse>(
        {
          success: false,
          error: 'ODDS_API_KEY not configured',
        },
        { status: 500 }
      );
    }

    // Validate sport key
    if (!sportKey) {
      return NextResponse.json<MatchDataResponse>(
        {
          success: false,
          error: 'sportKey query parameter is required',
        },
        { status: 400 }
      );
    }

    // If eventId is provided, fetch specific event with full odds
    if (eventId) {
      return await handleSingleEvent(apiKey, sportKey, eventId);
    }

    // Otherwise, fetch all events for the sport
    if (includeOdds) {
      return await handleEventsWithOdds(apiKey, sportKey);
    } else {
      return await handleEventsWithoutOdds(apiKey, sportKey);
    }
  } catch (error) {
    console.error('Error in /api/match-data:', error);
    return NextResponse.json<MatchDataResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle request for a single event with full odds
 */
async function handleSingleEvent(
  apiKey: string,
  sportKey: string,
  eventId: string
): Promise<NextResponse<MatchDataResponse>> {
  try {
    const result = await getEventOdds(apiKey, sportKey, eventId, {
      regions: ['eu', 'uk'],
      markets: ['h2h', 'totals'],
      oddsFormat: 'decimal',
    });

    const event = result.data;
    const matchData = transformEventToMatchData(event, sportKey);

    return NextResponse.json<MatchDataResponse>({
      success: true,
      data: matchData,
      requestsRemaining: result.requestsRemaining,
    });
  } catch (error) {
    // If event not found, return 404
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json<MatchDataResponse>(
        {
          success: false,
          error: `Event ${eventId} not found`,
        },
        { status: 404 }
      );
    }
    throw error;
  }
}

/**
 * Handle request for all events with odds (uses API quota)
 */
async function handleEventsWithOdds(
  apiKey: string,
  sportKey: string
): Promise<NextResponse<MatchDataResponse>> {
  const result = await getOdds(apiKey, sportKey, {
    regions: ['eu'],
    markets: ['h2h'],
    oddsFormat: 'decimal',
  });

  const events = result.data.map((event) =>
    transformEventToMatchData(event, sportKey)
  );

  return NextResponse.json<MatchDataResponse>({
    success: true,
    events,
    requestsRemaining: result.requestsRemaining,
  });
}

/**
 * Handle request for all events without odds (free, no quota)
 */
async function handleEventsWithoutOdds(
  apiKey: string,
  sportKey: string
): Promise<NextResponse<MatchDataResponse>> {
  const result = await getEvents(apiKey, sportKey);

  const events = result.data.map((event) =>
    transformEventToMatchData(event, sportKey)
  );

  return NextResponse.json<MatchDataResponse>({
    success: true,
    events,
    requestsRemaining: result.requestsRemaining,
  });
}

/**
 * Transform raw API event to structured MatchData
 */
function transformEventToMatchData(event: OddsEvent, sportKey: string): MatchData {
  const averageOdds = calculateAverageOdds(event);
  const hasOdds = event.bookmakers && event.bookmakers.length > 0;

  // Extract bookmaker odds
  const bookmakers: MatchData['bookmakers'] = [];
  if (event.bookmakers) {
    for (const bm of event.bookmakers) {
      const h2h = bm.markets.find((m) => m.key === 'h2h');
      if (!h2h) continue;

      const homeOutcome = h2h.outcomes.find((o) => o.name === event.home_team);
      const awayOutcome = h2h.outcomes.find((o) => o.name === event.away_team);
      const drawOutcome = h2h.outcomes.find((o) => o.name === 'Draw');

      if (homeOutcome && awayOutcome) {
        bookmakers.push({
          name: bm.title,
          home: homeOutcome.price,
          draw: drawOutcome?.price ?? null,
          away: awayOutcome.price,
        });
      }
    }
  }

  // Extract over/under odds if available
  let overUnderLine: number | undefined;
  let over: number | undefined;
  let under: number | undefined;

  if (event.bookmakers) {
    for (const bm of event.bookmakers) {
      const totals = bm.markets.find((m) => m.key === 'totals');
      if (totals && totals.outcomes.length >= 2) {
        const overOutcome = totals.outcomes.find((o) => o.name === 'Over');
        const underOutcome = totals.outcomes.find((o) => o.name === 'Under');
        if (overOutcome && underOutcome) {
          overUnderLine = overOutcome.point;
          over = overOutcome.price;
          under = underOutcome.price;
          break; // Use first bookmaker's totals
        }
      }
    }
  }

  // Calculate implied probabilities
  const impliedProbabilities = {
    home: averageOdds.home > 0 ? oddsToImpliedProbability(averageOdds.home) : 0,
    draw: averageOdds.draw ? oddsToImpliedProbability(averageOdds.draw) : null,
    away: averageOdds.away > 0 ? oddsToImpliedProbability(averageOdds.away) : 0,
  };

  // Determine sport name from sport_key
  const sportName = getSportName(sportKey);
  const leagueName = event.sport_title || sportKey;

  return {
    matchId: event.id,
    sport: sportName,
    sportKey: sportKey,
    league: leagueName,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    commenceTime: event.commence_time,
    sourceType: 'API',
    odds: {
      home: averageOdds.home,
      draw: averageOdds.draw,
      away: averageOdds.away,
      overUnderLine,
      over,
      under,
    },
    bookmakers,
    averageOdds,
    impliedProbabilities,
  };
}

/**
 * Get human-readable sport name from sport key
 */
function getSportName(sportKey: string): string {
  if (sportKey.startsWith('soccer')) return 'Soccer';
  if (sportKey.startsWith('basketball')) return 'Basketball';
  if (sportKey.startsWith('tennis')) return 'Tennis';
  if (sportKey.startsWith('icehockey')) return 'Ice Hockey';
  if (sportKey.startsWith('americanfootball')) return 'American Football';
  if (sportKey.startsWith('baseball')) return 'Baseball';
  if (sportKey.startsWith('mma')) return 'MMA';
  if (sportKey.startsWith('boxing')) return 'Boxing';
  if (sportKey.startsWith('cricket')) return 'Cricket';
  if (sportKey.startsWith('rugby')) return 'Rugby';
  return 'Sports';
}
