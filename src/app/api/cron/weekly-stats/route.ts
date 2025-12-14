/**
 * Weekly Stats Cron Job
 * 
 * Runs every Sunday at 6 PM UTC to post weekly performance stats to Twitter.
 * Shows hit rate, streak, and conviction breakdown.
 * 
 * Vercel Cron: "0 18 * * 0" (Sunday 6 PM UTC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTwitterClient, formatForTwitter } from '@/lib/twitter-client';
import { prisma } from '@/lib/prisma';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log('[Cron] Generating weekly stats...');
  
  try {
    // Get stats from the last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const predictions = await prisma.prediction.findMany({
      where: {
        createdAt: { gte: weekAgo },
        outcome: { not: 'PENDING' },
      },
    });
    
    const hits = predictions.filter(p => p.outcome === 'HIT').length;
    const misses = predictions.filter(p => p.outcome === 'MISS').length;
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;
    
    // Calculate by conviction
    const byConviction: Record<number, { hits: number; total: number }> = {};
    for (let i = 1; i <= 5; i++) {
      const atLevel = predictions.filter(p => p.conviction === i && p.outcome !== 'PUSH' && p.outcome !== 'VOID');
      byConviction[i] = {
        hits: atLevel.filter(p => p.outcome === 'HIT').length,
        total: atLevel.length,
      };
    }
    
    // Calculate current streak
    const sortedPredictions = predictions
      .filter(p => p.outcome === 'HIT' || p.outcome === 'MISS')
      .sort((a, b) => (b.validatedAt?.getTime() || 0) - (a.validatedAt?.getTime() || 0));
    
    let streak = 0;
    let streakType: 'win' | 'loss' | null = null;
    
    for (const p of sortedPredictions) {
      const isHit = p.outcome === 'HIT';
      if (streakType === null) {
        streakType = isHit ? 'win' : 'loss';
        streak = 1;
      } else if ((isHit && streakType === 'win') || (!isHit && streakType === 'loss')) {
        streak++;
      } else {
        break;
      }
    }
    
    // Build tweets
    const tweets: string[] = [];
    
    // Main stats tweet
    tweets.push(formatForTwitter(
      `📊 SportBot Weekly Report\n\n` +
      `Total Calls: ${total}\n` +
      `✅ Hits: ${hits} | ❌ Misses: ${misses}\n` +
      `Hit Rate: ${hitRate.toFixed(1)}%\n\n` +
      `Current Streak: ${streak} ${streakType === 'win' ? '✅' : streakType === 'loss' ? '❌' : ''}`,
      { hashtags: ['SportBot', 'Transparency'] }
    ));
    
    // Conviction breakdown (if we have enough data)
    const convictionLines: string[] = [];
    for (let i = 5; i >= 1; i--) {
      const data = byConviction[i];
      if (data.total > 0) {
        const rate = ((data.hits / data.total) * 100).toFixed(0);
        convictionLines.push(`${'🔥'.repeat(i)} ${rate}% (${data.hits}/${data.total})`);
      }
    }
    
    if (convictionLines.length > 0) {
      tweets.push(formatForTwitter(
        `By Conviction Level:\n\n${convictionLines.join('\n')}\n\nHigher conviction = sharper data signal.`,
        { hashtags: [] }
      ));
    }
    
    // Post to Twitter
    const twitter = getTwitterClient();
    
    if (!twitter.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Twitter not configured',
        stats: { total, hits, misses, hitRate, streak, streakType },
      });
    }
    
    const tweetIds: string[] = [];
    let replyToId: string | undefined;
    
    for (const tweet of tweets) {
      const result = await twitter.postTweet(tweet, replyToId);
      if (result.success && result.tweet) {
        tweetIds.push(result.tweet.id);
        replyToId = result.tweet.id;
        
        // Log to database
        await prisma.twitterPost.create({
          data: {
            tweetId: result.tweet.id,
            content: tweet,
            category: 'WEEKLY_STATS',
            threadId: tweetIds.length > 1 ? tweetIds[0] : null,
            threadPosition: tweetIds.length,
          },
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('[Cron] Weekly stats posted:', tweetIds);
    
    return NextResponse.json({
      success: true,
      stats: { total, hits, misses, hitRate, streak, streakType },
      tweetIds,
    });
    
  } catch (error) {
    console.error('[Cron] Weekly stats error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
