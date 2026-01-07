/**
 * Verified Coach Info Service
 * 
 * Provides current coach/manager information for teams:
 * - Current manager name, nationality
 * - Career history
 * - Tenure at current club
 * 
 * Uses API-Sports /coachs endpoint
 */

const API_BASE = 'https://v3.football.api-sports.io';

// ============================================================================
// Types
// ============================================================================

export interface CoachInfo {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  nationality: string;
  photo: string;
  currentTeam: {
    id: number;
    name: string;
    logo: string;
    startDate: string;
  } | null;
  career: Array<{
    team: { id: number; name: string };
    start: string;
    end: string | null;
  }>;
}

export interface CoachResult {
  success: boolean;
  data: CoachInfo | null;
  error?: string;
}

// ============================================================================
// Detection
// ============================================================================

/**
 * Check if query is asking about a team's coach/manager
 */
export function isCoachQuery(message: string): boolean {
  return /\b(coach|manager|head\s*coach|trener|menager|tehničar|who.*manages?|who.*coach|ko.*vodi)\b/i.test(message);
}

/**
 * Extract team name from coach query
 */
function extractTeamFromCoachQuery(message: string): string | null {
  // "Who is the coach of Arsenal"
  const ofMatch = message.match(/(?:coach|manager|trener)\s+(?:of\s+)?([A-Z][a-zA-Z\s]+?)(?:\?|$)/i);
  if (ofMatch) return ofMatch[1].trim();
  
  // "Arsenal coach" or "Arsenal's manager"
  const possessiveMatch = message.match(/([A-Z][a-zA-Z\s]+?)(?:'s)?\s+(?:coach|manager|trener)/i);
  if (possessiveMatch) return possessiveMatch[1].trim();
  
  // "Who manages Arsenal"
  const managesMatch = message.match(/(?:manages?|vodi)\s+([A-Z][a-zA-Z\s]+?)(?:\?|$)/i);
  if (managesMatch) return managesMatch[1].trim();
  
  // Just look for team name patterns
  const teamMatch = message.match(/\b(Arsenal|Chelsea|Liverpool|Man(?:chester)?\s*(?:United|City)|Tottenham|Real\s*Madrid|Barcelona|Bayern|Juventus|PSG|Paris|Milan|Inter|Dortmund|Atletico)\b/i);
  if (teamMatch) return teamMatch[1];
  
  return null;
}

// ============================================================================
// API Functions
// ============================================================================

async function apiRequest<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    console.error('[Coach] API_FOOTBALL_KEY not configured');
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
      console.error(`[Coach] API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[Coach] Fetch error:', error);
    return null;
  }
}

/**
 * Find team ID by name
 */
async function findTeamId(teamName: string): Promise<number | null> {
  const result = await apiRequest<{
    response: Array<{ team: { id: number; name: string } }>;
  }>('/teams', { search: teamName });

  if (!result?.response?.[0]) {
    // Try first word only
    const firstWord = teamName.split(' ')[0];
    const retryResult = await apiRequest<typeof result>('/teams', { search: firstWord });
    return retryResult?.response?.[0]?.team?.id || null;
  }

  return result.response[0].team.id;
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Get coach info for a team
 */
export async function getVerifiedCoach(message: string): Promise<CoachResult> {
  const teamName = extractTeamFromCoachQuery(message);
  if (!teamName) {
    return { success: false, data: null, error: 'Could not identify team from query' };
  }

  console.log(`[Coach] Looking for coach of: ${teamName}`);

  const teamId = await findTeamId(teamName);
  if (!teamId) {
    return { success: false, data: null, error: `Team not found: ${teamName}` };
  }

  console.log(`[Coach] Found team ID: ${teamId}, fetching coach`);

  const result = await apiRequest<{
    response: Array<{
      id: number;
      name: string;
      firstname: string;
      lastname: string;
      age: number;
      nationality: string;
      photo: string;
      team: { id: number; name: string; logo: string } | null;
      career: Array<{
        team: { id: number; name: string };
        start: string;
        end: string | null;
      }>;
    }>;
  }>('/coachs', { team: teamId });

  if (!result?.response?.[0]) {
    return { success: false, data: null, error: 'No coach data found' };
  }

  const coach = result.response[0];
  
  // Find current position in career
  const currentPosition = coach.career.find(c => c.end === null);
  
  return {
    success: true,
    data: {
      id: coach.id,
      name: coach.name,
      firstname: coach.firstname,
      lastname: coach.lastname,
      age: coach.age,
      nationality: coach.nationality,
      photo: coach.photo,
      currentTeam: currentPosition ? {
        id: currentPosition.team.id,
        name: currentPosition.team.name,
        logo: coach.team?.logo || '',
        startDate: currentPosition.start,
      } : null,
      career: coach.career.slice(0, 5), // Last 5 positions
    },
  };
}

/**
 * Format coach info for AI context
 */
export function formatCoachContext(result: CoachResult): string {
  if (!result.success || !result.data) {
    return '';
  }

  const coach = result.data;
  
  let context = `=== VERIFIED COACH INFO ===\n`;
  context += `Name: ${coach.name}\n`;
  context += `Age: ${coach.age}\n`;
  context += `Nationality: ${coach.nationality}\n\n`;

  if (coach.currentTeam) {
    const startDate = new Date(coach.currentTeam.startDate);
    const tenure = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    context += `Current Position: ${coach.currentTeam.name}\n`;
    context += `Since: ${coach.currentTeam.startDate} (${tenure} months)\n\n`;
  }

  context += `Recent Career:\n`;
  for (const position of coach.career.slice(0, 5)) {
    const period = position.end ? `${position.start} - ${position.end}` : `${position.start} - present`;
    context += `- ${position.team.name}: ${period}\n`;
  }

  context += `\nSOURCE: API-Sports (official data)\n`;

  return context;
}
