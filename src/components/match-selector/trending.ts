/**
 * Trending/Hot Matches calculation logic
 * Calculates a "hotScore" for each match based on multiple factors
 */

import { MatchData } from '@/types';

// League importance tiers (higher = more important)
const LEAGUE_IMPORTANCE: Record<string, number> = {
  // Soccer - Top Tier
  'soccer_epl': 10,           // English Premier League
  'soccer_spain_la_liga': 10, // La Liga
  'soccer_germany_bundesliga': 9,
  'soccer_italy_serie_a': 9,
  'soccer_france_ligue_one': 8,
  'soccer_uefa_champs_league': 10, // Champions League
  'soccer_uefa_europa_league': 8,
  'soccer_uefa_europa_conference_league': 6,
  
  // Soccer - Second Tier
  'soccer_england_league1': 5,
  'soccer_england_league2': 4,
  'soccer_england_efl_cup': 6,
  'soccer_fa_cup': 7,
  'soccer_netherlands_eredivisie': 6,
  'soccer_portugal_primeira_liga': 6,
  'soccer_brazil_serie_a': 7,
  'soccer_mexico_ligamx': 6,
  'soccer_usa_mls': 6,
  
  // Basketball
  'basketball_nba': 10,
  'basketball_euroleague': 8,
  'basketball_ncaab': 7,
  
  // American Football
  'americanfootball_nfl': 10,
  'americanfootball_ncaaf': 8,
  
  // Hockey
  'icehockey_nhl': 10,
  
  // Tennis
  'tennis_atp_aus_open': 10,
  'tennis_atp_french_open': 10,
  'tennis_atp_us_open': 10,
  'tennis_atp_wimbledon': 10,
  
  // MMA
  'mma_mixed_martial_arts': 8,
};

// Known rivalry/derby keywords for light-weight detection
const RIVALRY_PAIRS: Array<[string, string]> = [
  // England
  ['manchester united', 'manchester city'],
  ['manchester united', 'liverpool'],
  ['liverpool', 'everton'],
  ['arsenal', 'tottenham'],
  ['chelsea', 'tottenham'],
  ['chelsea', 'arsenal'],
  
  // Spain
  ['barcelona', 'real madrid'],
  ['atletico madrid', 'real madrid'],
  ['sevilla', 'real betis'],
  
  // Italy
  ['inter', 'milan'],
  ['juventus', 'inter'],
  ['roma', 'lazio'],
  
  // Germany
  ['bayern', 'dortmund'],
  
  // NBA
  ['lakers', 'celtics'],
  ['lakers', 'clippers'],
  ['warriors', 'cavaliers'],
  ['nets', 'knicks'],
  
  // NFL
  ['cowboys', 'eagles'],
  ['packers', 'bears'],
  ['49ers', 'seahawks'],
  ['chiefs', 'raiders'],
  ['patriots', 'jets'],
  
  // NHL
  ['rangers', 'islanders'],
  ['bruins', 'canadiens'],
  ['penguins', 'flyers'],
];

export interface TrendingMatch extends MatchData {
  hotScore: number;
  hotFactors: {
    bookmakerScore: number;
    marketScore: number;
    leagueScore: number;
    derbyScore: number;
    proximityScore: number;
  };
}

/**
 * Calculate the hot score for a single match
 */
export function calculateHotScore(match: MatchData): TrendingMatch {
  // 1. Bookmaker count score (0-10 scale, max around 15+ bookmakers)
  const bookmakerCount = match.bookmakers?.length || 0;
  const bookmakerScore = Math.min(bookmakerCount / 1.5, 10);
  
  // 2. Market availability score (based on available odds types)
  // We check what odds data we have available
  let marketScore = 0;
  if (match.odds?.home && match.odds?.away) marketScore += 3; // H2H/Moneyline
  if (match.odds?.draw !== null && match.odds?.draw !== undefined) marketScore += 2; // Draw market (3-way)
  if (match.odds?.over && match.odds?.under) marketScore += 3; // Over/Under
  if (match.odds?.overUnderLine) marketScore += 2; // Has specific O/U line
  marketScore = Math.min(marketScore, 10);
  
  // 3. League importance score
  const leagueScore = LEAGUE_IMPORTANCE[match.sportKey] || 5;
  
  // 4. Derby/rivalry detection
  const derbyScore = detectDerby(match.homeTeam, match.awayTeam) ? 10 : 0;
  
  // 5. Start time proximity score (closer = higher)
  const now = Date.now();
  const matchTime = new Date(match.commenceTime).getTime();
  const hoursUntilMatch = (matchTime - now) / (1000 * 60 * 60);
  
  let proximityScore = 0;
  if (hoursUntilMatch < 0) {
    // Match already started or finished
    proximityScore = 0;
  } else if (hoursUntilMatch <= 3) {
    proximityScore = 10; // Starting very soon
  } else if (hoursUntilMatch <= 12) {
    proximityScore = 8;
  } else if (hoursUntilMatch <= 24) {
    proximityScore = 6;
  } else if (hoursUntilMatch <= 48) {
    proximityScore = 4;
  } else if (hoursUntilMatch <= 72) {
    proximityScore = 2;
  } else {
    proximityScore = 1;
  }
  
  // Calculate weighted hot score
  // hotScore = (bookmakerCount * 0.4) + (marketCount * 0.2) + (leagueImportance * 0.2) + (derbyFactor * 0.1) + (startTimeProximity * 0.1)
  const hotScore = 
    (bookmakerScore * 0.4) +
    (marketScore * 0.2) +
    (leagueScore * 0.2) +
    (derbyScore * 0.1) +
    (proximityScore * 0.1);
  
  return {
    ...match,
    hotScore,
    hotFactors: {
      bookmakerScore,
      marketScore,
      leagueScore,
      derbyScore,
      proximityScore,
    },
  };
}

/**
 * Detect if two teams are known rivals/derby match
 */
function detectDerby(homeTeam: string, awayTeam: string): boolean {
  const home = homeTeam.toLowerCase();
  const away = awayTeam.toLowerCase();
  
  for (const [team1, team2] of RIVALRY_PAIRS) {
    const homeMatches = home.includes(team1) || home.includes(team2);
    const awayMatches = away.includes(team1) || away.includes(team2);
    
    // Both teams must match different parts of the rivalry
    if (homeMatches && awayMatches) {
      const homeIsTeam1 = home.includes(team1);
      const awayIsTeam1 = away.includes(team1);
      // Ensure they're not both matching the same team name
      if (homeIsTeam1 !== awayIsTeam1) {
        return true;
      }
    }
  }
  
  // Additional check: same city derby (teams with same city prefix)
  const homeWords = home.split(' ');
  const awayWords = away.split(' ');
  if (homeWords.length > 1 && awayWords.length > 1) {
    // Check if first word (often city name) matches
    if (homeWords[0] === awayWords[0] && homeWords[0].length > 3) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get trending matches from a list of matches
 * Returns top N matches sorted by hot score
 */
export function getTrendingMatches(
  matches: MatchData[],
  limit: number = 8
): TrendingMatch[] {
  // Filter out matches that have already started
  const now = Date.now();
  const upcomingMatches = matches.filter(m => 
    new Date(m.commenceTime).getTime() > now
  );
  
  // Calculate hot scores for all matches
  const scoredMatches = upcomingMatches.map(calculateHotScore);
  
  // Sort by hot score descending
  scoredMatches.sort((a, b) => b.hotScore - a.hotScore);
  
  // Return top N
  return scoredMatches.slice(0, limit);
}

/**
 * Get trending matches for a specific sport category
 */
export function getTrendingMatchesByCategory(
  matches: MatchData[],
  sportKeys: string[],
  limit: number = 8
): TrendingMatch[] {
  const categoryMatches = matches.filter(m => sportKeys.includes(m.sportKey));
  return getTrendingMatches(categoryMatches, limit);
}
