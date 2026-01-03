/**
 * Script to manually update prediction results
 * Run with: npx ts-node scripts/update-results.ts
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

// Helper to extract team keyword (last word, e.g., "Bulls" from "Chicago Bulls")
function getTeamKeyword(teamName: string): string {
  const parts = teamName.toLowerCase().split(' ');
  return parts[parts.length - 1] || teamName.toLowerCase();
}

// Helper to check if teams match (fuzzy)
function teamsMatch(apiTeam: string, searchTeam: string): boolean {
  const api = apiTeam.toLowerCase();
  const search = searchTeam.toLowerCase();
  
  // Direct match
  if (api.includes(search) || search.includes(api)) return true;
  
  // Keyword match (e.g., "Bulls" matches "Chicago Bulls")
  const apiKeyword = getTeamKeyword(apiTeam);
  const searchKeyword = getTeamKeyword(searchTeam);
  if (apiKeyword === searchKeyword) return true;
  if (api.includes(searchKeyword) || search.includes(apiKeyword)) return true;
  
  return false;
}

async function fetchNBAResult(searchHome: string, searchAway: string, dateStr: string): Promise<MatchResult | null> {
  try {
    // NBA season calculation: Oct-Jun spans two years
    // Dec 2025 = 2025-2026 season (started Oct 2025)
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    // Season starts in October
    const season = month >= 10 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    
    console.log(`  NBA API date: ${dateStr}, season: ${season}`);
    
    const response = await fetch(
      `https://v1.basketball.api-sports.io/games?date=${dateStr}&league=12&season=${season}`,
      {
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'v1.basketball.api-sports.io',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const games = data.response || [];
    console.log(`  Found ${games.length} NBA games`);

    for (const game of games) {
      const home = game.teams?.home?.name || '';
      const away = game.teams?.away?.name || '';
      const status = game.status?.short || '';

      if (!['FT', 'AOT', 'AP'].includes(status)) continue;

      // Try normal match using fuzzy matching
      if (teamsMatchFuzzy(home, searchHome) && teamsMatchFuzzy(away, searchAway)) {
        console.log(`  Matched: ${home} vs ${away}`);
        return {
          homeTeam: home,
          awayTeam: away,
          homeScore: game.scores?.home?.total ?? 0,
          awayScore: game.scores?.away?.total ?? 0,
          completed: true,
        };
      }
      
      // Try swapped match (prediction had home/away reversed)
      if (teamsMatchFuzzy(home, searchAway) && teamsMatchFuzzy(away, searchHome)) {
        console.log(`  Matched (swapped): ${home} vs ${away}`);
        return {
          homeTeam: home,
          awayTeam: away,
          homeScore: game.scores?.home?.total ?? 0,
          awayScore: game.scores?.away?.total ?? 0,
          completed: true,
          // Note: We return actual home/away from API, evaluation will handle it
        };
      }
    }
    return null;
  } catch (error) {
    console.error('NBA fetch error:', error);
    return null;
  }
}

// Helper to normalize team names (remove accents, common variations)
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/wolverhampton wanderers/g, 'wolves')
    .replace(/wolverhampton/g, 'wolves')
    .replace(/tottenham hotspur/g, 'tottenham')
    .replace(/manchester united/g, 'man united')
    .replace(/manchester city/g, 'man city')
    .replace(/newcastle united/g, 'newcastle')
    .replace(/west ham united/g, 'west ham')
    .replace(/brighton.*albion/g, 'brighton')
    .replace(/nottingham forest/g, 'forest')
    .replace(/crystal palace/g, 'palace')
    .replace(/athletic bilbao/g, 'athletic club')
    .replace(/montreal canadiens/g, 'canadiens')
    .replace(/st\.?\s*louis/g, 'st louis')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper to check if teams match with fuzzy matching
function teamsMatchFuzzy(apiTeam: string, searchTeam: string): boolean {
  const api = normalizeTeamName(apiTeam);
  const search = normalizeTeamName(searchTeam);
  
  // Direct match
  if (api === search) return true;
  if (api.includes(search) || search.includes(api)) return true;
  
  // Keyword match (last word, e.g., "Bulls" from "Chicago Bulls")
  const apiWords = api.split(' ');
  const searchWords = search.split(' ');
  
  // Check if any significant word (>3 chars) matches
  for (const apiWord of apiWords) {
    if (apiWord.length > 3) {
      for (const searchWord of searchWords) {
        if (searchWord.length > 3 && (apiWord === searchWord || apiWord.includes(searchWord) || searchWord.includes(apiWord))) {
          return true;
        }
      }
    }
  }
  
  // Check last words (team nicknames)
  const apiLast = apiWords[apiWords.length - 1];
  const searchLast = searchWords[searchWords.length - 1];
  if (apiLast && searchLast && apiLast.length > 3 && searchLast.length > 3) {
    if (apiLast === searchLast) return true;
  }
  
  return false;
}

async function fetchNHLResult(searchHome: string, searchAway: string, dateStr: string): Promise<MatchResult | null> {
  try {
    // NHL season: Oct-Jun, uses just the starting year (e.g., "2025" for 2025-2026 season)
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    // Season starts in October
    const season = month >= 10 ? year : year - 1;
    
    console.log(`  NHL API date: ${dateStr}, season: ${season}`);
    
    const response = await fetch(
      `https://v1.hockey.api-sports.io/games?date=${dateStr}&league=57&season=${season}`,
      {
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'v1.hockey.api-sports.io',
        },
      }
    );

    if (!response.ok) {
      console.log(`  NHL API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const games = data.response || [];
    console.log(`  Found ${games.length} NHL games`);

    for (const game of games) {
      const home = game.teams?.home?.name || '';
      const away = game.teams?.away?.name || '';
      const status = game.status?.short || '';

      if (!['FT', 'AOT', 'AP', 'POST'].includes(status)) continue;

      // Use fuzzy matching for team names
      if (teamsMatchFuzzy(home, searchHome) && teamsMatchFuzzy(away, searchAway)) {
        console.log(`  Matched: ${home} vs ${away}`);
        return {
          homeTeam: home,
          awayTeam: away,
          homeScore: game.scores?.home ?? 0,
          awayScore: game.scores?.away ?? 0,
          completed: true,
        };
      }
      
      // Try swapped match (prediction had home/away reversed)
      if (teamsMatchFuzzy(home, searchAway) && teamsMatchFuzzy(away, searchHome)) {
        console.log(`  Matched (swapped): ${home} vs ${away}`);
        return {
          homeTeam: home,
          awayTeam: away,
          homeScore: game.scores?.home ?? 0,
          awayScore: game.scores?.away ?? 0,
          completed: true,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('NHL fetch error:', error);
    return null;
  }
}

async function fetchFootballResult(searchHome: string, searchAway: string, dateStr: string): Promise<MatchResult | null> {
  try {
    // Football uses season=2025 for 2025-26 season (Aug 2025 - May 2026)
    // or season=2024 for 2024-25 season (Aug 2024 - May 2025)
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    // Season starts in August, so Jan-Jul = previous year's season
    const season = month >= 8 ? year : year - 1;
    
    console.log(`  Football API date: ${dateStr}, season: ${season}`);
    
    // Try to find the fixture by date with FT status
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${dateStr}&status=FT`,
      {
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'v3.football.api-sports.io',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const fixtures = data.response || [];
    console.log(`  Found ${fixtures.length} finished fixtures`);

    for (const fixture of fixtures) {
      const home = fixture.teams?.home?.name || '';
      const away = fixture.teams?.away?.name || '';

      // Use improved fuzzy matching
      if (teamsMatchFuzzy(home, searchHome) && teamsMatchFuzzy(away, searchAway)) {
        console.log(`  Matched: ${home} vs ${away}`);
        return {
          homeTeam: home,
          awayTeam: away,
          homeScore: fixture.goals?.home ?? 0,
          awayScore: fixture.goals?.away ?? 0,
          completed: true,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Football fetch error:', error);
    return null;
  }
}

function evaluatePrediction(predictedScenario: string, homeScore: number, awayScore: number) {
  const predicted = predictedScenario.toLowerCase();
  const actualResult = homeScore > awayScore ? 'Home Win' : awayScore > homeScore ? 'Away Win' : 'Draw';

  if (predicted.includes('home') || predicted.includes(' win')) {
    // Check if it predicted the home team to win
    if (predicted.includes('home')) {
      return { wasAccurate: homeScore > awayScore, actualResult };
    }
  }
  if (predicted.includes('away')) {
    return { wasAccurate: awayScore > homeScore, actualResult };
  }
  // Check if team name is in prediction
  return { wasAccurate: false, actualResult };
}

// Euroleague teams for detection
const EUROLEAGUE_TEAMS = [
  'fenerbahce', 'barcelona', 'real madrid', 'olympiacos', 'panathinaikos', 'maccabi',
  'anadolu efes', 'efes', 'cska', 'milano', 'olimpia', 'bayern', 'baskonia', 'valencia basket',
  'virtus', 'partizan', 'crvena zvezda', 'zvezda', 'zalgiris', 'alba berlin', 'asvel',
  'lyon', 'villeurbanne', 'paris basketball', 'hapoel', 'monaco', 'dubai'
];

const NBA_TEAMS = [
  'bulls', 'cavaliers', 'timberwolves', 'grizzlies', 'heat', 'pistons', 'celtics', 
  'lakers', 'warriors', 'nuggets', 'suns', 'bucks', 'nets', 'knicks', 'clippers', 
  'mavs', 'mavericks', 'rockets', 'spurs', 'jazz', 'thunder', 'pelicans', 'blazers', 
  '76ers', 'raptors', 'wizards', 'hawks', 'hornets', 'pacers', 'magic'
];

const NHL_TEAMS = [
  'predators', 'hurricanes', 'panthers', 'kings', 'red wings', 'bruins', 'rangers', 
  'penguins', 'capitals', 'flyers', 'devils', 'islanders', 'canadiens', 'senators', 
  'maple leafs', 'lightning', 'blue jackets', 'blackhawks', 'wild', 'blues', 'jets', 
  'avalanche', 'stars', 'ducks', 'sharks', 'kraken', 'golden knights', 'flames', 
  'oilers', 'canucks', 'coyotes', 'sabres'
];

const NFL_TEAMS = [
  'chiefs', 'bills', 'ravens', 'dolphins', 'steelers', 'bengals', 'browns', 'texans',
  'colts', 'jaguars', 'titans', 'broncos', 'chargers', 'raiders', 'eagles', 'cowboys',
  'commanders', 'giants', '49ers', 'seahawks', 'rams', 'cardinals', 'lions', 'packers',
  'vikings', 'bears', 'buccaneers', 'saints', 'falcons', 'panthers', 'jets', 'patriots'
];

// MMA keywords for detection
const MMA_KEYWORDS = [
  'ufc', 'mma', 'bellator', 'pfl', 'one championship', 'cage warriors',
  'flyweight', 'bantamweight', 'featherweight', 'lightweight', 'welterweight',
  'middleweight', 'light heavyweight', 'heavyweight'
];

async function fetchMMAResult(searchFighter1: string, searchFighter2: string, dateStr: string): Promise<MatchResult | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    console.log('  No API_FOOTBALL_KEY found');
    return null;
  }

  try {
    // MMA API uses the same API key as football
    const response = await fetch(`https://v1.mma.api-sports.io/fights?date=${dateStr}`, {
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    const data = await response.json();
    if (!data.response?.length) {
      console.log(`  No MMA fights found for ${dateStr}`);
      return null;
    }

    console.log(`  Found ${data.response.length} MMA fights on ${dateStr}`);

    for (const fight of data.response) {
      // Check if fight is finished (FT = Finished)
      if (fight.status?.short !== 'FT') continue;

      const fighter1 = fight.fighters?.first?.name?.toLowerCase() || '';
      const fighter2 = fight.fighters?.second?.name?.toLowerCase() || '';

      // Match by fighter names (check both orderings)
      const matchesOrder1 = 
        (fighter1.includes(searchFighter1) || searchFighter1.includes(fighter1) ||
         searchFighter1.split(' ').some((w: string) => fighter1.includes(w) && w.length > 3)) &&
        (fighter2.includes(searchFighter2) || searchFighter2.includes(fighter2) ||
         searchFighter2.split(' ').some((w: string) => fighter2.includes(w) && w.length > 3));

      const matchesOrder2 = 
        (fighter1.includes(searchFighter2) || searchFighter2.includes(fighter1) ||
         searchFighter2.split(' ').some((w: string) => fighter1.includes(w) && w.length > 3)) &&
        (fighter2.includes(searchFighter1) || searchFighter1.includes(fighter2) ||
         searchFighter1.split(' ').some((w: string) => fighter2.includes(w) && w.length > 3));

      if (matchesOrder1 || matchesOrder2) {
        console.log(`  Matched: ${fight.fighters.first.name} vs ${fight.fighters.second.name}`);
        
        // For MMA, winner is determined by the winner field, not by score
        // We'll encode the winner as score 1-0 for simpler processing
        const winnerId = fight.winner?.id;
        const fighter1Won = winnerId === fight.fighters?.first?.id;
        const fighter2Won = winnerId === fight.fighters?.second?.id;
        const isDraw = !winnerId || fight.result?.method?.toLowerCase().includes('draw');

        // Map to home/away paradigm: first fighter = "home", second = "away"
        // If matchesOrder2, the search order was reversed
        if (matchesOrder1) {
          return {
            homeTeam: fight.fighters.first.name,
            awayTeam: fight.fighters.second.name,
            homeScore: fighter1Won ? 1 : isDraw ? 0 : 0,
            awayScore: fighter2Won ? 1 : isDraw ? 0 : 0,
            completed: true,
          };
        } else {
          // Swapped order - searchFighter1 matched fighter2
          return {
            homeTeam: fight.fighters.second.name,
            awayTeam: fight.fighters.first.name,
            homeScore: fighter2Won ? 1 : isDraw ? 0 : 0,
            awayScore: fighter1Won ? 1 : isDraw ? 0 : 0,
            completed: true,
          };
        }
      }
    }
    return null;
  } catch (error) {
    console.error('MMA fetch error:', error);
    return null;
  }
}

async function fetchEuroleagueResult(searchHome: string, searchAway: string, dateStr: string): Promise<MatchResult | null> {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    // Euroleague uses just the year as season format (e.g., "2025" for 2024-25 season)
    // Season starts in October, so Oct-Dec = current year, Jan-May = current year
    const season = month >= 10 ? year : year;
    
    console.log(`  Euroleague API date: ${dateStr}, season: ${season}`);
    
    const response = await fetch(
      `https://v1.basketball.api-sports.io/games?date=${dateStr}&league=120&season=${season}`,
      {
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'v1.basketball.api-sports.io',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const games = data.response || [];
    console.log(`  Found ${games.length} Euroleague games`);

    for (const game of games) {
      const home = game.teams?.home?.name?.toLowerCase() || '';
      const away = game.teams?.away?.name?.toLowerCase() || '';
      const status = game.status?.short || '';

      if (!['FT', 'AOT', 'AP'].includes(status)) continue;

      // Fuzzy match - check if any part of team name matches
      const homeMatch = home.includes(searchHome) || searchHome.includes(home) ||
        searchHome.split(' ').some((w: string) => home.includes(w) && w.length > 3) ||
        home.split(' ').some((w: string) => searchHome.includes(w) && w.length > 3);
      const awayMatch = away.includes(searchAway) || searchAway.includes(away) ||
        searchAway.split(' ').some((w: string) => away.includes(w) && w.length > 3) ||
        away.split(' ').some((w: string) => searchAway.includes(w) && w.length > 3);

      if (homeMatch && awayMatch) {
        console.log(`  Matched: ${game.teams.home.name} vs ${game.teams.away.name}`);
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
    console.error('Euroleague fetch error:', error);
    return null;
  }
}

async function fetchNFLResult(searchHome: string, searchAway: string, dateStr: string): Promise<MatchResult | null> {
  try {
    // NFL season: Sep-Feb, uses the starting year (e.g., "2025" for 2025-2026 season)
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    // Season starts in September
    const season = month >= 9 ? year : year - 1;
    
    console.log(`  NFL API date: ${dateStr}, season: ${season}`);
    
    const response = await fetch(
      `https://v1.american-football.api-sports.io/games?date=${dateStr}&league=1&season=${season}`,
      {
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'v1.american-football.api-sports.io',
        },
      }
    );

    if (!response.ok) {
      console.log(`  NFL API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const games = data.response || [];
    console.log(`  Found ${games.length} NFL games`);

    for (const game of games) {
      const home = game.teams?.home?.name?.toLowerCase() || '';
      const away = game.teams?.away?.name?.toLowerCase() || '';
      const status = game.game?.status?.short || '';

      // NFL finished statuses: FT, AOT (After Overtime)
      if (!['FT', 'AOT', 'POST'].includes(status)) continue;

      // Fuzzy match - check if any part of team name matches
      const homeMatch = home.includes(searchHome) || searchHome.includes(home) ||
        searchHome.split(' ').some((w: string) => home.includes(w) && w.length > 3) ||
        home.split(' ').some((w: string) => searchHome.includes(w) && w.length > 3);
      const awayMatch = away.includes(searchAway) || searchAway.includes(away) ||
        searchAway.split(' ').some((w: string) => away.includes(w) && w.length > 3) ||
        away.split(' ').some((w: string) => searchAway.includes(w) && w.length > 3);

      if (homeMatch && awayMatch) {
        console.log(`  Matched: ${game.teams.home.name} vs ${game.teams.away.name}`);
        return {
          homeTeam: game.teams.home.name,
          awayTeam: game.teams.away.name,
          homeScore: game.scores?.home?.total ?? 0,
          awayScore: game.scores?.away?.total ?? 0,
          completed: true,
        };
      }
      
      // Try swapped match (prediction had home/away reversed)
      if ((home.includes(searchAway) || searchAway.includes(home) ||
           searchAway.split(' ').some((w: string) => home.includes(w) && w.length > 3)) &&
          (away.includes(searchHome) || searchHome.includes(away) ||
           searchHome.split(' ').some((w: string) => away.includes(w) && w.length > 3))) {
        console.log(`  Matched (swapped): ${game.teams.home.name} vs ${game.teams.away.name}`);
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
    console.error('NFL fetch error:', error);
    return null;
  }
}

async function updatePredictionResults() {
  console.log('Fetching pending predictions...');
  
  const pendingPredictions = await prisma.prediction.findMany({
    where: { outcome: 'PENDING' },
  });
  
  console.log(`Found ${pendingPredictions.length} pending predictions`);
  
  let updated = 0;
  
  for (const prediction of pendingPredictions) {
    const [homeTeam, awayTeam] = prediction.matchName.split(' vs ').map(t => t.trim());
    if (!homeTeam || !awayTeam) continue;
    
    const searchHome = homeTeam.toLowerCase();
    const searchAway = awayTeam.toLowerCase();
    const dateStr = prediction.kickoff.toISOString().split('T')[0];
    const sportLower = prediction.sport?.toLowerCase() || '';
    
    console.log(`\nChecking: ${prediction.matchName} (${dateStr}) - Sport: ${prediction.sport}`);
    
    // Detect sport - check explicit sport field FIRST (takes priority), then team names as fallback
    // If sport field explicitly says soccer/football, NEVER fall back to NHL/NBA/NFL team name detection
    const isSoccerExplicit = sportLower.includes('soccer') || sportLower.includes('epl') || 
      sportLower.includes('la_liga') || sportLower.includes('serie_a') || 
      sportLower.includes('bundesliga') || sportLower.includes('ligue_1') ||
      sportLower.includes('spl') || sportLower.includes('primeira') || 
      sportLower.includes('eredivisie') || sportLower.includes('uefa');
    
    // NFL must be checked before NHL because team name detection can overlap (e.g., "wild" matches both Vikings and Wild)
    const isNFL = !isSoccerExplicit && (sportLower.includes('americanfootball') || sportLower.includes('nfl') ||
      (!sportLower.includes('hockey') && !sportLower.includes('nhl') && 
       NFL_TEAMS.some(t => searchHome.includes(t) || searchAway.includes(t))));
    
    const isNHL = !isSoccerExplicit && !isNFL && (sportLower.includes('hockey') || sportLower.includes('nhl') || 
      NHL_TEAMS.some(t => searchHome.includes(t) || searchAway.includes(t)));
    
    const isEuroleague = sportLower.includes('euroleague') || 
      (!isSoccerExplicit && EUROLEAGUE_TEAMS.some(t => searchHome.includes(t) || searchAway.includes(t)));
    
    const isNBA = !isEuroleague && !isSoccerExplicit && ((sportLower.includes('basketball') && !sportLower.includes('euroleague')) || 
      sportLower.includes('nba') || 
      NBA_TEAMS.some(t => searchHome.includes(t) || searchAway.includes(t)));
    
    const isFootball = isSoccerExplicit;
    
    const isMMA = sportLower.includes('mma') || sportLower.includes('ufc') || 
      sportLower.includes('mixed_martial_arts') ||
      MMA_KEYWORDS.some(t => searchHome.includes(t) || searchAway.includes(t) || sportLower.includes(t));
    
    console.log(`  Detection: NHL=${isNHL}, Euroleague=${isEuroleague}, NBA=${isNBA}, Football=${isFootball}, NFL=${isNFL}, MMA=${isMMA}`);
    
    let result: MatchResult | null = null;
    
    // Helper to get date offset string
    const getDateOffset = (d: string, days: number) => {
      const date = new Date(d);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    };
    
    // Try fetching result for multiple days (predictions dates can be off by 1-3 days)
    const tryFetchWithDateRange = async (
      fetchFn: (home: string, away: string, date: string) => Promise<MatchResult | null>,
      apiName: string
    ): Promise<MatchResult | null> => {
      // Try original date first
      let result = await fetchFn(searchHome, searchAway, dateStr);
      if (result) return result;
      
      // Try +1, +2, +3 days, and also -1 day in case prediction date is after match
      const daysToTry = [1, 2, 3, -1];
      for (const offset of daysToTry) {
        const tryDate = getDateOffset(dateStr, offset);
        console.log(`  -> Trying ${offset > 0 ? '+' : ''}${offset} day (${tryDate})...`);
        result = await fetchFn(searchHome, searchAway, tryDate);
        if (result) return result;
      }
      return null;
    };
    
    // Check in order of specificity
    // NFL is checked first since its detection already excludes NHL conflicts
    if (isNFL) {
      console.log('  -> Checking NFL API...');
      result = await tryFetchWithDateRange(fetchNFLResult, 'NFL');
    } else if (isNHL) {
      console.log('  -> Checking NHL API...');
      result = await tryFetchWithDateRange(fetchNHLResult, 'NHL');
    } else if (isEuroleague) {
      console.log('  -> Checking Euroleague API...');
      result = await tryFetchWithDateRange(fetchEuroleagueResult, 'Euroleague');
    } else if (isNBA) {
      console.log('  -> Checking NBA API...');
      result = await tryFetchWithDateRange(fetchNBAResult, 'NBA');
    } else if (isFootball) {
      console.log('  -> Checking Football API...');
      result = await tryFetchWithDateRange(fetchFootballResult, 'Football');
    } else if (isMMA) {
      console.log('  -> Checking MMA API...');
      result = await tryFetchWithDateRange(fetchMMAResult, 'MMA');
    } else {
      // Unknown sport - skip
      console.log('  ⚠️ Unknown sport, skipping');
      continue;
    }
    
    if (result && result.completed) {
      const homeWon = result.homeScore > result.awayScore;
      const isDraw = result.homeScore === result.awayScore;
      const predLower = prediction.prediction?.toLowerCase() || '';
      
      // Determine actual winner for value bet evaluation
      const actualWinner = homeWon ? 'HOME' : isDraw ? 'DRAW' : 'AWAY';
      
      // Evaluate the main prediction
      let wasAccurate = false;
      const homeKeyword = homeTeam.split(' ').pop()?.toLowerCase() || '';
      const awayKeyword = awayTeam.split(' ').pop()?.toLowerCase() || '';
      
      // Check for "Home Win" style predictions
      if (predLower.includes('home win') || predLower.includes('home victory') || predLower === 'home') {
        wasAccurate = homeWon;
      } else if (predLower.includes('away win') || predLower.includes('away victory') || predLower === 'away') {
        wasAccurate = !homeWon && !isDraw;
      } else if (predLower.includes('draw')) {
        wasAccurate = isDraw;
      } else if (predLower.includes(homeKeyword) && homeKeyword.length > 2) {
        wasAccurate = homeWon;
      } else if (predLower.includes(awayKeyword) && awayKeyword.length > 2) {
        wasAccurate = !homeWon && !isDraw;
      }
      
      const actualResult = homeWon ? 'Home Win' : isDraw ? 'Draw' : 'Away Win';
      
      // Evaluate value bet if present
      let valueBetOutcome: 'HIT' | 'MISS' | null = null;
      let valueBetProfit: number | null = null;
      
      // Get valueBet fields from prediction (need to fetch full record)
      const fullPred = await prisma.prediction.findUnique({
        where: { id: prediction.id },
        select: { valueBetSide: true, valueBetOdds: true }
      });
      
      if (fullPred?.valueBetSide && fullPred?.valueBetOdds) {
        const valueBetWon = fullPred.valueBetSide === actualWinner;
        valueBetOutcome = valueBetWon ? 'HIT' : 'MISS';
        // Profit: if won, profit = (odds - 1); if lost, profit = -1 (1 unit stake)
        valueBetProfit = valueBetWon ? (fullPred.valueBetOdds - 1) : -1;
        console.log(`    Value bet: ${fullPred.valueBetSide} @ ${fullPred.valueBetOdds.toFixed(2)} -> ${valueBetOutcome} (${valueBetProfit > 0 ? '+' : ''}${valueBetProfit.toFixed(2)} units)`);
      }
      
      await prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          actualResult,
          actualScore: `${result.homeScore}-${result.awayScore}`,
          outcome: wasAccurate ? 'HIT' : 'MISS',
          validatedAt: new Date(),
          // Value bet fields
          ...(valueBetOutcome && { valueBetOutcome }),
          ...(valueBetProfit !== null && { valueBetProfit }),
        },
      });
      
      console.log(`  ✅ Updated: ${result.homeScore}-${result.awayScore} (${actualResult}) -> ${wasAccurate ? 'HIT' : 'MISS'}`);
      updated++;
    } else {
      console.log('  ⏳ No result found yet');
    }
    
    // Rate limiting - don't hammer the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Summary: Updated ${updated} predictions`);
  await prisma.$disconnect();
}

updatePredictionResults().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
