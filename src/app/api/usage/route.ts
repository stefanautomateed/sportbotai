/**
 * API Route: /api/usage
 * 
 * GET - Check user's current usage and limits
 * Returns:
 * - plan: FREE | PRO | PREMIUM
 * - used: number of analyses today
 * - limit: max analyses allowed (or -1 for unlimited)
 * - remaining: analyses left today
 * - canAnalyze: boolean
 * 
 * Use this to check limits BEFORE attempting an analysis.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { canUserAnalyze, PLAN_LIMITS } from '@/lib/auth';

// Force dynamic rendering (uses cookies/auth)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // For unauthenticated users, return FREE plan limits
    if (!token || !token.id) {
      return NextResponse.json({
        authenticated: false,
        plan: 'FREE',
        used: 0,
        limit: PLAN_LIMITS.FREE,
        remaining: 0,
        canAnalyze: false,
        message: 'Please sign in to analyze matches',
      });
    }

    const userId = token.id as string;
    const usageCheck = await canUserAnalyze(userId);

    return NextResponse.json({
      authenticated: true,
      plan: usageCheck.plan,
      used: usageCheck.limit === -1 ? 0 : usageCheck.limit - usageCheck.remaining,
      limit: usageCheck.limit,
      remaining: usageCheck.remaining,
      canAnalyze: usageCheck.allowed,
      message: usageCheck.allowed 
        ? null 
        : `Daily limit reached (${usageCheck.limit} analyses). Upgrade for more.`,
    });
  } catch (error) {
    console.error('Usage check error:', error);
    return NextResponse.json(
      { error: 'Failed to check usage' },
      { status: 500 }
    );
  }
}
