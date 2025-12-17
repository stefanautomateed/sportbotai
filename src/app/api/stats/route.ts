/**
 * Public Stats API
 * 
 * Returns aggregate statistics for the platform
 * Used by LiveStatsCounter component
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  try {
    // Get today's date range (UTC)
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    // Count analyses created today
    const todayCount = await prisma.analysis.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    // Get total all-time analyses
    const totalCount = await prisma.analysis.count();

    // Get total users
    const userCount = await prisma.user.count();

    // Get analyses this week
    const weekStart = new Date(todayStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - 7);
    
    const weekCount = await prisma.analysis.count({
      where: {
        createdAt: {
          gte: weekStart,
          lte: todayEnd
        }
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        analysesToday: todayCount,
        analysesThisWeek: weekCount,
        totalAnalyses: totalCount,
        totalUsers: userCount,
        timestamp: now.toISOString()
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });

  } catch (error) {
    console.error('[Stats API] Error:', error);
    
    // Return fallback data on error
    return NextResponse.json({
      success: false,
      stats: {
        analysesToday: 0,
        analysesThisWeek: 0,
        totalAnalyses: 0,
        totalUsers: 0,
        timestamp: new Date().toISOString()
      },
      error: 'Failed to fetch stats'
    }, { status: 500 });
  }
}
