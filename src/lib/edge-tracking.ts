/**
 * Edge Tracking Service
 * 
 * Logs all prediction edges with full model details for A/B testing.
 * Allows comparison of different ensemble weights, situational adjustments, etc.
 * 
 * This is the "lab notebook" for model improvement:
 * - Track what weights/methods we used
 * - Compare against outcomes
 * - Identify which configurations perform best
 */

import { prisma } from '@/lib/prisma';
import { SportType, RawProbabilities, EdgeResult } from './accuracy-core/types';

export interface EdgeTrackingInput {
  predictionId: string;
  matchId: string;
  sport: string;
  league: string;
  kickoff: Date;
  
  // Model probabilities
  ourModelHome: number;
  ourModelAway: number;
  ourModelDraw?: number;
  
  // Market probabilities
  marketHome: number;
  marketAway: number;
  marketDraw?: number;
  
  // Final blended probabilities
  finalHome: number;
  finalAway: number;
  finalDraw?: number;
  
  // Method used
  ensembleMethod?: string;
  
  // Edge identified
  edgeSide: 'home' | 'away' | 'draw';
  edgeValue: number;
  conviction: number;
  
  // Situational factors
  situationalAdj?: number;
  trapGameFlag?: boolean;
}

/**
 * Log an edge for A/B testing
 */
export async function logEdgeTracking(input: EdgeTrackingInput): Promise<string> {
  try {
    const record = await prisma.edgeTracking.create({
      data: {
        predictionId: input.predictionId,
        matchId: input.matchId,
        sport: input.sport,
        league: input.league,
        kickoff: input.kickoff,
        ourModelHome: input.ourModelHome,
        ourModelAway: input.ourModelAway,
        ourModelDraw: input.ourModelDraw,
        marketHome: input.marketHome,
        marketAway: input.marketAway,
        marketDraw: input.marketDraw,
        finalHome: input.finalHome,
        finalAway: input.finalAway,
        finalDraw: input.finalDraw,
        ensembleMethod: input.ensembleMethod || 'default',
        edgeSide: input.edgeSide,
        edgeValue: input.edgeValue,
        conviction: input.conviction,
        situationalAdj: input.situationalAdj || 0,
        trapGameFlag: input.trapGameFlag || false,
      },
    });
    
    return record.id;
  } catch (error) {
    console.error('[EdgeTracking] Failed to log edge:', error);
    throw error;
  }
}

/**
 * Update edge tracking with outcome
 */
export async function updateEdgeOutcome(
  predictionId: string,
  outcome: 'HIT' | 'MISS' | 'PUSH',
  actualResult: string,
  clvPercentage?: number
): Promise<void> {
  try {
    await prisma.edgeTracking.updateMany({
      where: { predictionId },
      data: {
        outcome,
        actualResult,
        clvPercentage,
        beatingMarket: clvPercentage ? clvPercentage > 0 : undefined,
      },
    });
  } catch (error) {
    console.error('[EdgeTracking] Failed to update outcome:', error);
  }
}

/**
 * Get A/B testing stats by ensemble method
 */
export async function getMethodPerformance(): Promise<{
  method: string;
  total: number;
  hits: number;
  accuracy: number;
  avgCLV: number;
  avgEdge: number;
}[]> {
  const results = await prisma.edgeTracking.groupBy({
    by: ['ensembleMethod'],
    where: {
      outcome: { not: 'PENDING' },
    },
    _count: { id: true },
    _avg: { clvPercentage: true, edgeValue: true },
  });
  
  // Get hit counts separately
  const hitCounts = await prisma.edgeTracking.groupBy({
    by: ['ensembleMethod'],
    where: { outcome: 'HIT' },
    _count: { id: true },
  });
  
  const hitMap = new Map(hitCounts.map(h => [h.ensembleMethod, h._count.id]));
  
  return results.map(r => ({
    method: r.ensembleMethod,
    total: r._count.id,
    hits: hitMap.get(r.ensembleMethod) || 0,
    accuracy: r._count.id > 0 ? ((hitMap.get(r.ensembleMethod) || 0) / r._count.id) * 100 : 0,
    avgCLV: r._avg.clvPercentage || 0,
    avgEdge: r._avg.edgeValue || 0,
  }));
}

/**
 * Get performance by situational adjustment usage
 */
export async function getSituationalPerformance(): Promise<{
  withSituational: { total: number; hits: number; accuracy: number };
  withoutSituational: { total: number; hits: number; accuracy: number };
}> {
  // With situational adjustments
  const withSit = await prisma.edgeTracking.count({
    where: {
      situationalAdj: { not: 0 },
      outcome: { not: 'PENDING' },
    },
  });
  
  const withSitHits = await prisma.edgeTracking.count({
    where: {
      situationalAdj: { not: 0 },
      outcome: 'HIT',
    },
  });
  
  // Without situational adjustments
  const withoutSit = await prisma.edgeTracking.count({
    where: {
      situationalAdj: 0,
      outcome: { not: 'PENDING' },
    },
  });
  
  const withoutSitHits = await prisma.edgeTracking.count({
    where: {
      situationalAdj: 0,
      outcome: 'HIT',
    },
  });
  
  return {
    withSituational: {
      total: withSit,
      hits: withSitHits,
      accuracy: withSit > 0 ? (withSitHits / withSit) * 100 : 0,
    },
    withoutSituational: {
      total: withoutSit,
      hits: withoutSitHits,
      accuracy: withoutSit > 0 ? (withoutSitHits / withoutSit) * 100 : 0,
    },
  };
}

/**
 * Get trap game prediction performance
 */
export async function getTrapGamePerformance(): Promise<{
  trapGames: { total: number; avoided: number; hitRate: number };
  normalGames: { total: number; hitRate: number };
}> {
  // Trap game flagged
  const trapTotal = await prisma.edgeTracking.count({
    where: {
      trapGameFlag: true,
      outcome: { not: 'PENDING' },
    },
  });
  
  const trapHits = await prisma.edgeTracking.count({
    where: {
      trapGameFlag: true,
      outcome: 'HIT',
    },
  });
  
  // Normal games
  const normalTotal = await prisma.edgeTracking.count({
    where: {
      trapGameFlag: false,
      outcome: { not: 'PENDING' },
    },
  });
  
  const normalHits = await prisma.edgeTracking.count({
    where: {
      trapGameFlag: false,
      outcome: 'HIT',
    },
  });
  
  return {
    trapGames: {
      total: trapTotal,
      avoided: trapTotal, // We flag them to reduce conviction
      hitRate: trapTotal > 0 ? (trapHits / trapTotal) * 100 : 0,
    },
    normalGames: {
      total: normalTotal,
      hitRate: normalTotal > 0 ? (normalHits / normalTotal) * 100 : 0,
    },
  };
}

/**
 * Compare model vs market performance
 */
export async function getModelVsMarket(): Promise<{
  modelBetter: number; // Cases where our edge identified winner
  marketBetter: number; // Cases where we were wrong but market was right
  modelEdgeWhenRight: number; // Avg edge when we hit
  modelEdgeWhenWrong: number; // Avg edge when we miss
}> {
  const hits = await prisma.edgeTracking.findMany({
    where: { outcome: 'HIT' },
    select: { edgeValue: true },
  });
  
  const misses = await prisma.edgeTracking.findMany({
    where: { outcome: 'MISS' },
    select: { edgeValue: true },
  });
  
  const avgHitEdge = hits.length > 0 
    ? hits.reduce((sum, h) => sum + h.edgeValue, 0) / hits.length 
    : 0;
    
  const avgMissEdge = misses.length > 0 
    ? misses.reduce((sum, m) => sum + m.edgeValue, 0) / misses.length 
    : 0;
  
  return {
    modelBetter: hits.length,
    marketBetter: misses.length,
    modelEdgeWhenRight: avgHitEdge,
    modelEdgeWhenWrong: avgMissEdge,
  };
}
