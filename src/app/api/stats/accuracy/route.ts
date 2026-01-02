/**
 * Accuracy Stats API
 * 
 * Returns prediction accuracy split by model version:
 * - v1 = Legacy model (before Jan 2, 2026)
 * - v2 = New model with improvements
 * 
 * GET /api/stats/accuracy
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // v1 (Legacy) stats
    const v1Total = await prisma.prediction.count({
      where: { modelVersion: 'v1', outcome: { not: 'PENDING' } }
    });
    const v1Hits = await prisma.prediction.count({
      where: { modelVersion: 'v1', outcome: 'HIT' }
    });
    const v1Pending = await prisma.prediction.count({
      where: { modelVersion: 'v1', outcome: 'PENDING' }
    });
    
    // v2 (New) stats
    const v2Total = await prisma.prediction.count({
      where: { modelVersion: 'v2', outcome: { not: 'PENDING' } }
    });
    const v2Hits = await prisma.prediction.count({
      where: { modelVersion: 'v2', outcome: 'HIT' }
    });
    const v2Pending = await prisma.prediction.count({
      where: { modelVersion: 'v2', outcome: 'PENDING' }
    });
    
    // v2 by sport
    const v2BySport = await prisma.$queryRaw`
      SELECT 
        sport,
        COUNT(*) as total,
        SUM(CASE WHEN outcome = 'HIT' THEN 1 ELSE 0 END) as hits
      FROM "Prediction"
      WHERE "modelVersion" = 'v2' AND outcome != 'PENDING'
      GROUP BY sport
      ORDER BY total DESC
    ` as { sport: string; total: bigint; hits: bigint }[];
    
    // v2 by conviction
    const v2ByConviction = await prisma.$queryRaw`
      SELECT 
        conviction,
        COUNT(*) as total,
        SUM(CASE WHEN outcome = 'HIT' THEN 1 ELSE 0 END) as hits
      FROM "Prediction"
      WHERE "modelVersion" = 'v2' AND outcome != 'PENDING'
      GROUP BY conviction
      ORDER BY conviction
    ` as { conviction: number; total: bigint; hits: bigint }[];
    
    // Value bets v2
    const v2ValueTotal = await prisma.prediction.count({
      where: { 
        modelVersion: 'v2', 
        valueBetOutcome: { not: 'PENDING' },
        valueBetSide: { not: null }
      }
    });
    const v2ValueHits = await prisma.prediction.count({
      where: { modelVersion: 'v2', valueBetOutcome: 'HIT' }
    });
    
    return NextResponse.json({
      legacy: {
        label: 'v1 (Legacy - before Jan 2, 2026)',
        resolved: v1Total,
        hits: v1Hits,
        accuracy: v1Total > 0 ? ((v1Hits / v1Total) * 100).toFixed(1) : '0',
        pending: v1Pending,
      },
      current: {
        label: 'v2 (New Model - Jan 2, 2026+)',
        resolved: v2Total,
        hits: v2Hits,
        accuracy: v2Total > 0 ? ((v2Hits / v2Total) * 100).toFixed(1) : '0',
        pending: v2Pending,
      },
      currentBySport: v2BySport.map(s => ({
        sport: s.sport,
        total: Number(s.total),
        hits: Number(s.hits),
        accuracy: Number(s.total) > 0 ? ((Number(s.hits) / Number(s.total)) * 100).toFixed(1) : '0',
      })),
      currentByConviction: v2ByConviction.map(c => ({
        conviction: c.conviction,
        total: Number(c.total),
        hits: Number(c.hits),
        accuracy: Number(c.total) > 0 ? ((Number(c.hits) / Number(c.total)) * 100).toFixed(1) : '0',
      })),
      currentValueBets: {
        total: v2ValueTotal,
        hits: v2ValueHits,
        accuracy: v2ValueTotal > 0 ? ((v2ValueHits / v2ValueTotal) * 100).toFixed(1) : '0',
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('[Accuracy Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accuracy stats' },
      { status: 500 }
    );
  }
}
