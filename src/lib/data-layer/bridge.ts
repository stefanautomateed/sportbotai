/**
 * Data Layer Bridge
 * 
 * This module bridges the old sports-api.ts functions with the new DataLayer.
 * Use this for gradual migration - new code should use DataLayer directly.
 */

import { getDataLayer } from './index';
import type { Sport, EnrichedMatchData } from './types';

// Map sport string identifiers to Sport type
const SPORT_MAP: Record<string, Sport> = {
  'soccer': 'soccer',
  'football': 'soccer',
  'basketball': 'basketball',
  'basketball_nba': 'basketball',
  'nba': 'basketball',
  'hockey': 'hockey',
  'icehockey': 'hockey',
  'nhl': 'hockey',
  'americanfootball': 'american_football',
  'american_football': 'american_football',
  'nfl': 'american_football',
};

/**
 * Convert sport string to normalized Sport type
 */
export function normalizeSport(sport: string): Sport {
  const lower = sport.toLowerCase();
  return SPORT_MAP[lower] || 'soccer';
}

/**
 * Get enriched match data using the new DataLayer
 * This is a drop-in replacement for getMultiSportEnrichedData
 */
export async function getEnrichedMatchDataV2(
  homeTeam: string,
  awayTeam: string,
  sport: string,
  league?: string
): Promise<{
  sport: string;
  homeForm: Array<{ result: string; opponent: string; score: string; date: string }> | null;
  awayForm: Array<{ result: string; opponent: string; score: string; date: string }> | null;
  headToHead: Array<{ homeTeam: string; awayTeam: string; homeScore: number; awayScore: number; date: string }> | null;
  h2hSummary: { totalMatches: number; homeWins: number; awayWins: number; draws: number } | null;
  homeStats: { goalsScored: number; goalsConceded: number; wins: number; losses: number; draws?: number } | null;
  awayStats: { goalsScored: number; goalsConceded: number; wins: number; losses: number; draws?: number } | null;
  dataSource: string;
}> {
  const dataLayer = getDataLayer();
  const normalizedSport = normalizeSport(sport);
  
  try {
    const result = await dataLayer.getEnrichedMatchData(
      normalizedSport,
      homeTeam,
      awayTeam,
      {
        includeStats: true,
        includeRecentGames: true,
        includeH2H: true,
        includeInjuries: false, // Not used in old format
        recentGamesLimit: 5,
        h2hLimit: 10,
      }
    );
    
    if (!result.success || !result.data) {
      console.log(`[DataLayer] Failed to fetch data for ${homeTeam} vs ${awayTeam}:`, result.error);
      return createEmptyResponse(sport);
    }
    
    const data = result.data;
    
    // Transform to old format for backward compatibility
    return {
      sport: normalizedSport,
      
      homeForm: data.homeTeam.recentGames?.games.map(game => {
        const isHome = game.homeTeam.externalId === data.homeTeam.team.externalId;
        const teamScore = isHome ? game.score?.home : game.score?.away;
        const oppScore = isHome ? game.score?.away : game.score?.home;
        const opponent = isHome ? game.awayTeam.name : game.homeTeam.name;
        
        let result: 'W' | 'L' | 'D' = 'D';
        if (teamScore !== undefined && oppScore !== undefined) {
          if (teamScore > oppScore) result = 'W';
          else if (teamScore < oppScore) result = 'L';
        }
        
        return {
          result,
          opponent,
          score: `${teamScore || 0}-${oppScore || 0}`,
          date: game.date.toISOString(),
        };
      }) || null,
      
      awayForm: data.awayTeam.recentGames?.games.map(game => {
        const isHome = game.homeTeam.externalId === data.awayTeam.team.externalId;
        const teamScore = isHome ? game.score?.home : game.score?.away;
        const oppScore = isHome ? game.score?.away : game.score?.home;
        const opponent = isHome ? game.awayTeam.name : game.homeTeam.name;
        
        let result: 'W' | 'L' | 'D' = 'D';
        if (teamScore !== undefined && oppScore !== undefined) {
          if (teamScore > oppScore) result = 'W';
          else if (teamScore < oppScore) result = 'L';
        }
        
        return {
          result,
          opponent,
          score: `${teamScore || 0}-${oppScore || 0}`,
          date: game.date.toISOString(),
        };
      }) || null,
      
      headToHead: data.h2h?.matches.map(match => ({
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        homeScore: match.score?.home || 0,
        awayScore: match.score?.away || 0,
        date: match.date.toISOString(),
      })) || null,
      
      h2hSummary: data.h2h ? {
        totalMatches: data.h2h.summary.totalGames,
        homeWins: data.h2h.summary.team1Wins,
        awayWins: data.h2h.summary.team2Wins,
        draws: data.h2h.summary.draws,
      } : null,
      
      homeStats: data.homeTeam.stats ? {
        goalsScored: data.homeTeam.stats.scoring.totalFor,
        goalsConceded: data.homeTeam.stats.scoring.totalAgainst,
        wins: data.homeTeam.stats.record.wins,
        losses: data.homeTeam.stats.record.losses,
        draws: data.homeTeam.stats.record.draws,
      } : null,
      
      awayStats: data.awayTeam.stats ? {
        goalsScored: data.awayTeam.stats.scoring.totalFor,
        goalsConceded: data.awayTeam.stats.scoring.totalAgainst,
        wins: data.awayTeam.stats.record.wins,
        losses: data.awayTeam.stats.record.losses,
        draws: data.awayTeam.stats.record.draws,
      } : null,
      
      dataSource: 'DATA_LAYER',
    };
    
  } catch (error) {
    console.error(`[DataLayer] Error fetching data:`, error);
    return createEmptyResponse(sport);
  }
}

function createEmptyResponse(sport: string) {
  return {
    sport,
    homeForm: null,
    awayForm: null,
    headToHead: null,
    h2hSummary: null,
    homeStats: null,
    awayStats: null,
    dataSource: 'UNAVAILABLE',
  };
}

/**
 * Type guard to check if DataLayer is available for a sport
 */
export function isDataLayerAvailable(sport: string): boolean {
  const dataLayer = getDataLayer();
  const normalizedSport = normalizeSport(sport);
  return dataLayer.isSportAvailable(normalizedSport);
}

/**
 * Get full enriched data using DataLayer (new format)
 * Use this for new code that doesn't need backward compatibility
 */
export async function getFullEnrichedData(
  homeTeam: string,
  awayTeam: string,
  sport: Sport
): Promise<EnrichedMatchData | null> {
  const dataLayer = getDataLayer();
  
  const result = await dataLayer.getEnrichedMatchData(
    sport,
    homeTeam,
    awayTeam,
    {
      includeStats: true,
      includeRecentGames: true,
      includeH2H: true,
      includeInjuries: true,
      recentGamesLimit: 5,
      h2hLimit: 10,
    }
  );
  
  return result.success ? result.data || null : null;
}
