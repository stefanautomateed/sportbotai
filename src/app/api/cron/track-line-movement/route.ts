/**
 * Line Movement Tracking Cron Job
 * 
 * Detects sharp line movements (3%+ probability shifts) and sends alerts.
 * Sharp moves indicate professional bettor action - valuable signal for predictions.
 * 
 * Schedule: Every 30 minutes (0,30 * * * *)
 * 
 * Process:
 * 1. Find upcoming matches (next 24-48 hours)
 * 2. Fetch current odds from The Odds API
 * 3. Compare with opening/last snapshot
 * 4. Flag sharp moves (3%+ shift in implied probability)
 * 5. Store for analysis and optional alerting
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { theOddsClient } from '@/lib/theOdds';

export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;

// Threshold for "sharp move" detection
const SHARP_MOVE_THRESHOLD = 3.0; // 3% probability shift

interface LineMovementResult {
  matchId: string;
  matchName: string;
  sport: string;
  openingHome: number;
  currentHome: number;
  homeMovement: number;
  isSharpMove: boolean;
  sharpSide: string | null;
}

/**
 * Convert decimal odds to implied probability
 */
function oddsToProb(odds: number): number {
  if (odds <= 1) return 0;
  return 1 / odds;
}

/**
 * Calculate movement percentage
 */
function calculateMovement(opening: number, current: number): number {
  const openingProb = oddsToProb(opening);
  const currentProb = oddsToProb(current);
  // Movement in probability points (e.g., 52% -> 55% = +3%)
  return (currentProb - openingProb) * 100;
}

/**
 * Detect if movement is sharp (professional money)
 */
function detectSharpMove(
  homeMovement: number,
  awayMovement: number,
  drawMovement: number | null
): { isSharp: boolean; side: string | null } {
  // Sharp move threshold: 3% or more shift
  if (Math.abs(homeMovement) >= SHARP_MOVE_THRESHOLD) {
    return {
      isSharp: true,
      side: homeMovement > 0 ? 'home' : 'away', // If home prob increased, money on home
    };
  }
  
  if (Math.abs(awayMovement) >= SHARP_MOVE_THRESHOLD) {
    return {
      isSharp: true,
      side: awayMovement > 0 ? 'away' : 'home',
    };
  }
  
  if (drawMovement !== null && Math.abs(drawMovement) >= SHARP_MOVE_THRESHOLD) {
    return {
      isSharp: true,
      side: drawMovement > 0 ? 'draw' : 'sides', // Money on draw vs sides
    };
  }
  
  return { isSharp: false, side: null };
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret') || request.headers.get('x-cron-secret');
    
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const startTime = Date.now();
    console.log('[Line-Movement] Starting line movement tracking...');
    
    // Get all sports with upcoming events
    const sports = [
      'soccer_epl',
      'soccer_italy_serie_a',
      'soccer_spain_la_liga',
      'soccer_germany_bundesliga',
      'soccer_france_ligue_one',
      'basketball_nba',
      'basketball_euroleague',
      'icehockey_nhl',
      'americanfootball_nfl',
    ];
    
    const results: LineMovementResult[] = [];
    let processed = 0;
    let sharpMoves = 0;
    let errors = 0;
    
    for (const sportKey of sports) {
      try {
        // Fetch current odds
        const { data } = await theOddsClient.getOddsForSport(sportKey, {
          regions: ['eu', 'uk'],
          markets: ['h2h'],
        });
        
        if (!data || data.length === 0) continue;
        
        for (const event of data) {
          try {
            // Get or create line movement record
            const matchId = event.id;
            const matchName = `${event.home_team} vs ${event.away_team}`;
            const kickoff = new Date(event.commence_time);
            
            // Only track games 48 hours or less out
            const hoursUntilKickoff = (kickoff.getTime() - Date.now()) / (1000 * 60 * 60);
            if (hoursUntilKickoff > 48 || hoursUntilKickoff < 0) continue;
            
            // Get best available odds (prefer Pinnacle)
            const pinnacle = event.bookmakers?.find(b => b.key === 'pinnacle');
            const bookmaker = pinnacle || event.bookmakers?.[0];
            
            if (!bookmaker?.markets?.[0]?.outcomes) continue;
            
            const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
            if (!h2hMarket?.outcomes) continue;
            
            const homeOutcome = h2hMarket.outcomes.find(o => 
              o.name.toLowerCase() === event.home_team.toLowerCase()
            );
            const awayOutcome = h2hMarket.outcomes.find(o => 
              o.name.toLowerCase() === event.away_team.toLowerCase()
            );
            const drawOutcome = h2hMarket.outcomes.find(o => 
              o.name.toLowerCase() === 'draw'
            );
            
            if (!homeOutcome || !awayOutcome) continue;
            
            const currentHome = homeOutcome.price;
            const currentAway = awayOutcome.price;
            const currentDraw = drawOutcome?.price;
            
            // Check for existing record
            const existing = await prisma.lineMovement.findUnique({
              where: { matchId },
            });
            
            if (existing) {
              // Calculate movement from opening
              const homeMovement = calculateMovement(existing.openingHome, currentHome);
              const awayMovement = calculateMovement(existing.openingAway, currentAway);
              const drawMovement = existing.openingDraw && currentDraw 
                ? calculateMovement(existing.openingDraw, currentDraw) 
                : null;
              
              // Detect sharp moves
              const sharpDetection = detectSharpMove(homeMovement, awayMovement, drawMovement);
              
              // Update record
              await prisma.lineMovement.update({
                where: { matchId },
                data: {
                  currentHome,
                  currentAway,
                  currentDraw: currentDraw || undefined,
                  updatedTime: new Date(),
                  homeMovement,
                  awayMovement,
                  drawMovement: drawMovement || undefined,
                  isSharpMove: sharpDetection.isSharp,
                  sharpSide: sharpDetection.side,
                },
              });
              
              if (sharpDetection.isSharp && !existing.alertSent) {
                sharpMoves++;
                console.log(`[Line-Movement] ⚡ SHARP MOVE: ${matchName} - ${sharpDetection.side} side moved ${homeMovement.toFixed(1)}%`);
                
                // Mark alert as sent (could integrate with notification system)
                await prisma.lineMovement.update({
                  where: { matchId },
                  data: { alertSent: true, alertSentAt: new Date() },
                });
              }
              
              results.push({
                matchId,
                matchName,
                sport: sportKey,
                openingHome: existing.openingHome,
                currentHome,
                homeMovement,
                isSharpMove: sharpDetection.isSharp,
                sharpSide: sharpDetection.side,
              });
              
            } else {
              // Create new record with opening snapshot
              await prisma.lineMovement.create({
                data: {
                  matchId,
                  matchName,
                  sport: sportKey,
                  league: sportKey.split('_').slice(1).join(' '),
                  kickoff,
                  openingHome: currentHome,
                  openingAway: currentAway,
                  openingDraw: currentDraw,
                  openingTime: new Date(),
                  currentHome,
                  currentAway,
                  currentDraw,
                  updatedTime: new Date(),
                  homeMovement: 0,
                  awayMovement: 0,
                  drawMovement: 0,
                },
              });
              
              console.log(`[Line-Movement] 📝 New tracking: ${matchName}`);
            }
            
            processed++;
            
          } catch (eventError) {
            console.error(`[Line-Movement] Error processing event:`, eventError);
            errors++;
          }
        }
        
        // Rate limit between sports
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (sportError) {
        console.error(`[Line-Movement] Error processing ${sportKey}:`, sportError);
        errors++;
      }
    }
    
    // Cleanup old records (matches already kicked off)
    const cleaned = await prisma.lineMovement.deleteMany({
      where: {
        kickoff: { lt: new Date() },
      },
    });
    
    console.log(`[Line-Movement] Completed in ${Date.now() - startTime}ms`);
    console.log(`[Line-Movement] Summary: ${processed} processed, ${sharpMoves} sharp moves, ${cleaned.count} cleaned up`);
    
    return NextResponse.json({
      success: true,
      processed,
      sharpMoves,
      errors,
      cleanedUp: cleaned.count,
      duration: Date.now() - startTime,
      results: results.filter(r => r.isSharpMove), // Only return sharp moves
    });
    
  } catch (error) {
    console.error('[Line-Movement] Error:', error);
    return NextResponse.json(
      { error: 'Line movement tracking failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
