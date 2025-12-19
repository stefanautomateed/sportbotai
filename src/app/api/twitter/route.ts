/**
 * Twitter Posting API
 * 
 * Manual endpoints to:
 * - Post a tweet
 * - Record and post a prediction
 * - Post a hot take
 * - Get posting stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTwitterClient, formatForTwitter } from '@/lib/twitter-client';

// Force dynamic rendering (uses headers/session)
export const dynamic = 'force-dynamic';
import { SportBotScheduler } from '@/lib/sportbot-scheduler';
import { prisma } from '@/lib/prisma';
import { CallType } from '@prisma/client';

// ============================================
// POST - Create a new tweet/prediction
// ============================================

// Admin emails - only these users can post tweets
const ADMIN_EMAILS = [
  'your-email@example.com', // Replace with actual admin emails
];

export async function POST(request: NextRequest) {
  // Check authentication (admin only)
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check if user is admin by email
  if (!ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    const { action, ...data } = body;
    
    const twitter = getTwitterClient();
    
    switch (action) {
      // Simple tweet
      case 'tweet': {
        const { content, hashtags } = data;
        if (!content) {
          return NextResponse.json({ error: 'Content required' }, { status: 400 });
        }
        
        const formattedContent = formatForTwitter(content, { hashtags });
        const result = await twitter.postTweet(formattedContent);
        
        if (result.success && result.tweet) {
          await prisma.twitterPost.create({
            data: {
              tweetId: result.tweet.id,
              content: formattedContent,
              category: 'HOT_TAKE',
            },
          });
        }
        
        return NextResponse.json(result);
      }
      
      // Thread
      case 'thread': {
        const { tweets } = data;
        if (!tweets || !Array.isArray(tweets) || tweets.length === 0) {
          return NextResponse.json({ error: 'Tweets array required' }, { status: 400 });
        }
        
        const result = await twitter.postThread(tweets);
        
        if (result.success && result.tweets) {
          for (let i = 0; i < result.tweets.length; i++) {
            await prisma.twitterPost.create({
              data: {
                tweetId: result.tweets[i].id,
                content: tweets[i],
                category: i === 0 ? 'HOT_TAKE' : 'THREAD',
                threadId: result.tweets[0].id,
                threadPosition: i + 1,
              },
            });
          }
        }
        
        return NextResponse.json(result);
      }
      
      // Prediction
      case 'prediction': {
        const { 
          matchId, matchName, sport, league, kickoff,
          type, prediction, reasoning, conviction,
          odds, postNow = true 
        } = data;
        
        if (!matchId || !matchName || !prediction || !type) {
          return NextResponse.json({ 
            error: 'Missing required fields: matchId, matchName, prediction, type' 
          }, { status: 400 });
        }
        
        // Create prediction in database
        const dbPrediction = await prisma.prediction.create({
          data: {
            matchId,
            matchName,
            sport: sport || 'football',
            league: league || 'Unknown',
            kickoff: new Date(kickoff || Date.now()),
            type: type as CallType,
            prediction,
            reasoning: reasoning || '',
            conviction: conviction || 3,
            odds,
            impliedProb: odds ? (1 / odds) * 100 : null,
          },
        });
        
        // Post to Twitter if requested
        let tweetId: string | undefined;
        
        if (postNow && twitter.isConfigured()) {
          const content = SportBotScheduler.generateMatchPreview(
            {
              id: matchId,
              homeTeam: matchName.split(' vs ')[0] || matchName,
              awayTeam: matchName.split(' vs ')[1] || '',
              league: league || '',
              sport: sport || 'football',
              kickoff: new Date(kickoff || Date.now()),
            },
            {
              keyFactor: reasoning?.split('.')[0] || 'Data analysis',
              edge: reasoning || 'Pattern detected',
              prediction,
              conviction: conviction || 3,
            }
          );
          
          const result = await twitter.postTweet(content);
          
          if (result.success && result.tweet) {
            tweetId = result.tweet.id;
            
            await prisma.prediction.update({
              where: { id: dbPrediction.id },
              data: { tweetId },
            });
            
            await prisma.twitterPost.create({
              data: {
                tweetId,
                content,
                category: 'MATCH_PREVIEW',
              },
            });
          }
        }
        
        return NextResponse.json({
          success: true,
          prediction: dbPrediction,
          tweetId,
        });
      }
      
      // Hot take
      case 'hot-take': {
        const { topic, take, conviction = 3 } = data;
        
        if (!take) {
          return NextResponse.json({ error: 'Take required' }, { status: 400 });
        }
        
        const content = SportBotScheduler.generateHotTake(topic || '', take, conviction);
        const result = await twitter.postTweet(content);
        
        if (result.success && result.tweet) {
          await prisma.twitterPost.create({
            data: {
              tweetId: result.tweet.id,
              content,
              category: 'HOT_TAKE',
            },
          });
        }
        
        return NextResponse.json(result);
      }
      
      default:
        return NextResponse.json({ 
          error: 'Invalid action. Use: tweet, thread, prediction, hot-take' 
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('[Twitter API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ============================================
// GET - Get posting stats
// ============================================

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';
    
    let startDate: Date;
    switch (period) {
      case 'day':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'week':
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // Get predictions stats
    const predictions = await prisma.prediction.findMany({
      where: {
        createdAt: { gte: startDate },
      },
    });
    
    const hits = predictions.filter(p => p.outcome === 'HIT').length;
    const misses = predictions.filter(p => p.outcome === 'MISS').length;
    const pending = predictions.filter(p => p.outcome === 'PENDING').length;
    const total = hits + misses;
    
    // By conviction
    const byConviction: Record<number, { hits: number; total: number; rate: number }> = {};
    for (let i = 1; i <= 5; i++) {
      const atLevel = predictions.filter(
        p => p.conviction === i && (p.outcome === 'HIT' || p.outcome === 'MISS')
      );
      const levelHits = atLevel.filter(p => p.outcome === 'HIT').length;
      byConviction[i] = {
        hits: levelHits,
        total: atLevel.length,
        rate: atLevel.length > 0 ? (levelHits / atLevel.length) * 100 : 0,
      };
    }
    
    // Get tweet stats
    const tweets = await prisma.twitterPost.findMany({
      where: {
        postedAt: { gte: startDate },
      },
    });
    
    const tweetsByCategory = tweets.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Twitter config status
    const twitter = getTwitterClient();
    
    return NextResponse.json({
      period,
      predictions: {
        total: predictions.length,
        resolved: total,
        hits,
        misses,
        pending,
        hitRate: total > 0 ? ((hits / total) * 100).toFixed(1) : '0',
        byConviction,
      },
      tweets: {
        total: tweets.length,
        byCategory: tweetsByCategory,
      },
      twitterConfigured: twitter.isConfigured(),
    });
    
  } catch (error) {
    console.error('[Twitter API] Stats error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
