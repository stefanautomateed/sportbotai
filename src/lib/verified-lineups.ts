/**
 * Verified Match Lineups Service
 * 
 * Provides structured lineup data for upcoming/completed matches:
 * - Starting XI for both teams
 * - Formation used
 * - Coach information
 * 
 * Uses API-Sports /fixtures/lineups endpoint
 */

const API_BASE = 'https://v3.football.api-sports.io';

// ============================================================================
// Types
// ============================================================================

export interface PlayerInLineup {
  id: number;
  name: string;
  number: number;
  pos: string; // G, D, M, F
  grid?: string; // Position on grid like "1:1"
}

export interface TeamLineup {
  team: { id: number; name: string; logo: string };
  formation: string;
  startXI: PlayerInLineup[];
  substitutes: PlayerInLineup[];
  coach: { id: number; name: string; photo: string };
}

export interface LineupResult {
  success: boolean;
  data: {
    fixture: { id: number; date: string; venue: string };
    home: TeamLineup;
    away: TeamLineup;
  } | null;
  error?: string;
}

// ============================================================================
// Detection
// ============================================================================

/**
 * Check if query is asking for lineup/team selection
 */
export function isLineupQuery(message: string): boolean {
  return /lineup|starting\s*(xi|11|eleven)|team\s*sheet|formation|who.*play|postav|tim.*za|sastav/i.test(message);
}

/**
 * Extract team names from lineup query
 */
function extractTeamsFromQuery(message: string): { team1: string; team2: string } | null {
  // Pattern: "Team1 vs Team2" or "Team1 x Team2"
  const vsMatch = message.match(/([A-Z][a-zA-Z\s]+?)\s*(?:vs?\.?|x)\s*([A-Z][a-zA-Z\s]+?)(?:\s|$|lineup|starting)/i);
  if (vsMatch) {
    return { team1: vsMatch[1].trim(), team2: vsMatch[2].trim() };
  }
  
  // Single team: "Arsenal lineup"
  const singleMatch = message.match(/([A-Z][a-zA-Z\s]+?)\s*(?:lineup|starting|formation|postav)/i);
  if (singleMatch) {
    return { team1: singleMatch[1].trim(), team2: '' };
  }
  
  return null;
}

// ============================================================================
// API Functions
// ============================================================================

async function apiRequest<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    console.error('[Lineups] API_FOOTBALL_KEY not configured');
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
      console.error(`[Lineups] API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[Lineups] Fetch error:', error);
    return null;
  }
}

/**
 * Find fixture by team name(s)
 */
async function findFixture(team1: string, team2?: string): Promise<number | null> {
  // Search for upcoming fixtures
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // First find team ID
  const teamSearch = await apiRequest<{
    response: Array<{ team: { id: number; name: string } }>;
  }>('/teams', { search: team1.split(' ')[0] }); // Search first word

  if (!teamSearch?.response?.[0]) {
    console.log(`[Lineups] Team not found: ${team1}`);
    return null;
  }

  const teamId = teamSearch.response[0].team.id;
  console.log(`[Lineups] Found team ${team1} -> ID ${teamId}`);

  // Get fixtures for this team
  const fixtures = await apiRequest<{
    response: Array<{
      fixture: { id: number; date: string };
      teams: { home: { id: number; name: string }; away: { id: number; name: string } };
    }>;
  }>('/fixtures', { team: teamId, from: today, to: nextWeek, status: 'NS-1H-HT-2H' });

  if (!fixtures?.response?.[0]) {
    // Try recent past fixtures
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const pastFixtures = await apiRequest<typeof fixtures>('/fixtures', { 
      team: teamId, 
      from: lastWeek, 
      to: today,
      status: 'FT'
    });
    
    if (pastFixtures?.response?.[0]) {
      return pastFixtures.response[pastFixtures.response.length - 1].fixture.id;
    }
    return null;
  }

  return fixtures.response[0].fixture.id;
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Get lineups for a match
 */
export async function getVerifiedLineup(message: string): Promise<LineupResult> {
  const teams = extractTeamsFromQuery(message);
  if (!teams) {
    return { success: false, data: null, error: 'Could not identify teams from query' };
  }

  console.log(`[Lineups] Looking for fixture: ${teams.team1} ${teams.team2 ? 'vs ' + teams.team2 : ''}`);

  const fixtureId = await findFixture(teams.team1, teams.team2);
  if (!fixtureId) {
    return { success: false, data: null, error: 'Could not find upcoming fixture' };
  }

  console.log(`[Lineups] Fetching lineups for fixture ${fixtureId}`);

  const lineups = await apiRequest<{
    response: Array<{
      team: { id: number; name: string; logo: string };
      formation: string;
      startXI: Array<{ player: { id: number; name: string; number: number; pos: string; grid: string } }>;
      substitutes: Array<{ player: { id: number; name: string; number: number; pos: string } }>;
      coach: { id: number; name: string; photo: string };
    }>;
  }>('/fixtures/lineups', { fixture: fixtureId });

  if (!lineups?.response || lineups.response.length < 2) {
    return { success: false, data: null, error: 'Lineups not yet announced' };
  }

  // Get fixture info
  const fixtureInfo = await apiRequest<{
    response: Array<{
      fixture: { id: number; date: string; venue: { name: string } };
    }>;
  }>('/fixtures', { id: fixtureId });

  const venue = fixtureInfo?.response?.[0]?.fixture?.venue?.name || 'TBD';
  const date = fixtureInfo?.response?.[0]?.fixture?.date || new Date().toISOString();

  const home = lineups.response[0];
  const away = lineups.response[1];

  return {
    success: true,
    data: {
      fixture: { id: fixtureId, date, venue },
      home: {
        team: home.team,
        formation: home.formation || 'N/A',
        startXI: home.startXI.map(p => ({
          id: p.player.id,
          name: p.player.name,
          number: p.player.number,
          pos: p.player.pos,
          grid: p.player.grid,
        })),
        substitutes: home.substitutes.slice(0, 7).map(p => ({
          id: p.player.id,
          name: p.player.name,
          number: p.player.number,
          pos: p.player.pos,
        })),
        coach: home.coach,
      },
      away: {
        team: away.team,
        formation: away.formation || 'N/A',
        startXI: away.startXI.map(p => ({
          id: p.player.id,
          name: p.player.name,
          number: p.player.number,
          pos: p.player.pos,
          grid: p.player.grid,
        })),
        substitutes: away.substitutes.slice(0, 7).map(p => ({
          id: p.player.id,
          name: p.player.name,
          number: p.player.number,
          pos: p.player.pos,
        })),
        coach: away.coach,
      },
    },
  };
}

/**
 * Format lineups for AI context
 */
export function formatLineupContext(result: LineupResult): string {
  if (!result.success || !result.data) {
    return '';
  }

  const { fixture, home, away } = result.data;
  const matchDate = new Date(fixture.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let context = `=== VERIFIED LINEUPS ===\n`;
  context += `Match: ${home.team.name} vs ${away.team.name}\n`;
  context += `Date: ${matchDate}\n`;
  context += `Venue: ${fixture.venue}\n\n`;

  // Home team
  context += `📋 ${home.team.name} (${home.formation})\n`;
  context += `Coach: ${home.coach.name}\n`;
  context += `Starting XI:\n`;
  for (const player of home.startXI) {
    context += `  ${player.number}. ${player.name} (${player.pos})\n`;
  }
  context += `\nSubstitutes: ${home.substitutes.map(p => p.name).join(', ')}\n\n`;

  // Away team
  context += `📋 ${away.team.name} (${away.formation})\n`;
  context += `Coach: ${away.coach.name}\n`;
  context += `Starting XI:\n`;
  for (const player of away.startXI) {
    context += `  ${player.number}. ${player.name} (${player.pos})\n`;
  }
  context += `\nSubstitutes: ${away.substitutes.map(p => p.name).join(', ')}\n\n`;

  context += `SOURCE: API-Sports (official team data)\n`;

  return context;
}
