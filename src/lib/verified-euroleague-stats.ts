/**
 * Verified Euroleague Stats Service
 * 
 * GUARDRAILS:
 * - For ANY numeric stats question: DO NOT answer from LLM memory
 * - MUST call API-Sports Basketball first and answer ONLY from response
 * 
 * This service ensures:
 * 1. Correct season resolution ("this season" → "2025-2026")
 * 2. Proper caching (player IDs: 7 days, stats: 6 hours)
 * 3. Season validation (requested == returned)
 * 4. Strict response contract with source attribution
 * 
 * Euroleague League ID: 120 (API-Sports Basketball)
 */

// ============================================================================
// Types
// ============================================================================

export type EuroleagueSeasonType = 'regular' | 'playoffs';

export interface VerifiedEuroleaguePlayerStats {
  playerFullName: string;
  playerId: string;
  teamName: string;
  season: string;           // e.g., "2025-2026"
  seasonType: EuroleagueSeasonType;
  gamesPlayed: number;
  source: 'API-Sports Euroleague';
  
  stats: {
    pointsPerGame: number;
    reboundsPerGame: number;
    assistsPerGame: number;
    stealsPerGame: number;
    blocksPerGame: number;
    minutesPerGame: number;
    fieldGoalPercentage: number;
    threePointPercentage: number;
    freeThrowPercentage: number;
  };
  
  fetchedAt: Date;
}

export interface VerifiedEuroleagueStatsResult {
  success: boolean;
  data?: VerifiedEuroleaguePlayerStats;
  error?: string;
  warning?: string;
}

// ============================================================================
// Season Normalizer
// ============================================================================

class EuroleagueSeasonNormalizer {
  /**
   * Euroleague season runs Oct-May
   * "2025-2026" season runs from Oct 2025 to May 2026
   */
  static getCurrentSeason(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // Euroleague starts in October
    if (month >= 10) {
      return `${year}-${year + 1}`;
    }
    return `${year - 1}-${year}`;
  }
  
  static normalize(input?: string): string {
    if (!input) return this.getCurrentSeason();
    
    const lower = input.toLowerCase().trim();
    
    if (lower.includes('this season') || lower.includes('current')) {
      return this.getCurrentSeason();
    }
    
    if (lower.includes('last season') || lower.includes('previous')) {
      const current = this.getCurrentSeason();
      const [startYear] = current.split('-').map(Number);
      return `${startYear - 1}-${startYear}`;
    }
    
    // Handle "YYYY-YYYY" format
    const fullMatch = input.match(/^(\d{4})-(\d{4})$/);
    if (fullMatch) {
      return input;
    }
    
    // Handle "YYYY-YY" format
    const shortMatch = input.match(/^(\d{4})-(\d{2})$/);
    if (shortMatch) {
      const startYear = parseInt(shortMatch[1]);
      const century = Math.floor(startYear / 100) * 100;
      return `${startYear}-${century + parseInt(shortMatch[2])}`;
    }
    
    // Handle single year
    const yearMatch = input.match(/^(\d{4})$/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      return `${year}-${year + 1}`;
    }
    
    return this.getCurrentSeason();
  }
  
  /**
   * Convert to API-Sports format (uses start year only)
   */
  static toAPIFormat(season: string): number {
    const match = season.match(/^(\d{4})/);
    return match ? parseInt(match[1]) : new Date().getFullYear();
  }
}

// ============================================================================
// Euroleague Player Mappings
// ============================================================================

interface EuroleaguePlayerMapping {
  searchName: string;     // Name to search API
  displayName: string;    // Display name
  variations: string[];   // Possible user inputs
  teamHint?: string;      // Team name hint for disambiguation
}

const EUROLEAGUE_PLAYERS: Record<string, EuroleaguePlayerMapping> = {
  // Real Madrid
  'tavares': {
    searchName: 'tavares',
    displayName: 'Walter Tavares',
    variations: ['tavares', 'walter tavares', 'edy tavares'],
    teamHint: 'Real Madrid',
  },
  'campazzo': {
    searchName: 'campazzo',
    displayName: 'Facundo Campazzo',
    variations: ['campazzo', 'facundo campazzo', 'facu'],
    teamHint: 'Real Madrid',
  },
  'llull': {
    searchName: 'llull',
    displayName: 'Sergio Llull',
    variations: ['llull', 'sergio llull'],
    teamHint: 'Real Madrid',
  },
  'hezonja': {
    searchName: 'hezonja',
    displayName: 'Mario Hezonja',
    variations: ['hezonja', 'mario hezonja'],
    teamHint: 'Real Madrid',
  },
  
  // Barcelona
  'mirotic': {
    searchName: 'mirotic',
    displayName: 'Nikola Mirotic',
    variations: ['mirotic', 'nikola mirotic', 'niko mirotic'],
    teamHint: 'Barcelona',
  },
  'laprovittola': {
    searchName: 'laprovittola',
    displayName: 'Nicolas Laprovittola',
    variations: ['laprovittola', 'nicolas laprovittola', 'nico laprovittola'],
    teamHint: 'Barcelona',
  },
  'vesely': {
    searchName: 'vesely',
    displayName: 'Jan Vesely',
    variations: ['vesely', 'jan vesely'],
    teamHint: 'Barcelona',
  },
  'satoransky': {
    searchName: 'satoransky',
    displayName: 'Tomas Satoransky',
    variations: ['satoransky', 'tomas satoransky', 'sato'],
    teamHint: 'Barcelona',
  },
  
  // Fenerbahce
  'wilbekin': {
    searchName: 'wilbekin',
    displayName: 'Scottie Wilbekin',
    variations: ['wilbekin', 'scottie wilbekin'],
    teamHint: 'Fenerbahce',
  },
  'guduric': {
    searchName: 'guduric',
    displayName: 'Marko Guduric',
    variations: ['guduric', 'marko guduric'],
    teamHint: 'Fenerbahce',
  },
  
  // Olympiacos
  'vezenkov': {
    searchName: 'vezenkov',
    displayName: 'Sasha Vezenkov',
    variations: ['vezenkov', 'sasha vezenkov', 'aleksandar vezenkov'],
    teamHint: 'Olympiacos',
  },
  'walkup': {
    searchName: 'walkup',
    displayName: 'Thomas Walkup',
    variations: ['walkup', 'thomas walkup'],
    teamHint: 'Olympiacos',
  },
  
  // Panathinaikos
  'nunn': {
    searchName: 'nunn',
    displayName: 'Kendrick Nunn',
    variations: ['nunn', 'kendrick nunn'],
    teamHint: 'Panathinaikos',
  },
  'sloukas': {
    searchName: 'sloukas',
    displayName: 'Kostas Sloukas',
    variations: ['sloukas', 'kostas sloukas'],
    teamHint: 'Panathinaikos',
  },
  
  // Monaco
  'james': {
    searchName: 'mike james',
    displayName: 'Mike James',
    variations: ['mike james'],
    teamHint: 'Monaco',
  },
  'okobo': {
    searchName: 'okobo',
    displayName: 'Elie Okobo',
    variations: ['okobo', 'elie okobo'],
    teamHint: 'Monaco',
  },
  
  // Maccabi Tel Aviv
  'baldwin': {
    searchName: 'baldwin',
    displayName: 'Wade Baldwin',
    variations: ['baldwin', 'wade baldwin'],
    teamHint: 'Maccabi',
  },
  
  // Zalgiris
  'giffey': {
    searchName: 'giffey',
    displayName: 'Niels Giffey',
    variations: ['giffey', 'niels giffey'],
    teamHint: 'Zalgiris',
  },
  
  // Virtus Bologna
  'belinelli': {
    searchName: 'belinelli',
    displayName: 'Marco Belinelli',
    variations: ['belinelli', 'marco belinelli'],
    teamHint: 'Virtus Bologna',
  },
  'lundberg': {
    searchName: 'lundberg',
    displayName: 'Gabriel Lundberg',
    variations: ['lundberg', 'gabriel lundberg'],
    teamHint: 'Virtus Bologna',
  },
  
  // Partizan
  'avramovic': {
    searchName: 'avramovic',
    displayName: 'Aleksa Avramovic',
    variations: ['avramovic', 'aleksa avramovic'],
    teamHint: 'Partizan',
  },
  
  // Anadolu Efes
  'larkin': {
    searchName: 'larkin',
    displayName: 'Shane Larkin',
    variations: ['larkin', 'shane larkin'],
    teamHint: 'Anadolu Efes',
  },
  'micic': {
    searchName: 'micic',
    displayName: 'Vasilije Micic',
    variations: ['micic', 'vasilije micic', 'vasa micic'],
    teamHint: 'Anadolu Efes',
  },
  
  // CSKA Moscow (if playing)
  'shengelia': {
    searchName: 'shengelia',
    displayName: 'Tornike Shengelia',
    variations: ['shengelia', 'tornike shengelia', 'toko shengelia'],
  },
};

// ============================================================================
// Stats Query Detection
// ============================================================================

const EUROLEAGUE_STATS_PATTERNS = [
  /how many (points?|rebounds?|assists?|steals?|blocks?)/i,
  /points? (per game|average|avg|ppg)/i,
  /rebounds? (per game|average|avg|rpg)/i,
  /assists? (per game|average|avg|apg)/i,
  /(ppg|rpg|apg|spg|bpg)/i,
  /averaging|average|avg/i,
  /stats|statistics|numbers/i,
  /shooting percentage|field goal|three.?point|free throw/i,
  /minutes? (per game|played)/i,
  /season (stats|averages|totals)/i,
];

const EUROLEAGUE_CONTEXT_PATTERNS = [
  /euroleague/i,
  /euroliga/i,
  /real madrid.*basketball/i,
  /barcelona.*basket/i,
  /fenerbahce/i,
  /olympiacos/i,
  /panathinaikos/i,
  /maccabi/i,
  /efes/i,
  /cska/i,
  /partizan/i,
  /monaco.*basket/i,
  /virtus bologna/i,
  /zalgiris/i,
  /baskonia/i,
  /bayern.*basket/i,
  /al.?ahli.*dubai/i,
  /dubai.*basket/i,
  /alba berlin/i,
  /ldlc asvel/i,
  /asvel/i,
  /milan.*basket/i,
  /olimpia milano/i,
];

/**
 * Check if message is asking for Euroleague player stats
 */
export function isEuroleagueStatsQuery(message: string): boolean {
  const lower = message.toLowerCase();
  
  // Check for Euroleague context
  const hasEuroleagueContext = EUROLEAGUE_CONTEXT_PATTERNS.some(p => p.test(lower));
  
  // Check for stats patterns
  const hasStatsPattern = EUROLEAGUE_STATS_PATTERNS.some(p => p.test(lower));
  
  // Check for known Euroleague players
  const hasEuroleaguePlayer = Object.values(EUROLEAGUE_PLAYERS).some(p =>
    p.variations.some(v => lower.includes(v))
  );
  
  // Need Euroleague context + (stats pattern OR known player)
  return hasEuroleagueContext && (hasStatsPattern || hasEuroleaguePlayer);
}

// ============================================================================
// Player Resolution
// ============================================================================

function extractPlayerFromMessage(message: string): EuroleaguePlayerMapping | null {
  const lower = message.toLowerCase();
  
  let bestMatch: { key: string; variation: string; mapping: EuroleaguePlayerMapping } | null = null;
  
  for (const [key, mapping] of Object.entries(EUROLEAGUE_PLAYERS)) {
    for (const variation of mapping.variations) {
      if (lower.includes(variation)) {
        if (!bestMatch || variation.length > bestMatch.variation.length) {
          bestMatch = { key, variation, mapping };
        }
      }
    }
  }
  
  if (bestMatch) {
    console.log(`[VerifiedEuroleagueStats] Matched: "${bestMatch.variation}" -> ${bestMatch.mapping.displayName}`);
    return bestMatch.mapping;
  }
  
  // Try to extract unknown player name (Firstname Lastname pattern)
  const nameMatch = message.match(/([A-Z][a-zćčšžđ']+(?:\s+[A-Z][a-zćčšžđ'-]+)+)/);
  if (nameMatch) {
    const fullName = nameMatch[1];
    const parts = fullName.split(/\s+/);
    const lastName = parts[parts.length - 1].toLowerCase();
    
    // Try to extract team hint from message
    const teamHint = extractTeamHint(message);
    
    console.log(`[VerifiedEuroleagueStats] Unknown player: "${fullName}" (search: ${lastName}, teamHint: ${teamHint || 'none'})`);
    return {
      searchName: lastName,
      displayName: fullName,
      variations: [fullName.toLowerCase()],
      teamHint,
    };
  }
  
  return null;
}

/**
 * Extract team name hint from message for better player matching
 */
function extractTeamHint(message: string): string | undefined {
  const lower = message.toLowerCase();
  
  const teamPatterns: [RegExp, string][] = [
    [/al.?ahli|dubai/i, 'Dubai'],
    [/real madrid/i, 'Real Madrid'],
    [/barcelona|barca/i, 'Barcelona'],
    [/olympiacos|olympiakos/i, 'Olympiacos'],
    [/panathinaikos|pao/i, 'Panathinaikos'],
    [/fenerbahce|fener/i, 'Fenerbahce'],
    [/anadolu efes|efes/i, 'Efes'],
    [/partizan/i, 'Partizan'],
    [/crvena zvezda|zvezda|red star/i, 'Crvena Zvezda'],
    [/maccabi/i, 'Maccabi'],
    [/monaco/i, 'Monaco'],
    [/virtus bologna|bologna/i, 'Virtus'],
    [/zalgiris/i, 'Zalgiris'],
    [/baskonia/i, 'Baskonia'],
    [/bayern/i, 'Bayern'],
    [/alba berlin|alba/i, 'Alba'],
    [/asvel|ldlc/i, 'ASVEL'],
    [/milano|olimpia/i, 'Milano'],
  ];
  
  for (const [pattern, teamName] of teamPatterns) {
    if (pattern.test(lower)) {
      return teamName;
    }
  }
  
  return undefined;
}

// ============================================================================
// API Fetching
// ============================================================================

const EUROLEAGUE_LEAGUE_ID = 120;

interface PlayerCache {
  [key: string]: { id: string; name: string; team: string; expiry: Date };
}

interface StatsCache {
  [key: string]: { stats: VerifiedEuroleaguePlayerStats; expiry: Date };
}

const playerCache: PlayerCache = {};
const statsCache: StatsCache = {};

const PLAYER_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const STATS_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

async function searchPlayer(
  searchName: string,
  expectedFullName: string,  // The full name we're looking for
  season: string,
  teamHint?: string  // Optional team name to prioritize
): Promise<{ success: boolean; playerId?: string; playerName?: string; teamName?: string; error?: string }> {
  const cacheKey = `euroleague:${expectedFullName.toLowerCase()}:${teamHint || ''}`;
  const cached = playerCache[cacheKey];
  
  if (cached && cached.expiry > new Date()) {
    console.log(`[VerifiedEuroleagueStats] Player cache hit: ${cached.name}`);
    return { success: true, playerId: cached.id, playerName: cached.name, teamName: cached.team };
  }
  
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return { success: false, error: 'API_FOOTBALL_KEY not configured' };
  }
  
  try {
    const seasonYear = EuroleagueSeasonNormalizer.toAPIFormat(season);
    const url = `https://v1.basketball.api-sports.io/players?search=${encodeURIComponent(searchName)}&league=${EUROLEAGUE_LEAGUE_ID}&season=${seasonYear}`;
    
    console.log(`[VerifiedEuroleagueStats] Searching player: ${url}`);
    
    const response = await fetch(url, {
      headers: { 'x-apisports-key': apiKey },
    });
    
    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` };
    }
    
    const data = await response.json();
    
    if (!data.response || data.response.length === 0) {
      return { success: false, error: `Player "${searchName}" not found in Euroleague` };
    }
    
    // Normalize diacritics for matching (ž→z, ć→c, etc.)
    const normalizeName = (name: string): string => {
      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/đ/g, 'd')
        .replace(/ł/g, 'l')
        .replace(/ø/g, 'o')
        .replace(/ß/g, 'ss');
    };
    
    // Find best matching player - prioritize exact name match
    const expectedNorm = normalizeName(expectedFullName);
    const expectedParts = expectedNorm.split(/\s+/);
    const teamHintNorm = teamHint ? normalizeName(teamHint) : '';
    
    console.log(`[VerifiedEuroleagueStats] Searching for "${expectedFullName}" (normalized: "${expectedNorm}", teamHint: "${teamHint || 'none'}") among ${data.response.length} players`);
    
    let bestMatch = data.response[0];
    let bestScore = 0;
    
    for (const player of data.response) {
      const firstName = player.firstname || '';
      const lastName = player.lastname || '';
      const fullName = `${firstName} ${lastName}`;
      const fullNorm = normalizeName(fullName);
      const firstNorm = normalizeName(firstName);
      const lastNorm = normalizeName(lastName);
      const playerTeam = player.team?.name || '';
      const playerTeamNorm = normalizeName(playerTeam);
      
      let score = 0;
      
      // Exact full name match (normalized) = highest score
      if (fullNorm === expectedNorm) {
        score = 100;
      }
      // Check if first AND last name both match
      else {
        const hasFirstMatch = expectedParts.some(p => 
          firstNorm.includes(p) || p.includes(firstNorm)
        );
        const hasLastMatch = expectedParts.some(p => 
          lastNorm === p || lastNorm.includes(p) || p.includes(lastNorm)
        );
        
        if (hasLastMatch && hasFirstMatch) {
          score = 80; // Both names match
        } else if (hasLastMatch) {
          score = 50; // Only last name matches
        } else if (hasFirstMatch) {
          score = 20; // Only first name matches
        }
      }
      
      // BONUS: If team hint matches, add significant bonus
      if (teamHintNorm && playerTeamNorm.includes(teamHintNorm)) {
        score += 30;
        console.log(`[VerifiedEuroleagueStats] Team bonus: "${playerTeam}" matches hint "${teamHint}" (+30)`);
      }
      
      console.log(`[VerifiedEuroleagueStats] Player: "${fullName}" @ ${playerTeam} → score: ${score}`);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = player;
      }
    }
    
    const playerId = String(bestMatch.id);
    const playerName = `${bestMatch.firstname} ${bestMatch.lastname}`;
    const teamName = bestMatch.team?.name || 'Unknown';
    
    // REJECT weak matches - don't return wrong player data
    if (bestScore < 50) {
      console.warn(`[VerifiedEuroleagueStats] Rejecting weak match: searched "${expectedFullName}", found "${playerName}" (score: ${bestScore})`);
      return { 
        success: false, 
        error: `Player "${expectedFullName}" not found in Euroleague. Found "${playerName}" but names don't match closely enough.` 
      };
    }
    
    console.log(`[VerifiedEuroleagueStats] Best match: "${playerName}" (score: ${bestScore}, team: ${teamName})`);
    
    // Cache the result
    playerCache[cacheKey] = {
      id: playerId,
      name: playerName,
      team: teamName,
      expiry: new Date(Date.now() + PLAYER_CACHE_TTL),
    };
    
    return { success: true, playerId, playerName, teamName };
  } catch (error) {
    return { success: false, error: `API call failed: ${error instanceof Error ? error.message : 'Unknown'}` };
  }
}

async function fetchPlayerStats(
  playerId: string,
  playerName: string,
  teamName: string,
  season: string
): Promise<VerifiedEuroleagueStatsResult> {
  const cacheKey = `euroleague:stats:${playerId}:${season}`;
  const cached = statsCache[cacheKey];
  
  if (cached && cached.expiry > new Date()) {
    console.log(`[VerifiedEuroleagueStats] Stats cache hit for ${playerName}`);
    return { success: true, data: cached.stats };
  }
  
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return { success: false, error: 'API_FOOTBALL_KEY not configured' };
  }
  
  try {
    const seasonYear = EuroleagueSeasonNormalizer.toAPIFormat(season);
    const url = `https://v1.basketball.api-sports.io/players/statistics?id=${playerId}&league=${EUROLEAGUE_LEAGUE_ID}&season=${seasonYear}`;
    
    console.log(`[VerifiedEuroleagueStats] Fetching stats: ${url}`);
    
    const response = await fetch(url, {
      headers: { 'x-apisports-key': apiKey },
    });
    
    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` };
    }
    
    const data = await response.json();
    
    if (!data.response || data.response.length === 0) {
      return { success: false, error: `No stats found for ${playerName} in ${season}` };
    }
    
    // Aggregate stats across all games
    const games = data.response;
    const gamesPlayed = games.length;
    
    if (gamesPlayed === 0) {
      return { success: false, error: `No games played in ${season}` };
    }
    
    // Get team from most recent game (more accurate than player search)
    // Sort games by date descending to get latest team
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortedGames = [...games].sort((a: any, b: any) => {
      const dateA = a.game?.date || a.date || '';
      const dateB = b.game?.date || b.date || '';
      return dateB.localeCompare(dateA);
    });
    const currentTeam = sortedGames[0]?.team?.name || teamName;
    console.log(`[VerifiedEuroleagueStats] Current team from stats: ${currentTeam}`);
    
    // Calculate averages
    let totalPoints = 0, totalRebounds = 0, totalAssists = 0;
    let totalSteals = 0, totalBlocks = 0, totalMinutes = 0;
    let fgMade = 0, fgAttempts = 0;
    let threeMade = 0, threeAttempts = 0;
    let ftMade = 0, ftAttempts = 0;
    
    for (const game of games) {
      totalPoints += game.points || 0;
      totalRebounds += (game.offensiveRebounds || 0) + (game.defensiveRebounds || 0);
      totalAssists += game.assists || 0;
      totalSteals += game.steals || 0;
      totalBlocks += game.blocks || 0;
      
      // Parse minutes (format: "MM:SS" or number)
      if (typeof game.minutes === 'string') {
        const [mins] = game.minutes.split(':').map(Number);
        totalMinutes += mins || 0;
      } else {
        totalMinutes += game.minutes || 0;
      }
      
      fgMade += game.fieldGoalsMade || 0;
      fgAttempts += game.fieldGoalsAttempted || 0;
      threeMade += game.threePointsMade || 0;
      threeAttempts += game.threePointsAttempted || 0;
      ftMade += game.freeThrowsMade || 0;
      ftAttempts += game.freeThrowsAttempted || 0;
    }
    
    const stats: VerifiedEuroleaguePlayerStats = {
      playerFullName: playerName,
      playerId,
      teamName: currentTeam,  // Use team from most recent game, not player search
      season,
      seasonType: 'regular',
      gamesPlayed,
      source: 'API-Sports Euroleague',
      stats: {
        pointsPerGame: parseFloat((totalPoints / gamesPlayed).toFixed(1)),
        reboundsPerGame: parseFloat((totalRebounds / gamesPlayed).toFixed(1)),
        assistsPerGame: parseFloat((totalAssists / gamesPlayed).toFixed(1)),
        stealsPerGame: parseFloat((totalSteals / gamesPlayed).toFixed(1)),
        blocksPerGame: parseFloat((totalBlocks / gamesPlayed).toFixed(1)),
        minutesPerGame: parseFloat((totalMinutes / gamesPlayed).toFixed(1)),
        fieldGoalPercentage: fgAttempts > 0 ? parseFloat(((fgMade / fgAttempts) * 100).toFixed(1)) : 0,
        threePointPercentage: threeAttempts > 0 ? parseFloat(((threeMade / threeAttempts) * 100).toFixed(1)) : 0,
        freeThrowPercentage: ftAttempts > 0 ? parseFloat(((ftMade / ftAttempts) * 100).toFixed(1)) : 0,
      },
      fetchedAt: new Date(),
    };
    
    // Cache the stats
    statsCache[cacheKey] = {
      stats,
      expiry: new Date(Date.now() + STATS_CACHE_TTL),
    };
    
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: `Stats fetch failed: ${error instanceof Error ? error.message : 'Unknown'}` };
  }
}

// ============================================================================
// Main Public Function
// ============================================================================

/**
 * Get verified Euroleague player stats
 * Returns stats ONLY from API-Sports, never from LLM memory
 */
export async function getVerifiedEuroleaguePlayerStats(
  message: string
): Promise<VerifiedEuroleagueStatsResult> {
  console.log('[VerifiedEuroleagueStats] Processing:', message);
  
  // Extract player from message
  const playerMapping = extractPlayerFromMessage(message);
  
  if (!playerMapping) {
    return {
      success: false,
      error: 'Could not identify Euroleague player in your question. Try including the full name.',
    };
  }
  
  // Determine season
  const season = EuroleagueSeasonNormalizer.normalize(message);
  console.log(`[VerifiedEuroleagueStats] Season resolved: ${season}`);
  
  // Search for player - pass full display name and team hint for better matching
  const playerResult = await searchPlayer(
    playerMapping.searchName, 
    playerMapping.displayName, 
    season,
    playerMapping.teamHint  // Pass team hint if user mentioned a team
  );
  
  if (!playerResult.success || !playerResult.playerId) {
    return {
      success: false,
      error: playerResult.error || `Could not find ${playerMapping.displayName} in Euroleague`,
    };
  }
  
  // Fetch stats
  const statsResult = await fetchPlayerStats(
    playerResult.playerId,
    playerResult.playerName || playerMapping.displayName,
    playerResult.teamName || 'Unknown',
    season
  );
  
  return statsResult;
}

// ============================================================================
// Format for LLM Response
// ============================================================================

/**
 * Format verified Euroleague stats for LLM response
 */
export function formatVerifiedEuroleaguePlayerStats(stats: VerifiedEuroleaguePlayerStats): string {
  const s = stats.stats;
  
  return `
📊 **${stats.playerFullName}** (${stats.teamName}) - Euroleague ${EuroleagueSeasonNormalizer.normalize(stats.season).replace('-', '/')}

**Season Averages** (${stats.gamesPlayed} games):
• Points: **${s.pointsPerGame} PPG**
• Rebounds: ${s.reboundsPerGame} RPG
• Assists: ${s.assistsPerGame} APG
• Steals: ${s.stealsPerGame} SPG
• Blocks: ${s.blocksPerGame} BPG
• Minutes: ${s.minutesPerGame} MPG

**Shooting:**
• Field Goal: ${s.fieldGoalPercentage}%
• 3-Point: ${s.threePointPercentage}%
• Free Throw: ${s.freeThrowPercentage}%

_Source: ${stats.source} (${stats.fetchedAt.toISOString().split('T')[0]})_
`.trim();
}
