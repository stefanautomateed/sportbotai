/**
 * Backfill predictions from recent analyses
 * Takes finished matches from Analysis table, checks results, creates Prediction records with outcomes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_KEY = process.env.API_FOOTBALL_KEY || '5e73f01586e0b0d7a097aae7c0c3ef1e';

interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  completed: boolean;
}

function getSeasonForDate(dateStr: string, isNFL: boolean = false): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  if (isNFL) {
    return String(year);
  }
  
  if (month >= 10) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

async function fetchNBAResult(dateStr: string, searchHome: string, searchAway: string): Promise<MatchResult | null> {
  try {
    const season = getSeasonForDate(dateStr);
    const response = await fetch(
      `https://v1.basketball.api-sports.io/games?date=${dateStr}&league=12&season=${season}`,
      {
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'v1.basketball.api-sports.io',
        },
      }
    );
    
    const data = await response.json();
    const games = data.response || [];
    
    for (const game of games) {
      const home = game.teams?.home?.name?.toLowerCase() || '';
      const away = game.teams?.away?.name?.toLowerCase() || '';
      const status = game.status?.short || '';
      
      if (!['FT', 'AOT', 'AP'].includes(status)) continue;
      
      if (
        (home.includes(searchHome) || searchHome.includes(home)) &&
        (away.includes(searchAway) || searchAway.includes(away))
      ) {
        return {
          homeTeam: game.teams.home.name,
          awayTeam: game.teams.away.name,
          homeScore: game.scores?.home?.total ?? 0,
          awayScore: game.scores?.away?.total ?? 0,
          completed: true,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('NBA API error:', error);
    return null;
  }
}

async function fetchNHLResult(dateStr: string, searchHome: string, searchAway: string): Promise<MatchResult | null> {
  try {
    const season = getSeasonForDate(dateStr);
    const response = await fetch(
      `https://v1.hockey.api-sports.io/games?date=${dateStr}&league=57&season=${season}`,
      {
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'v1.hockey.api-sports.io',
        },
      }
    );
    
    const data = await response.json();
    const games = data.response || [];
    
    for (const game of games) {
      const home = game.teams?.home?.name?.toLowerCase() || '';
      const away = game.teams?.away?.name?.toLowerCase() || '';
      const status = game.status?.short || '';
      
      if (!['FT', 'AOT', 'AP'].includes(status)) continue;
      
      if (
        (home.includes(searchHome) || searchHome.includes(home)) &&
        (away.includes(searchAway) || searchAway.includes(away))
      ) {
        return {
          homeTeam: game.teams.home.name,
          awayTeam: game.teams.away.name,
          homeScore: game.scores?.home ?? 0,
          awayScore: game.scores?.away ?? 0,
          completed: true,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('NHL API error:', error);
    return null;
  }
}

async function fetchNFLResult(dateStr: string, searchHome: string, searchAway: string): Promise<MatchResult | null> {
  try {
    const season = getSeasonForDate(dateStr, true);
    const response = await fetch(
      `https://v1.american-football.api-sports.io/games?date=${dateStr}&league=1&season=${season}`,
      {
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'v1.american-football.api-sports.io',
        },
      }
    );
    
    const data = await response.json();
    const games = data.response || [];
    
    for (const game of games) {
      const home = game.teams?.home?.name?.toLowerCase() || '';
      const away = game.teams?.away?.name?.toLowerCase() || '';
      const status = game.game?.status?.short || '';
      
      if (!['FT', 'AOT', 'AP', 'POST'].includes(status)) continue;
      
      if (
        (home.includes(searchHome) || searchHome.includes(home)) &&
        (away.includes(searchAway) || searchAway.includes(away))
      ) {
        return {
          homeTeam: game.teams.home.name,
          awayTeam: game.teams.away.name,
          homeScore: game.scores?.home?.total ?? 0,
          awayScore: game.scores?.away?.total ?? 0,
          completed: true,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('NFL API error:', error);
    return null;
  }
}

function determineOutcome(prediction: string, result: MatchResult): 'HIT' | 'MISS' | 'PUSH' {
  const homeWon = result.homeScore > result.awayScore;
  const awayWon = result.awayScore > result.homeScore;
  const draw = result.homeScore === result.awayScore;
  
  const predLower = prediction.toLowerCase();
  
  if (predLower === 'home' && homeWon) return 'HIT';
  if (predLower === 'away' && awayWon) return 'HIT';
  if (predLower === 'draw' && draw) return 'HIT';
  if ((predLower === 'home' || predLower === 'away') && draw) return 'PUSH';
  
  return 'MISS';
}

async function main() {
  const now = new Date();
  
  // Find analyses with past matchDate and a bestValueSide prediction
  const analyses = await prisma.analysis.findMany({
    where: {
      matchDate: {
        lt: now,
        gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Last 2 days
      },
      bestValueSide: {
        not: null,
      },
    },
    orderBy: { matchDate: 'desc' },
    distinct: ['homeTeam', 'awayTeam', 'matchDate'],
  });
  
  console.log(`Found ${analyses.length} finished analyses with predictions`);
  
  let created = 0;
  let hits = 0;
  let misses = 0;
  
  for (const analysis of analyses) {
    if (!analysis.matchDate || !analysis.bestValueSide) continue;
    
    const matchName = `${analysis.homeTeam} vs ${analysis.awayTeam}`;
    const dateStr = analysis.matchDate.toISOString().split('T')[0];
    const searchHome = analysis.homeTeam.toLowerCase();
    const searchAway = analysis.awayTeam.toLowerCase();
    
    // Check if prediction already exists
    const existing = await prisma.prediction.findFirst({
      where: {
        matchName,
        kickoff: analysis.matchDate,
      },
    });
    
    if (existing) {
      console.log(`  Skip: ${matchName} - already exists`);
      continue;
    }
    
    console.log(`\nChecking: ${matchName} (${dateStr})`);
    
    // Determine sport and fetch result
    const sportLower = analysis.sport.toLowerCase();
    let result: MatchResult | null = null;
    
    if (sportLower.includes('basketball') || sportLower.includes('nba')) {
      console.log('  -> Fetching NBA result...');
      result = await fetchNBAResult(dateStr, searchHome, searchAway);
    } else if (sportLower.includes('hockey') || sportLower.includes('nhl')) {
      console.log('  -> Fetching NHL result...');
      result = await fetchNHLResult(dateStr, searchHome, searchAway);
    } else if (sportLower.includes('football') || sportLower.includes('nfl')) {
      console.log('  -> Fetching NFL result...');
      result = await fetchNFLResult(dateStr, searchHome, searchAway);
    }
    
    if (!result) {
      console.log('  -> No result found (game may not be finished or not found in API)');
      
      // Create as PENDING
      await prisma.prediction.create({
        data: {
          matchId: analysis.id,
          matchName,
          sport: analysis.sport,
          league: analysis.league,
          kickoff: analysis.matchDate,
          type: 'MATCH_RESULT',
          prediction: analysis.bestValueSide === 'home' ? `${analysis.homeTeam} Win` :
                      analysis.bestValueSide === 'away' ? `${analysis.awayTeam} Win` : 'Draw',
          reasoning: `Analysis prediction: ${analysis.bestValueSide} (${analysis.homeWinProb?.toFixed(0)}% / ${analysis.drawProb?.toFixed(0)}% / ${analysis.awayWinProb?.toFixed(0)}%)`,
          conviction: Math.round(Math.max(analysis.homeWinProb || 0, analysis.awayWinProb || 0, analysis.drawProb || 0) / 10),
          odds: null,
          impliedProb: analysis.bestValueSide === 'home' ? analysis.homeWinProb :
                       analysis.bestValueSide === 'away' ? analysis.awayWinProb : analysis.drawProb,
          source: 'MATCH_ANALYSIS',
          outcome: 'PENDING',
        },
      });
      created++;
      continue;
    }
    
    const outcome = determineOutcome(analysis.bestValueSide, result);
    const actualResult = result.homeScore > result.awayScore ? `${result.homeTeam} Win` :
                         result.awayScore > result.homeScore ? `${result.awayTeam} Win` : 'Draw';
    
    console.log(`  -> Result: ${result.homeScore}-${result.awayScore} | Predicted: ${analysis.bestValueSide} | Actual: ${actualResult} | ${outcome}`);
    
    await prisma.prediction.create({
      data: {
        matchId: analysis.id,
        matchName,
        sport: analysis.sport,
        league: analysis.league,
        kickoff: analysis.matchDate,
        type: 'MATCH_RESULT',
        prediction: analysis.bestValueSide === 'home' ? `${analysis.homeTeam} Win` :
                    analysis.bestValueSide === 'away' ? `${analysis.awayTeam} Win` : 'Draw',
        reasoning: `Analysis prediction: ${analysis.bestValueSide} (${analysis.homeWinProb?.toFixed(0)}% / ${analysis.drawProb?.toFixed(0)}% / ${analysis.awayWinProb?.toFixed(0)}%)`,
        conviction: Math.round(Math.max(analysis.homeWinProb || 0, analysis.awayWinProb || 0, analysis.drawProb || 0) / 10),
        odds: null,
        impliedProb: analysis.bestValueSide === 'home' ? analysis.homeWinProb :
                     analysis.bestValueSide === 'away' ? analysis.awayWinProb : analysis.drawProb,
        source: 'MATCH_ANALYSIS',
        outcome,
        actualResult,
        actualScore: `${result.homeScore}-${result.awayScore}`,
        validatedAt: new Date(),
      },
    });
    
    created++;
    if (outcome === 'HIT') hits++;
    if (outcome === 'MISS') misses++;
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Created: ${created} predictions`);
  console.log(`Hits: ${hits}`);
  console.log(`Misses: ${misses}`);
  console.log(`Accuracy: ${hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(1) : 0}%`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
