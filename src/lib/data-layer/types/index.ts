/**
 * Normalized Data Layer Types
 * 
 * These interfaces provide a unified structure for all sports data,
 * abstracting away the differences between various API providers.
 * Agents and consumers interact with these types only.
 */

// ============================================================================
// Core Entities
// ============================================================================

export interface NormalizedTeam {
  id: string;              // Normalized ID (provider-agnostic)
  externalId: string;      // Original provider ID
  name: string;            // Full team name
  shortName: string;       // Abbreviated name
  logo?: string;           // Logo URL
  venue?: {
    name: string;
    city: string;
    capacity?: number;
  };
  country?: string;
  founded?: number;
  sport: Sport;
  league?: string;
}

export interface NormalizedPlayer {
  id: string;
  externalId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  number?: number;
  photo?: string;
  nationality?: string;
  age?: number;
  height?: string;
  weight?: string;
  injured?: boolean;
  injuryType?: string;
}

export interface NormalizedMatch {
  id: string;
  externalId: string;
  sport: Sport;
  league: string;
  leagueId: string;
  season: string;
  round?: string;
  
  homeTeam: NormalizedTeam;
  awayTeam: NormalizedTeam;
  
  status: MatchStatus;
  date: Date;
  venue?: string;
  
  score?: {
    home: number;
    away: number;
    halftime?: { home: number; away: number };
    periods?: Array<{ home: number; away: number }>;
  };
  
  // Provider metadata
  provider: DataProvider;
  fetchedAt: Date;
}

// ============================================================================
// Statistics
// ============================================================================

export interface NormalizedTeamStats {
  teamId: string;
  season: string;
  league: string;
  sport: Sport;
  
  record: {
    wins: number;
    losses: number;
    draws?: number;      // Soccer/Hockey
    overtimeLosses?: number; // Hockey
    winPercentage: number;
  };
  
  // Points/Goals
  scoring: {
    totalFor: number;
    totalAgainst: number;
    averageFor: number;
    averageAgainst: number;
    homeFor?: number;
    homeAgainst?: number;
    awayFor?: number;
    awayAgainst?: number;
  };
  
  // Form (last N games)
  form?: {
    last5: string;       // e.g., "WWLWD" or "WWLWL"
    last10?: string;
    streak?: {
      type: 'win' | 'loss' | 'draw';
      count: number;
    };
  };
  
  // Sport-specific stats (flattened)
  extended?: Record<string, number | string>;
  
  provider: DataProvider;
  fetchedAt: Date;
}

export interface NormalizedPlayerStats {
  playerId: string;
  teamId: string;
  season: string;
  sport: Sport;
  
  games: {
    played: number;
    started?: number;
    minutes?: number;
  };
  
  // Scoring (universal)
  scoring: {
    points?: number;      // Basketball/NFL
    goals?: number;       // Soccer/Hockey
    assists?: number;
    
    // Sport-specific breakdowns
    fieldGoals?: { made: number; attempted: number; percentage: number };
    threePointers?: { made: number; attempted: number; percentage: number };
    freeThrows?: { made: number; attempted: number; percentage: number };
    touchdowns?: number;
    passingYards?: number;
    rushingYards?: number;
  };
  
  // Defense (universal)
  defense?: {
    rebounds?: number;
    steals?: number;
    blocks?: number;
    tackles?: number;
    interceptions?: number;
    sacks?: number;
  };
  
  extended?: Record<string, number | string>;
  
  provider: DataProvider;
  fetchedAt: Date;
}

// ============================================================================
// Head-to-Head
// ============================================================================

export interface NormalizedH2H {
  team1Id: string;
  team2Id: string;
  sport: Sport;
  
  summary: {
    totalGames: number;
    team1Wins: number;
    team2Wins: number;
    draws: number;
    team1Goals: number;
    team2Goals: number;
  };
  
  matches: NormalizedMatch[];
  
  provider: DataProvider;
  fetchedAt: Date;
}

// ============================================================================
// Recent Games
// ============================================================================

export interface NormalizedRecentGames {
  teamId: string;
  sport: Sport;
  games: NormalizedMatch[];
  
  summary: {
    wins: number;
    losses: number;
    draws: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  
  provider: DataProvider;
  fetchedAt: Date;
}

// ============================================================================
// Injuries & News
// ============================================================================

export interface NormalizedInjury {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  sport: Sport;
  
  type: string;          // e.g., "Knee", "Hamstring"
  status: 'out' | 'doubtful' | 'questionable' | 'probable' | 'day-to-day';
  description?: string;
  expectedReturn?: Date;
  
  provider: DataProvider;
  fetchedAt: Date;
}

// ============================================================================
// Odds
// ============================================================================

export interface NormalizedOdds {
  matchId: string;
  sport: Sport;
  
  moneyline?: {
    home: number;
    away: number;
    draw?: number;
  };
  
  spread?: {
    home: { line: number; odds: number };
    away: { line: number; odds: number };
  };
  
  total?: {
    over: { line: number; odds: number };
    under: { line: number; odds: number };
  };
  
  bookmaker: string;
  lastUpdate: Date;
  
  provider: DataProvider;
  fetchedAt: Date;
}

// ============================================================================
// Enums & Constants
// ============================================================================

export type Sport = 
  | 'soccer'
  | 'basketball'
  | 'hockey'
  | 'american_football'
  | 'baseball'
  | 'mma'
  | 'tennis';

export type MatchStatus = 
  | 'scheduled'
  | 'live'
  | 'halftime'
  | 'finished'
  | 'postponed'
  | 'cancelled'
  | 'suspended'
  | 'unknown';

export type DataProvider = 
  | 'api-sports'
  | 'the-odds-api'
  | 'perplexity'
  | 'manual'
  | 'cached';

// ============================================================================
// Query Types
// ============================================================================

export interface TeamQuery {
  name?: string;
  id?: string;
  sport: Sport;
  league?: string;
  country?: string;
}

export interface MatchQuery {
  sport: Sport;
  league?: string;
  team?: string;
  date?: Date;
  dateRange?: { from: Date; to: Date };
  status?: MatchStatus[];
  limit?: number;
}

export interface StatsQuery {
  teamId: string;
  sport: Sport;
  season?: string;
  league?: string;
}

export interface H2HQuery {
  team1: string;  // ID or name
  team2: string;  // ID or name
  sport: Sport;
  limit?: number;
}

// ============================================================================
// Response Wrapper
// ============================================================================

export interface DataLayerResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    provider?: DataProvider;
  };
  metadata: {
    provider: DataProvider;
    cached: boolean;
    fetchedAt: Date;
    cacheExpiry?: Date;
  };
}

// ============================================================================
// Enriched Match Data (for analysis)
// ============================================================================

export interface EnrichedMatchData {
  match: NormalizedMatch;
  
  homeTeam: {
    team: NormalizedTeam;
    stats?: NormalizedTeamStats;
    recentGames?: NormalizedRecentGames;
    injuries?: NormalizedInjury[];
  };
  
  awayTeam: {
    team: NormalizedTeam;
    stats?: NormalizedTeamStats;
    recentGames?: NormalizedRecentGames;
    injuries?: NormalizedInjury[];
  };
  
  h2h?: NormalizedH2H;
  odds?: NormalizedOdds[];
  
  // Real-time intelligence from web search
  intelligence?: {
    news?: string[];
    insights?: string[];
    source: DataProvider;
  };
  
  fetchedAt: Date;
}
