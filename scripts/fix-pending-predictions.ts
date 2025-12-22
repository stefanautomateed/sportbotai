/**
 * Fix pending predictions - correct sport types and fetch results
 * 
 * Run with: npx tsx scripts/fix-pending-predictions.ts
 */

import { prisma } from '../src/lib/prisma';

interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  completed: boolean;
}

function getSeasonForDate(dateStr: string, sport: 'nba' | 'nhl' | 'nfl' = 'nba'): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  if (sport === 'nfl') return String(year);
  if (sport === 'nhl') return month >= 10 ? String(year) : String(year - 1);
  return month >= 10 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

async function fetchNBA(dateStr: string, searchHome: string, searchAway: string, apiKey: string): Promise<MatchResult | null> {
  const season = getSeasonForDate(dateStr, 'nba');
  console.log(`  [NBA] Fetching for ${dateStr}, season ${season}`);
  
  const response = await fetch(
    `https://v1.basketball.api-sports.io/games?date=${dateStr}&league=12&season=${season}`,
    { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'v1.basketball.api-sports.io' } }
  );
  if (!response.ok) { console.log(`  [NBA] API error: ${response.status}`); return null; }
  
  const data = await response.json();
  const games = data.response || [];
  console.log(`  [NBA] Found ${games.length} games`);
  
  for (const game of games) {
    const home = game.teams?.home?.name?.toLowerCase() || '';
    const away = game.teams?.away?.name?.toLowerCase() || '';
    const status = game.status?.short || '';
    
    if ((home.includes(searchHome) || searchHome.includes(home.split(' ').pop() || '')) &&
        (away.includes(searchAway) || searchAway.includes(away.split(' ').pop() || ''))) {
      console.log(`  [NBA] Match found: ${game.teams.home.name} vs ${game.teams.away.name}, status: ${status}`);
      if (!['FT', 'AOT', 'AP'].includes(status)) { console.log(`  [NBA] Game not finished`); return null; }
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
}

async function fetchNHL(dateStr: string, searchHome: string, searchAway: string, apiKey: string): Promise<MatchResult | null> {
  const season = getSeasonForDate(dateStr, 'nhl');
  console.log(`  [NHL] Fetching for ${dateStr}, season ${season}`);
  
  const response = await fetch(
    `https://v1.hockey.api-sports.io/games?date=${dateStr}&league=57&season=${season}`,
    { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'v1.hockey.api-sports.io' } }
  );
  if (!response.ok) { console.log(`  [NHL] API error: ${response.status}`); return null; }
  
  const data = await response.json();
  const games = data.response || [];
  console.log(`  [NHL] Found ${games.length} games`);
  
  for (const game of games) {
    const home = game.teams?.home?.name?.toLowerCase() || '';
    const away = game.teams?.away?.name?.toLowerCase() || '';
    const status = game.status?.short || '';
    
    if ((home.includes(searchHome) || searchHome.includes(home.split(' ').pop() || '')) &&
        (away.includes(searchAway) || searchAway.includes(away.split(' ').pop() || ''))) {
      console.log(`  [NHL] Match found: ${game.teams.home.name} vs ${game.teams.away.name}, status: ${status}`);
      if (!['FT', 'AOT', 'AP', 'POST'].includes(status)) { console.log(`  [NHL] Game not finished`); return null; }
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
}

async function fetchNFL(dateStr: string, searchHome: string, searchAway: string, apiKey: string): Promise<MatchResult | null> {
  const season = getSeasonForDate(dateStr, 'nfl');
  console.log(`  [NFL] Fetching for ${dateStr}, season ${season}`);
  
  const response = await fetch(
    `https://v1.american-football.api-sports.io/games?date=${dateStr}&league=1&season=${season}`,
    { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'v1.american-football.api-sports.io' } }
  );
  if (!response.ok) { console.log(`  [NFL] API error: ${response.status}`); return null; }
  
  const data = await response.json();
  const games = data.response || [];
  console.log(`  [NFL] Found ${games.length} games`);
  
  for (const game of games) {
    const home = game.teams?.home?.name?.toLowerCase() || '';
    const away = game.teams?.away?.name?.toLowerCase() || '';
    const status = game.game?.status?.short || '';
    
    if ((home.includes(searchHome) || searchHome.includes(home.split(' ').pop() || '')) &&
        (away.includes(searchAway) || searchAway.includes(away.split(' ').pop() || ''))) {
      console.log(`  [NFL] Match found: ${game.teams.home.name} vs ${game.teams.away.name}, status: ${status}`);
      if (!['FT', 'AOT', 'AP', 'POST'].includes(status)) { console.log(`  [NFL] Game not finished`); return null; }
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
}

async function fetchEuroLeague(dateStr: string, searchHome: string, searchAway: string, apiKey: string): Promise<MatchResult | null> {
  const season = getSeasonForDate(dateStr, 'nba'); // EuroLeague uses same format as NBA
  console.log(`  [EuroLeague] Fetching for ${dateStr}, season ${season}`);
  
  const response = await fetch(
    `https://v1.basketball.api-sports.io/games?date=${dateStr}&league=120&season=${season}`,
    { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'v1.basketball.api-sports.io' } }
  );
  if (!response.ok) { console.log(`  [EuroLeague] API error: ${response.status}`); return null; }
  
  const data = await response.json();
  const games = data.response || [];
  console.log(`  [EuroLeague] Found ${games.length} games`);
  
  for (const game of games) {
    const home = game.teams?.home?.name?.toLowerCase() || '';
    const away = game.teams?.away?.name?.toLowerCase() || '';
    const status = game.status?.short || '';
    
    if ((home.includes(searchHome) || searchHome.includes(home.split(' ').pop() || '')) &&
        (away.includes(searchAway) || searchAway.includes(away.split(' ').pop() || ''))) {
      console.log(`  [EuroLeague] Match found: ${game.teams.home.name} vs ${game.teams.away.name}, status: ${status}`);
      if (!['FT', 'AOT', 'AP'].includes(status)) { console.log(`  [EuroLeague] Game not finished`); return null; }
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
}

async function fetchSoccer(dateStr: string, searchHome: string, searchAway: string, apiKey: string): Promise<MatchResult | null> {
  console.log(`  [Soccer] Fetching for ${dateStr}`);
  
  const response = await fetch(
    `https://v3.football.api-sports.io/fixtures?date=${dateStr}&status=FT`,
    { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'v3.football.api-sports.io' } }
  );
  if (!response.ok) { console.log(`  [Soccer] API error: ${response.status}`); return null; }
  
  const data = await response.json();
  const fixtures = data.response || [];
  console.log(`  [Soccer] Found ${fixtures.length} finished fixtures`);
  
  for (const fixture of fixtures) {
    const home = fixture.teams?.home?.name?.toLowerCase() || '';
    const away = fixture.teams?.away?.name?.toLowerCase() || '';
    
    if ((home.includes(searchHome) || searchHome.includes(home)) &&
        (away.includes(searchAway) || searchAway.includes(away))) {
      console.log(`  [Soccer] Match found: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
      return {
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
        homeScore: fixture.goals?.home ?? 0,
        awayScore: fixture.goals?.away ?? 0,
        completed: true,
      };
    }
  }
  return null;
}

function evaluatePrediction(prediction: string, homeScore: number, awayScore: number): { wasAccurate: boolean; actualResult: string } {
  const predLower = prediction.toLowerCase();
  
  let actualResult: string;
  if (homeScore > awayScore) actualResult = 'Home Win';
  else if (awayScore > homeScore) actualResult = 'Away Win';
  else actualResult = 'Draw';

  const wasAccurate = 
    (predLower.includes('home') && homeScore > awayScore) ||
    (predLower.includes('away') && awayScore > homeScore) ||
    (predLower.includes('draw') && homeScore === awayScore);

  return { wasAccurate, actualResult };
}

async function main() {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    console.error('❌ API_FOOTBALL_KEY not set!');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('FIXING PENDING PREDICTIONS');
  console.log('='.repeat(60));

  // Step 1: Fix sport types for predictions with wrong sport
  console.log('\n📝 Step 1: Fixing sport types...\n');
  
  const wrongSport = await prisma.prediction.findMany({
    where: {
      sport: 'soccer',
      league: { in: ['NBA', 'NHL', 'NFL'] },
    },
  });
  
  console.log(`Found ${wrongSport.length} predictions with wrong sport type`);
  
  for (const pred of wrongSport) {
    let correctSport = 'soccer';
    if (pred.league === 'NBA') correctSport = 'basketball_nba';
    else if (pred.league === 'NHL') correctSport = 'icehockey_nhl';
    else if (pred.league === 'NFL') correctSport = 'americanfootball_nfl';
    
    await prisma.prediction.update({
      where: { id: pred.id },
      data: { sport: correctSport },
    });
    console.log(`  Fixed: ${pred.matchName} → ${correctSport}`);
  }

  // Step 2: Fetch results for pending predictions
  console.log('\n📊 Step 2: Fetching results for pending predictions...\n');
  
  const pending = await prisma.prediction.findMany({
    where: {
      outcome: 'PENDING',
      kickoff: {
        lte: new Date(Date.now() - 3 * 60 * 60 * 1000), // At least 3 hours ago
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Within last week
      },
    },
    orderBy: { kickoff: 'asc' },
  });

  console.log(`Found ${pending.length} pending predictions to check\n`);

  let updated = 0;
  let notFound = 0;

  for (const pred of pending) {
    const [homeTeam, awayTeam] = pred.matchName.split(' vs ').map(t => t.trim());
    if (!homeTeam || !awayTeam) continue;

    console.log(`\n🔍 ${pred.matchName} (${pred.sport} / ${pred.league})`);
    
    const dateStr = pred.kickoff.toISOString().split('T')[0];
    const searchHome = homeTeam.toLowerCase().split(' ').pop() || homeTeam.toLowerCase();
    const searchAway = awayTeam.toLowerCase().split(' ').pop() || awayTeam.toLowerCase();
    
    let result: MatchResult | null = null;
    
    // Detect sport from both sport field and league
    const sportLower = pred.sport?.toLowerCase() || '';
    const leagueLower = pred.league?.toLowerCase() || '';
    
    // EuroLeague detection
    const isEuroLeague = sportLower.includes('euroleague') || leagueLower.includes('euroleague') ||
      ['olympiacos', 'panathinaikos', 'fenerbahce', 'anadolu efes', 'real madrid', 'barcelona', 'maccabi', 'partizan', 'crvena zvezda', 'zalgiris', 'žalgiris', 'virtus', 'baskonia', 'milano', 'asvel', 'bayern munich', 'alba berlin'].some(t => 
        homeTeam.toLowerCase().includes(t) || awayTeam.toLowerCase().includes(t));
    
    if (isEuroLeague) {
      result = await fetchEuroLeague(dateStr, searchHome, searchAway, apiKey);
    } else if (sportLower.includes('basketball') || leagueLower.includes('nba')) {
      result = await fetchNBA(dateStr, searchHome, searchAway, apiKey);
    } else if (sportLower.includes('hockey') || sportLower.includes('icehockey') || leagueLower.includes('nhl')) {
      result = await fetchNHL(dateStr, searchHome, searchAway, apiKey);
    } else if (sportLower.includes('americanfootball') || leagueLower.includes('nfl')) {
      result = await fetchNFL(dateStr, searchHome, searchAway, apiKey);
    } else {
      result = await fetchSoccer(dateStr, searchHome, searchAway, apiKey);
    }

    if (result && result.completed) {
      const evaluation = evaluatePrediction(pred.prediction || '', result.homeScore, result.awayScore);
      
      await prisma.prediction.update({
        where: { id: pred.id },
        data: {
          actualResult: evaluation.actualResult,
          actualScore: `${result.homeScore}-${result.awayScore}`,
          outcome: evaluation.wasAccurate ? 'HIT' : 'MISS',
          validatedAt: new Date(),
        },
      });

      const emoji = evaluation.wasAccurate ? '✅ HIT' : '❌ MISS';
      console.log(`  → ${emoji}: ${result.homeScore}-${result.awayScore}`);
      updated++;
    } else {
      console.log(`  → ⏳ Result not found yet`);
      notFound++;
    }
  }

  // Step 3: Remove duplicates (keep newest)
  console.log('\n🧹 Step 3: Removing duplicates...\n');
  
  const allPending = await prisma.prediction.findMany({
    where: { outcome: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });
  
  const seen = new Map<string, string>();
  let deleted = 0;
  
  for (const pred of allPending) {
    const key = `${pred.matchName}_${pred.kickoff.toISOString().split('T')[0]}`;
    if (seen.has(key)) {
      await prisma.prediction.delete({ where: { id: pred.id } });
      deleted++;
    } else {
      seen.set(key, pred.id);
    }
  }
  
  console.log(`Deleted ${deleted} duplicate predictions`);

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏳ Not found: ${notFound}`);
  console.log(`🗑️  Duplicates removed: ${deleted}`);
  console.log('='.repeat(60));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
