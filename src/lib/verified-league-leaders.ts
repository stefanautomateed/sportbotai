/**
 * Verified League Leaders Service
 * 
 * Provides structured league top scorers and top assists data:
 * - Top 20 scorers in any league
 * - Top 20 assist providers
 * - Supports all major European leagues
 * 
 * Uses API-Sports /players/topscorers and /players/topassists endpoints
 */

// API-Sports Football base URL
const API_BASE = 'https://v3.football.api-sports.io';

// ============================================================================
// Types
// ============================================================================

export interface TopPlayer {
  rank: number;
  player: {
    id: number;
    name: string;
    photo: string;
    nationality: string;
    age: number;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  stats: {
    goals: number;
    assists: number;
    appearances: number;
    minutes: number;
    penalties: number;
  };
}

export interface LeagueLeadersResult {
  success: boolean;
  data: {
    league: { id: number; name: string; country: string; logo: string; season: number };
    type: 'scorers' | 'assists';
    players: TopPlayer[];
  } | null;
  error?: string;
}

// League ID mapping
const LEAGUE_IDS: Record<string, number> = {
  'premier league': 39,
  'epl': 39,
  'english': 39,
  'la liga': 140,
  'spanish': 140,
  'serie a': 135,
  'italian': 135,
  'bundesliga': 78,
  'german': 78,
  'ligue 1': 61,
  'french': 61,
  'champions league': 2,
  'ucl': 2,
  'europa league': 3,
  'mls': 253,
  'eredivisie': 88,
  'portuguese': 94,
  'primeira liga': 94,
  'scottish': 179,
};

// ============================================================================
// Detection
// ============================================================================

/**
 * Check if query is asking for league top scorers
 */
export function isTopScorersQuery(message: string): boolean {
  return /top\s*scor|best\s*scor|leading\s*scor|golden\s*boot|goal.*king|artilheir|goleador|najbol.+strel/i.test(message) &&
    !/last\s+game|yesterday|match|vs\s/i.test(message); // Exclude match-specific queries
}

/**
 * Check if query is asking for league top assists
 */
export function isTopAssistsQuery(message: string): boolean {
  return /top\s*assist|most\s*assist|leading\s*assist|best\s*playmaker|assist.*leader|najbol.+asist/i.test(message);
}

/**
 * Detect which league from the query
 */
function detectLeague(message: string): { id: number; name: string } | null {
  const lower = message.toLowerCase();
  
  for (const [keyword, id] of Object.entries(LEAGUE_IDS)) {
    if (lower.includes(keyword)) {
      return { id, name: keyword };
    }
  }
  
  // Default to Premier League if no league specified
  if (/premier|england|english/i.test(lower) || !Object.keys(LEAGUE_IDS).some(k => lower.includes(k))) {
    return { id: 39, name: 'Premier League' };
  }
  
  return null;
}

/**
 * Get current season based on league type
 */
function getCurrentSeason(): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  // European leagues: Aug-May
  return month >= 7 ? year : year - 1;
}

// ============================================================================
// API Functions
// ============================================================================

async function apiRequest<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    console.error('[League-Leaders] API_FOOTBALL_KEY not configured');
    return null;
  }

  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  try {
    const response = await fetch(url.toString(), {
      headers: { 'x-apisports-key': apiKey },
    });

    if (!response.ok) {
      console.error(`[League-Leaders] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[League-Leaders] Fetch error:', error);
    return null;
  }
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Get top scorers for a league
 */
export async function getVerifiedTopScorers(message: string): Promise<LeagueLeadersResult> {
  const league = detectLeague(message);
  if (!league) {
    return { success: false, data: null, error: 'Could not identify league' };
  }

  const season = getCurrentSeason();
  console.log(`[League-Leaders] Fetching top scorers for league ${league.id}, season ${season}`);

  const result = await apiRequest<{
    response: Array<{
      player: { id: number; name: string; photo: string; nationality: string; age: number };
      statistics: Array<{
        team: { id: number; name: string; logo: string };
        league: { id: number; name: string; country: string; logo: string; season: number };
        games: { appearences: number; minutes: number };
        goals: { total: number; assists: number };
        penalty: { scored: number };
      }>;
    }>;
  }>('/players/topscorers', { league: league.id, season });

  if (!result?.response || result.response.length === 0) {
    return { success: false, data: null, error: 'No top scorers data found' };
  }

  const firstEntry = result.response[0];
  const leagueInfo = firstEntry.statistics[0].league;

  const players: TopPlayer[] = result.response.slice(0, 20).map((p, index) => {
    const stats = p.statistics[0];
    return {
      rank: index + 1,
      player: {
        id: p.player.id,
        name: p.player.name,
        photo: p.player.photo,
        nationality: p.player.nationality,
        age: p.player.age,
      },
      team: {
        id: stats.team.id,
        name: stats.team.name,
        logo: stats.team.logo,
      },
      stats: {
        goals: stats.goals.total || 0,
        assists: stats.goals.assists || 0,
        appearances: stats.games.appearences || 0,
        minutes: stats.games.minutes || 0,
        penalties: stats.penalty.scored || 0,
      },
    };
  });

  return {
    success: true,
    data: {
      league: {
        id: leagueInfo.id,
        name: leagueInfo.name,
        country: leagueInfo.country,
        logo: leagueInfo.logo,
        season: leagueInfo.season,
      },
      type: 'scorers',
      players,
    },
  };
}

/**
 * Get top assists for a league
 */
export async function getVerifiedTopAssists(message: string): Promise<LeagueLeadersResult> {
  const league = detectLeague(message);
  if (!league) {
    return { success: false, data: null, error: 'Could not identify league' };
  }

  const season = getCurrentSeason();
  console.log(`[League-Leaders] Fetching top assists for league ${league.id}, season ${season}`);

  const result = await apiRequest<{
    response: Array<{
      player: { id: number; name: string; photo: string; nationality: string; age: number };
      statistics: Array<{
        team: { id: number; name: string; logo: string };
        league: { id: number; name: string; country: string; logo: string; season: number };
        games: { appearences: number; minutes: number };
        goals: { total: number; assists: number };
        penalty: { scored: number };
      }>;
    }>;
  }>('/players/topassists', { league: league.id, season });

  if (!result?.response || result.response.length === 0) {
    return { success: false, data: null, error: 'No top assists data found' };
  }

  const firstEntry = result.response[0];
  const leagueInfo = firstEntry.statistics[0].league;

  const players: TopPlayer[] = result.response.slice(0, 20).map((p, index) => {
    const stats = p.statistics[0];
    return {
      rank: index + 1,
      player: {
        id: p.player.id,
        name: p.player.name,
        photo: p.player.photo,
        nationality: p.player.nationality,
        age: p.player.age,
      },
      team: {
        id: stats.team.id,
        name: stats.team.name,
        logo: stats.team.logo,
      },
      stats: {
        goals: stats.goals.total || 0,
        assists: stats.goals.assists || 0,
        appearances: stats.games.appearences || 0,
        minutes: stats.games.minutes || 0,
        penalties: stats.penalty.scored || 0,
      },
    };
  });

  return {
    success: true,
    data: {
      league: {
        id: leagueInfo.id,
        name: leagueInfo.name,
        country: leagueInfo.country,
        logo: leagueInfo.logo,
        season: leagueInfo.season,
      },
      type: 'assists',
      players,
    },
  };
}

/**
 * Format league leaders for AI context
 */
export function formatLeagueLeadersContext(result: LeagueLeadersResult): string {
  if (!result.success || !result.data) {
    return '';
  }

  const { league, type, players } = result.data;
  const title = type === 'scorers' ? 'TOP SCORERS' : 'TOP ASSISTS';

  let context = `=== VERIFIED ${title} ===\n`;
  context += `League: ${league.name} (${league.country})\n`;
  context += `Season: ${league.season}/${league.season + 1}\n`;
  context += `Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\n`;

  context += `${'Rank'} | ${'Player'.padEnd(22)} | ${'Team'.padEnd(18)} | ${type === 'scorers' ? 'Goals' : 'Assists'} | Apps\n`;
  context += `${'─'.repeat(70)}\n`;

  for (const p of players.slice(0, 15)) {
    const statValue = type === 'scorers' ? p.stats.goals : p.stats.assists;
    context += `${String(p.rank).padStart(2)}. | ${p.player.name.slice(0, 22).padEnd(22)} | ${p.team.name.slice(0, 18).padEnd(18)} | ${String(statValue).padStart(5)} | ${p.stats.appearances}\n`;
  }

  if (type === 'scorers') {
    context += `\nNote: Goals include penalties (shown separately if asked)\n`;
  }
  
  context += `\nSOURCE: API-Sports (official league data)\n`;

  return context;
}
