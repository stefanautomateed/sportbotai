/**
 * Verified Match Events Service
 * 
 * Provides detailed match events:
 * - Goals (scorers, assists, minute)
 * - Cards (yellow, red)
 * - Substitutions
 * - VAR decisions
 * 
 * Uses API-Sports /fixtures/events endpoint
 */

const API_BASE = 'https://v3.football.api-sports.io';

// ============================================================================
// Types
// ============================================================================

export interface MatchEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { id: number; name: string };
  assist: { id: number | null; name: string | null };
  type: 'Goal' | 'Card' | 'subst' | 'Var';
  detail: string; // "Normal Goal", "Yellow Card", "Substitution 1", "Goal cancelled"
}

export interface MatchEventsResult {
  success: boolean;
  data: {
    fixture: {
      id: number;
      date: string;
      venue: string;
      status: string;
    };
    teams: {
      home: { id: number; name: string; logo: string };
      away: { id: number; name: string; logo: string };
    };
    score: {
      home: number;
      away: number;
    };
    events: MatchEvent[];
  } | null;
  error?: string;
}

// ============================================================================
// Detection
// ============================================================================

/**
 * Check if query is asking about match events/results
 */
export function isMatchEventsQuery(message: string): boolean {
  return /who\s*(scored|got\s*goal|got\s*card)|goal\s*scorer|match\s*(result|score|events)|how\s*did.*end|final\s*score|ko\s*je\s*dao\s*gol|rezultat/i.test(message);
}

/**
 * Extract teams from query
 */
function extractTeamsFromEventsQuery(message: string): { team1: string; team2: string } | null {
  // "Arsenal vs Chelsea result"
  const vsMatch = message.match(/([A-Z][a-zA-Z\s]+?)\s*(?:vs?\.?|x|-)\s*([A-Z][a-zA-Z\s]+?)(?:\s|$|result|score|match)/i);
  if (vsMatch) {
    return { team1: vsMatch[1].trim(), team2: vsMatch[2].trim() };
  }
  
  // Just team name
  const singleMatch = message.match(/(?:in|at|for|about)\s+([A-Z][a-zA-Z\s]+?)(?:'s)?\s+(?:match|game)/i);
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
    console.error('[Events] API_FOOTBALL_KEY not configured');
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
      console.error(`[Events] API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[Events] Fetch error:', error);
    return null;
  }
}

/**
 * Find recent fixture by team name
 */
async function findRecentFixture(teamName: string): Promise<number | null> {
  // Search team
  const teamSearch = await apiRequest<{
    response: Array<{ team: { id: number; name: string } }>;
  }>('/teams', { search: teamName.split(' ')[0] });

  if (!teamSearch?.response?.[0]) {
    return null;
  }

  const teamId = teamSearch.response[0].team.id;
  
  // Get recent finished fixtures
  const today = new Date().toISOString().split('T')[0];
  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const fixtures = await apiRequest<{
    response: Array<{
      fixture: { id: number; date: string };
    }>;
  }>('/fixtures', { team: teamId, from: lastMonth, to: today, status: 'FT' });

  if (!fixtures?.response?.length) {
    return null;
  }

  // Return most recent
  return fixtures.response[fixtures.response.length - 1].fixture.id;
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Get match events for a fixture
 */
export async function getVerifiedMatchEvents(message: string): Promise<MatchEventsResult> {
  const teams = extractTeamsFromEventsQuery(message);
  if (!teams) {
    return { success: false, data: null, error: 'Could not identify teams from query' };
  }

  console.log(`[Events] Looking for fixture: ${teams.team1} ${teams.team2 ? 'vs ' + teams.team2 : ''}`);

  const fixtureId = await findRecentFixture(teams.team1);
  if (!fixtureId) {
    return { success: false, data: null, error: 'Could not find recent fixture' };
  }

  console.log(`[Events] Fetching events for fixture ${fixtureId}`);

  // Get fixture info and events together
  const [fixtureInfo, eventsData] = await Promise.all([
    apiRequest<{
      response: Array<{
        fixture: { id: number; date: string; venue: { name: string }; status: { long: string } };
        teams: { home: { id: number; name: string; logo: string }; away: { id: number; name: string; logo: string } };
        goals: { home: number; away: number };
      }>;
    }>('/fixtures', { id: fixtureId }),
    apiRequest<{
      response: Array<{
        time: { elapsed: number; extra: number | null };
        team: { id: number; name: string };
        player: { id: number; name: string };
        assist: { id: number | null; name: string | null };
        type: string;
        detail: string;
      }>;
    }>('/fixtures/events', { fixture: fixtureId }),
  ]);

  if (!fixtureInfo?.response?.[0]) {
    return { success: false, data: null, error: 'Fixture info not found' };
  }

  const fixture = fixtureInfo.response[0];
  const events = eventsData?.response || [];

  return {
    success: true,
    data: {
      fixture: {
        id: fixtureId,
        date: fixture.fixture.date,
        venue: fixture.fixture.venue?.name || 'Unknown',
        status: fixture.fixture.status.long,
      },
      teams: fixture.teams,
      score: {
        home: fixture.goals.home,
        away: fixture.goals.away,
      },
      events: events.map(e => ({
        time: e.time,
        team: e.team,
        player: e.player,
        assist: e.assist,
        type: e.type as MatchEvent['type'],
        detail: e.detail,
      })),
    },
  };
}

/**
 * Format match events for AI context
 */
export function formatMatchEventsContext(result: MatchEventsResult): string {
  if (!result.success || !result.data) {
    return '';
  }

  const { fixture, teams, score, events } = result.data;
  const matchDate = new Date(fixture.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  let context = `=== VERIFIED MATCH RESULT ===\n`;
  context += `Match: ${teams.home.name} ${score.home} - ${score.away} ${teams.away.name}\n`;
  context += `Date: ${matchDate}\n`;
  context += `Venue: ${fixture.venue}\n`;
  context += `Status: ${fixture.status}\n\n`;

  // Goals
  const goals = events.filter(e => e.type === 'Goal');
  if (goals.length > 0) {
    context += `⚽ GOALS:\n`;
    for (const goal of goals) {
      const minute = goal.time.extra ? `${goal.time.elapsed}+${goal.time.extra}'` : `${goal.time.elapsed}'`;
      const assist = goal.assist.name ? ` (assist: ${goal.assist.name})` : '';
      const detail = goal.detail !== 'Normal Goal' ? ` [${goal.detail}]` : '';
      context += `  ${minute} - ${goal.player.name} (${goal.team.name})${assist}${detail}\n`;
    }
    context += '\n';
  }

  // Cards
  const cards = events.filter(e => e.type === 'Card');
  if (cards.length > 0) {
    context += `🟨🟥 CARDS:\n`;
    for (const card of cards) {
      const minute = `${card.time.elapsed}'`;
      const cardType = card.detail.includes('Yellow') ? '🟨' : '🟥';
      context += `  ${minute} - ${cardType} ${card.player.name} (${card.team.name})\n`;
    }
    context += '\n';
  }

  context += `SOURCE: API-Sports (official match data)\n`;

  return context;
}
