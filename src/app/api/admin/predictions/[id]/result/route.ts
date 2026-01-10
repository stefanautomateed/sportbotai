/**
 * Admin API: Update Prediction Result
 * 
 * PATCH /api/admin/predictions/[id]/result
 * 
 * Allows admins to manually fill in match results for pending predictions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_EMAILS = [
  'gogecmaestrotib92@gmail.com',
  'aiinstamarketing@gmail.com',
  'gogani92@gmail.com',
  'stefan@automateed.com',
  'streamentor@gmail.com',
];

interface UpdateResultBody {
  homeScore: number;
  awayScore: number;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateResultBody = await request.json();
    const { homeScore, awayScore } = body;

    // Validate input
    if (typeof homeScore !== 'number' || typeof awayScore !== 'number') {
      return NextResponse.json({ error: 'Invalid scores' }, { status: 400 });
    }

    if (homeScore < 0 || awayScore < 0) {
      return NextResponse.json({ error: 'Scores cannot be negative' }, { status: 400 });
    }

    // Fetch the prediction
    const prediction = await prisma.prediction.findUnique({
      where: { id },
    });

    if (!prediction) {
      return NextResponse.json({ error: 'Prediction not found' }, { status: 404 });
    }

    // Determine actual result
    let actualResult: 'HOME_WIN' | 'AWAY_WIN' | 'DRAW';
    if (homeScore > awayScore) {
      actualResult = 'HOME_WIN';
    } else if (awayScore > homeScore) {
      actualResult = 'AWAY_WIN';
    } else {
      actualResult = 'DRAW';
    }

    // Determine if prediction was accurate
    const predictionLower = prediction.prediction.toLowerCase();
    const selectionLower = (prediction.selection || '').toLowerCase();
    
    // Extract team names from matchName (e.g., "Arsenal vs Liverpool")
    const matchParts = prediction.matchName.split(' vs ');
    const homeTeamName = matchParts[0]?.toLowerCase().trim() || '';
    const awayTeamName = matchParts[1]?.toLowerCase().trim() || '';
    
    let wasAccurate = false;
    
    // Check main prediction text (e.g., "Home Win", "Away Win", "Draw")
    if (
      (predictionLower.includes('home') && actualResult === 'HOME_WIN') ||
      (predictionLower.includes('away') && actualResult === 'AWAY_WIN') ||
      (predictionLower.includes('draw') && actualResult === 'DRAW')
    ) {
      wasAccurate = true;
    }
    
    // Check selection field - handles "home", "away", "draw" keywords
    if (
      (selectionLower === 'home' && actualResult === 'HOME_WIN') ||
      (selectionLower === 'away' && actualResult === 'AWAY_WIN') ||
      (selectionLower === 'draw' && actualResult === 'DRAW')
    ) {
      wasAccurate = true;
    }
    
    // Check selection field - handles team names (e.g., "Arsenal", "Liverpool")
    if (selectionLower && !['home', 'away', 'draw'].includes(selectionLower)) {
      // Selection is a team name, match it against home/away team
      if (selectionLower === homeTeamName && actualResult === 'HOME_WIN') {
        wasAccurate = true;
      } else if (selectionLower === awayTeamName && actualResult === 'AWAY_WIN') {
        wasAccurate = true;
      } else if (homeTeamName.includes(selectionLower) && actualResult === 'HOME_WIN') {
        // Partial match (e.g., "Montréal Canadiens" contains "montréal")
        wasAccurate = true;
      } else if (awayTeamName.includes(selectionLower) && actualResult === 'AWAY_WIN') {
        wasAccurate = true;
      } else if (selectionLower.includes(homeTeamName) && homeTeamName && actualResult === 'HOME_WIN') {
        // Selection might be longer than matchName team (e.g., "Montréal Canadiens" vs "Montreal")
        wasAccurate = true;
      } else if (selectionLower.includes(awayTeamName) && awayTeamName && actualResult === 'AWAY_WIN') {
        wasAccurate = true;
      }
    }

    const outcome = wasAccurate ? 'HIT' : 'MISS';
    const binaryOutcome = wasAccurate ? 1 : 0;
    const actualScore = `${homeScore}-${awayScore}`;

    // Evaluate value bet outcome if applicable
    let valueBetOutcome: 'HIT' | 'MISS' | null = null;
    let valueBetProfit: number | null = null;

    if (prediction.valueBetSide && prediction.valueBetOdds) {
      const valueBetWinner = prediction.valueBetSide.toUpperCase();
      const valueBetWon = valueBetWinner === actualResult.split('_')[0]; // HOME, AWAY, or DRAW
      
      valueBetOutcome = valueBetWon ? 'HIT' : 'MISS';
      valueBetProfit = valueBetWon ? (prediction.valueBetOdds - 1) : -1;
    }

    // Update the prediction
    const updatedPrediction = await prisma.prediction.update({
      where: { id },
      data: {
        actualResult,
        actualScore,
        outcome,
        binaryOutcome,
        validatedAt: new Date(),
        resultTimestamp: new Date(),
        ...(valueBetOutcome && { valueBetOutcome }),
        ...(valueBetProfit !== null && { valueBetProfit }),
      },
    });

    return NextResponse.json({
      success: true,
      prediction: {
        id: updatedPrediction.id,
        matchName: updatedPrediction.matchName,
        actualScore,
        actualResult,
        outcome,
        binaryOutcome,
        valueBetOutcome,
        valueBetProfit,
      },
    });

  } catch (error) {
    console.error('Error updating prediction result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
