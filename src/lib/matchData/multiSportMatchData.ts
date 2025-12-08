/**
 * Multi-Sport Match Data Builder
 * 
 * Transforms raw data from different sources (The Odds API, football API)
 * into a unified MatchData structure for analysis.
 */

import { MatchData, SourceType } from '@/types';
import { 
  SportConfig, 
  getSportConfig, 
  getSportTerminology 
} from '@/lib/config/sportsConfig';
import {
  OddsApiEvent,
  calculateAverageOdds,
  extractTotals,
  extractBookmakerOdds,
  oddsToImpliedProbability,
} from '@/lib/theOdds/theOddsClient';

// ============================================
// UNIFIED MATCH DATA BUILDER
// ============================================

/**
 * Build unified MatchData from The Odds API event
 * 
 * @param sportConfig - Sport configuration
 * @param event - Raw event from The Odds API
 * @returns Unified MatchData ready for analysis
 */
export function buildMatchDataFromOddsApiEvent(
  sportConfig: SportConfig,
  event: OddsApiEvent
): MatchData {
  // Calculate average odds across bookmakers
  const avgOdds = calculateAverageOdds(event);
  
  // Extract totals if available
  const totals = extractTotals(event);
  
  // Get all bookmaker odds
  const bookmakerOdds = extractBookmakerOdds(event);
  
  // Calculate implied probabilities
  const impliedProbs = {
    home: avgOdds.home > 0 ? oddsToImpliedProbability(avgOdds.home) : 0,
    draw: avgOdds.draw ? oddsToImpliedProbability(avgOdds.draw) : null,
    away: avgOdds.away > 0 ? oddsToImpliedProbability(avgOdds.away) : 0,
  };

  return {
    matchId: event.id,
    sport: sportConfig.displayName,
    sportKey: sportConfig.oddsApiSportKey,
    league: event.sport_title || sportConfig.displayName,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    commenceTime: event.commence_time,
    sourceType: 'API' as SourceType,
    odds: {
      home: avgOdds.home,
      draw: sportConfig.hasDraw ? avgOdds.draw : null,
      away: avgOdds.away,
      overUnderLine: totals.line ?? undefined,
      over: totals.over ?? undefined,
      under: totals.under ?? undefined,
    },
    bookmakers: bookmakerOdds,
    averageOdds: avgOdds,
    impliedProbabilities: impliedProbs,
  };
}

/**
 * Build basic MatchData from event without odds
 * (For display in event list before user selects)
 */
export function buildBasicMatchDataFromEvent(
  sportConfig: SportConfig,
  event: OddsApiEvent
): MatchData {
  return {
    matchId: event.id,
    sport: sportConfig.displayName,
    sportKey: sportConfig.oddsApiSportKey,
    league: event.sport_title || sportConfig.displayName,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    commenceTime: event.commence_time,
    sourceType: 'API' as SourceType,
    odds: {
      home: 0,
      draw: sportConfig.hasDraw ? null : null,
      away: 0,
    },
    bookmakers: [],
    averageOdds: { home: 0, draw: null, away: 0 },
    impliedProbabilities: { home: 0, draw: null, away: 0 },
  };
}

/**
 * Build MatchData from manual entry
 */
export function buildManualMatchData(input: {
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  oddsHome: number;
  oddsDraw?: number | null;
  oddsAway: number;
  matchDate?: string;
}): MatchData {
  const sportConfig = getSportConfig(input.sport) || getSportConfig('soccer');
  
  // Calculate implied probabilities
  const impliedHome = input.oddsHome > 0 ? oddsToImpliedProbability(input.oddsHome) : 0;
  const impliedDraw = input.oddsDraw && input.oddsDraw > 0 
    ? oddsToImpliedProbability(input.oddsDraw) 
    : null;
  const impliedAway = input.oddsAway > 0 ? oddsToImpliedProbability(input.oddsAway) : 0;

  return {
    matchId: `manual_${Date.now()}`,
    sport: sportConfig?.displayName || input.sport,
    sportKey: sportConfig?.oddsApiSportKey || input.sport.toLowerCase(),
    league: input.league,
    homeTeam: input.homeTeam,
    awayTeam: input.awayTeam,
    commenceTime: input.matchDate || new Date().toISOString(),
    sourceType: 'MANUAL' as SourceType,
    odds: {
      home: input.oddsHome,
      draw: input.oddsDraw ?? null,
      away: input.oddsAway,
    },
    bookmakers: [],
    averageOdds: {
      home: input.oddsHome,
      draw: input.oddsDraw ?? null,
      away: input.oddsAway,
    },
    impliedProbabilities: {
      home: impliedHome,
      draw: impliedDraw,
      away: impliedAway,
    },
  };
}

// ============================================
// SIMPLIFIED EVENT SUMMARY (for list display)
// ============================================

export interface SimplifiedEventSummary {
  eventId: string;
  sport: string;
  sportKey: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  hasOdds: boolean;
}

/**
 * Convert event to simplified summary for list display
 */
export function eventToSimplifiedSummary(
  event: OddsApiEvent,
  sportConfig: SportConfig
): SimplifiedEventSummary {
  return {
    eventId: event.id,
    sport: sportConfig.displayName,
    sportKey: sportConfig.oddsApiSportKey,
    league: event.sport_title || sportConfig.displayName,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    startTime: event.commence_time,
    hasOdds: Boolean(event.bookmakers && event.bookmakers.length > 0),
  };
}

// ============================================
// MULTI-SPORT API RESPONSE TYPES
// ============================================

export interface MultiSportMatchDataResponse {
  success: boolean;
  mode: 'single' | 'list';
  matchData?: MatchData;
  events?: SimplifiedEventSummary[];
  sport?: string;
  sportKey?: string;
  error?: string;
  requestsRemaining?: number;
}

// ============================================
// SPORT-SPECIFIC DATA ENRICHMENT
// ============================================

/**
 * Enrich match data with sport-specific metadata
 * This helps the AI generate more relevant analysis
 */
export function enrichMatchDataForAnalysis(matchData: MatchData): {
  matchData: MatchData;
  sportMetadata: {
    category: string;
    hasDraw: boolean;
    scoringUnit: string;
    matchTerm: string;
    participantTerm: string;
  };
} {
  const terminology = getSportTerminology(matchData.sportKey);
  const config = getSportConfig(matchData.sportKey);

  return {
    matchData,
    sportMetadata: {
      category: config?.category || 'Sports',
      hasDraw: terminology.hasDraw,
      scoringUnit: terminology.scoringUnit,
      matchTerm: terminology.matchTerm,
      participantTerm: terminology.participantTerm,
    },
  };
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate that MatchData has minimum required fields for analysis
 */
export function validateMatchDataForAnalysis(data: MatchData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.homeTeam || data.homeTeam.trim() === '') {
    errors.push('Home team is required');
  }
  if (!data.awayTeam || data.awayTeam.trim() === '') {
    errors.push('Away team is required');
  }
  if (!data.odds || data.odds.home <= 0) {
    errors.push('Valid home odds are required');
  }
  if (!data.odds || data.odds.away <= 0) {
    errors.push('Valid away odds are required');
  }
  if (!data.sport || data.sport.trim() === '') {
    errors.push('Sport is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize match data for safe usage
 */
export function sanitizeMatchData(data: Partial<MatchData>): MatchData {
  return {
    matchId: data.matchId || `match_${Date.now()}`,
    sport: data.sport || 'Unknown',
    sportKey: data.sportKey || 'unknown',
    league: data.league || 'Unknown League',
    homeTeam: data.homeTeam || 'Team A',
    awayTeam: data.awayTeam || 'Team B',
    commenceTime: data.commenceTime || new Date().toISOString(),
    sourceType: data.sourceType || 'MANUAL',
    odds: {
      home: data.odds?.home || 0,
      draw: data.odds?.draw ?? null,
      away: data.odds?.away || 0,
      overUnderLine: data.odds?.overUnderLine,
      over: data.odds?.over,
      under: data.odds?.under,
    },
    bookmakers: data.bookmakers || [],
    averageOdds: data.averageOdds || { home: 0, draw: null, away: 0 },
    impliedProbabilities: data.impliedProbabilities || { home: 0, draw: null, away: 0 },
  };
}
