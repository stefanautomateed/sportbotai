/**
 * Unified Cache Refresh Cron Job
 * 
 * Proactively refreshes caches to ensure fresh data for users.
 * Runs as a background job, never blocks user-facing routes.
 * 
 * FEATURES:
 * - Prefetches upcoming matches (next 24h)
 * - Re-validates stale cache entries
 * - Reports cache health metrics
 * - Circuit breaker health check
 * 
 * SCHEDULE: Run every 30 minutes via Vercel Cron
 * Add to vercel.json: crons array with path and schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, CACHE_TTL, CACHE_KEYS } from '@/lib/cache';
import { getUnifiedMatchData, type MatchIdentifier } from '@/lib/unified-match-service';
import { getCircuitHealth, apiSportsBreaker, oddsApiBreaker } from '@/lib/resilience';
import { theOddsClient } from '@/lib/theOdds';

// ============================================
// CONFIG
// ============================================

const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret';
const MAX_MATCHES_PER_RUN = 20; // Limit to avoid timeout
const STALE_THRESHOLD_HOURS = 2; // Consider cache stale after this
const REFRESH_TIMEOUT_MS = 8000; // Per-match timeout

// Sports to prefetch (high-traffic)
const PRIORITY_SPORTS = [
  'soccer_epl',
  'soccer_spain_la_liga',
  'soccer_germany_bundesliga',
  'soccer_italy_serie_a',
  'basketball_nba',
  'icehockey_nhl',
  'americanfootball_nfl',
];

// ============================================
// TYPES
// ============================================

interface RefreshResult {
  match: string;
  status: 'refreshed' | 'skipped' | 'failed';
  reason?: string;
  latencyMs?: number;
  dataQuality?: string;
}

interface CronResponse {
  success: boolean;
  timestamp: string;
  duration: number;
  
  // Refresh stats
  matchesProcessed: number;
  refreshed: number;
  skipped: number;
  failed: number;
  
  // Cache health
  cacheHealth: {
    staleEntries: number;
    totalEntries: number;
    healthScore: number; // 0-100
  };
  
  // Circuit breaker status
  circuitHealth: {
    healthy: boolean;
    openCircuits: string[];
  };
  
  // Details
  results: RefreshResult[];
  errors: string[];
}

// ============================================
// HELPERS
// ============================================

async function getUpcomingMatches(): Promise<MatchIdentifier[]> {
  const matches: MatchIdentifier[] = [];
  
  // 1. Get matches from upcoming predictions
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const predictions = await prisma.prediction.findMany({
      where: {
        kickoff: {
          gte: now,
          lte: in24Hours,
        },
        outcome: 'PENDING',
      },
      select: {
        matchName: true,
        sport: true,
        league: true,
        kickoff: true,
      },
      take: MAX_MATCHES_PER_RUN,
      orderBy: { kickoff: 'asc' },
    });
    
    for (const pred of predictions) {
      // Parse matchName "Home vs Away"
      const parts = pred.matchName.split(' vs ');
      if (parts.length === 2) {
        matches.push({
          homeTeam: parts[0].trim(),
          awayTeam: parts[1].trim(),
          sport: pred.sport || 'soccer',
          league: pred.league || undefined,
          kickoff: pred.kickoff?.toISOString(),
        });
      }
    }
    
    console.log(`[Refresh] Found ${predictions.length} upcoming predictions`);
  } catch (error) {
    console.error('[Refresh] Failed to fetch predictions:', error);
  }
  
  // 2. Also fetch from The Odds API for priority sports (if we have capacity)
  if (matches.length < MAX_MATCHES_PER_RUN && theOddsClient.isConfigured()) {
    try {
      for (const sport of PRIORITY_SPORTS.slice(0, 3)) { // Limit API calls
        if (matches.length >= MAX_MATCHES_PER_RUN) break;
        
        const eventsResponse = await theOddsClient.getEvents(sport);
        const events = eventsResponse.data || [];
        
        // Add first few events from each sport
        for (const event of events.slice(0, 3)) {
          if (matches.length >= MAX_MATCHES_PER_RUN) break;
          
          // Skip if we already have this match
          const exists = matches.some(
            m => m.homeTeam === event.home_team && m.awayTeam === event.away_team
          );
          
          if (!exists) {
            matches.push({
              homeTeam: event.home_team,
              awayTeam: event.away_team,
              sport,
              kickoff: event.commence_time,
            });
          }
        }
      }
    } catch (error) {
      console.error('[Refresh] Failed to fetch events:', error);
    }
  }
  
  return matches;
}

async function refreshMatch(match: MatchIdentifier): Promise<RefreshResult> {
  const matchLabel = `${match.homeTeam} vs ${match.awayTeam}`;
  const startTime = Date.now();
  
  try {
    // Use a timeout to prevent long-running refreshes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
    
    // Force refresh (skip cache)
    const result = await getUnifiedMatchData(match, { skipCache: true });
    
    clearTimeout(timeoutId);
    
    return {
      match: matchLabel,
      status: 'refreshed',
      latencyMs: Date.now() - startTime,
      dataQuality: result.metadata?.dataQuality || result.analysis?.dataQuality || 'UNKNOWN',
    };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return {
      match: matchLabel,
      status: 'failed',
      reason: isTimeout ? 'Timeout' : (error instanceof Error ? error.message : 'Unknown error'),
      latencyMs: Date.now() - startTime,
    };
  }
}

function assessCacheHealth(results: RefreshResult[]): {
  staleEntries: number;
  totalEntries: number;
  healthScore: number;
} {
  const total = results.length;
  const failed = results.filter(r => r.status === 'failed').length;
  const lowQuality = results.filter(r => r.dataQuality === 'LOW' || r.dataQuality === 'INSUFFICIENT').length;
  
  // Health score: 100 if all refreshed with high quality, lower for failures/low quality
  const successRate = total > 0 ? (total - failed) / total : 1;
  const qualityRate = total > 0 ? (total - lowQuality) / total : 1;
  const healthScore = Math.round((successRate * 0.6 + qualityRate * 0.4) * 100);
  
  return {
    staleEntries: failed + lowQuality,
    totalEntries: total,
    healthScore,
  };
}

// ============================================
// MAIN HANDLER
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse<CronResponse>> {
  const startTime = Date.now();
  const errors: string[] = [];
  const results: RefreshResult[] = [];
  
  // Verify cron secret
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('x-cron-secret');
  
  if (secret !== CRON_SECRET) {
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      duration: 0,
      matchesProcessed: 0,
      refreshed: 0,
      skipped: 0,
      failed: 0,
      cacheHealth: { staleEntries: 0, totalEntries: 0, healthScore: 0 },
      circuitHealth: { healthy: false, openCircuits: [] },
      results: [],
      errors: ['Unauthorized'],
    } as CronResponse, { status: 401 });
  }
  
  console.log('[Refresh] Starting unified cache refresh...');
  
  // 1. Check circuit breaker health first
  const circuitHealth = getCircuitHealth();
  if (!circuitHealth.healthy) {
    const openCircuits = Object.entries(circuitHealth.circuits)
      .filter(([_, c]) => c.state === 'OPEN')
      .map(([name]) => name);
    console.log(`[Refresh] Warning: ${openCircuits.length} circuits open:`, openCircuits);
  }
  
  // 2. Get upcoming matches to refresh
  let matches: MatchIdentifier[] = [];
  try {
    matches = await getUpcomingMatches();
    console.log(`[Refresh] Found ${matches.length} matches to refresh`);
  } catch (error) {
    errors.push(`Failed to get upcoming matches: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
  
  // 3. Refresh each match (with rate limiting)
  for (const match of matches) {
    // Small delay between refreshes to avoid overwhelming APIs
    if (results.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const result = await refreshMatch(match);
    results.push(result);
    
    if (result.status === 'failed') {
      errors.push(`${result.match}: ${result.reason}`);
    }
  }
  
  // 4. Assess cache health
  const cacheHealth = assessCacheHealth(results);
  
  // 5. Build response
  const refreshed = results.filter(r => r.status === 'refreshed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  const response: CronResponse = {
    success: true,
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime,
    matchesProcessed: matches.length,
    refreshed,
    skipped,
    failed,
    cacheHealth,
    circuitHealth: {
      healthy: circuitHealth.healthy,
      openCircuits: Object.entries(circuitHealth.circuits)
        .filter(([_, c]) => c.state === 'OPEN')
        .map(([name]) => name),
    },
    results,
    errors,
  };
  
  console.log(`[Refresh] Complete: ${refreshed}/${matches.length} refreshed, ${failed} failed, health=${cacheHealth.healthScore}%`);
  
  return NextResponse.json(response);
}

// ============================================
// VERCEL CRON CONFIG
// ============================================

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for cron
