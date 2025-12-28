/**
 * Morning Briefing Cron Job
 * 
 * DISABLED: Twitter posting is temporarily disabled.
 * 
 * Runs daily at 7:00 AM UTC to post the day's fixture preview to Twitter.
 * Uses The Odds API for football events and API-Sports for basketball.
 * 
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/morning-briefing",
 *     "schedule": "0 7 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { SportBotScheduler } from '@/lib/sportbot-scheduler';
import { getBasketballGames, BASKETBALL_LEAGUES, getCurrentBasketballSeason } from '@/lib/apiSports/basketballClient';
import { theOddsClient } from '@/lib/theOdds/theOddsClient';
import { prisma } from '@/lib/prisma';

// TWITTER POSTING DISABLED
const TWITTER_POSTING_ENABLED = false;

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

// Football leagues to fetch from Odds API
const FOOTBALL_SPORT_KEYS = [
  'soccer_epl',           // Premier League
  'soccer_spain_la_liga', // La Liga
  'soccer_italy_serie_a', // Serie A
  'soccer_germany_bundesliga', // Bundesliga
  'soccer_france_ligue_one',   // Ligue 1
  'soccer_uefa_champs_league', // Champions League
];

export async function GET(request: NextRequest) {
  // Verify authorization - allow Vercel cron OR manual Bearer token
  const authHeader = request.headers.get('authorization');
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const isAuthorized = authHeader === `Bearer ${CRON_SECRET}`;
  
  if (CRON_SECRET && !isVercelCron && !isAuthorized) {
    console.log('[Cron] Unauthorized morning briefing attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron] Starting morning briefing generation...');
  
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    // Fetch today's matches from multiple sources
    const matches: Parameters<typeof SportBotScheduler.generateMorningBriefing>[0] = [];
    
    // Football matches from The Odds API
    for (const sportKey of FOOTBALL_SPORT_KEYS) {
      try {
        const { data: events } = await theOddsClient.getEvents(sportKey);
        
        for (const event of events || []) {
          const kickoff = new Date(event.commence_time);
          
          // Only include today's matches
          if (kickoff.toISOString().split('T')[0] !== todayStr) continue;
          
          matches.push({
            id: event.id,
            homeTeam: event.home_team,
            awayTeam: event.away_team,
            league: sportKey.replace('soccer_', '').replace(/_/g, ' ').toUpperCase(),
            sport: 'football',
            kickoff,
          });
        }
      } catch (err) {
        console.error(`[Cron] Failed to fetch ${sportKey}:`, err);
      }
    }
    
    // Basketball matches (NBA) from API-Sports
    try {
      const dateStr = today.toISOString().split('T')[0];
      const nbaGames = await getBasketballGames(
        BASKETBALL_LEAGUES.NBA,
        getCurrentBasketballSeason(),
        { date: dateStr }
      );
      
      for (const game of nbaGames || []) {
        matches.push({
          id: String(game.id),
          homeTeam: game.teams.home.name,
          awayTeam: game.teams.away.name,
          league: 'NBA',
          sport: 'basketball',
          kickoff: new Date(game.date),
        });
      }
    } catch (err) {
      console.error('[Cron] Failed to fetch NBA games:', err);
    }
    
    // Sort by kickoff time
    matches.sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
    
    console.log(`[Cron] Found ${matches.length} matches for today`);
    
    // Check if Twitter posting is enabled
    if (!TWITTER_POSTING_ENABLED) {
      console.log('[Cron] Morning briefing calculated but Twitter posting is DISABLED');
      return NextResponse.json({
        success: true,
        twitterDisabled: true,
        message: 'Morning briefing calculated but Twitter posting is disabled',
        matchesFound: matches.length,
        matches: matches.map(m => `${m.homeTeam} vs ${m.awayTeam}`),
      });
    }
    
    // Generate and post briefing
    const result = await SportBotScheduler.postMorningBriefing(matches);
    
    if (result.success) {
      console.log('[Cron] Morning briefing posted successfully');
      
      // Log to database
      if (result.tweetIds && result.tweetIds.length > 0) {
        await prisma.twitterPost.create({
          data: {
            tweetId: result.tweetIds[0],
            content: `Morning Briefing - ${todayStr}`,
            category: 'MORNING_BRIEFING',
            threadId: result.tweetIds.length > 1 ? result.tweetIds[0] : null,
            threadPosition: 1,
          },
        });
        
        // Log thread tweets
        for (let i = 1; i < result.tweetIds.length; i++) {
          await prisma.twitterPost.create({
            data: {
              tweetId: result.tweetIds[i],
              content: `Morning Briefing Thread ${i + 1}`,
              category: 'THREAD',
              threadId: result.tweetIds[0],
              threadPosition: i + 1,
            },
          });
        }
      }
      
      return NextResponse.json({
        success: true,
        matchesFound: matches.length,
        tweetsPosted: result.tweetIds?.length || 0,
        tweetIds: result.tweetIds,
      });
    } else {
      console.error('[Cron] Failed to post briefing:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        matchesFound: matches.length,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Cron] Morning briefing error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
