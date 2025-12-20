/**
 * The Odds API Client
 * 
 * Centralized client for The Odds API integration.
 * Handles all non-football sports data fetching.
 * 
 * API Documentation: https://the-odds-api.com/liveapi/guides/v4/
 */

// ============================================
// CONFIGURATION
// ============================================

const ODDS_API_BASE_URL = process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4';

// ============================================
// TYPES - Raw API Responses
// ============================================

/**
 * Sport from The Odds API /sports endpoint
 */
export interface OddsApiSport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

/**
 * Event from The Odds API with optional bookmaker odds
 */
export interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: OddsApiBookmaker[];
}

/**
 * Bookmaker data
 */
export interface OddsApiBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsApiMarket[];
}

/**
 * Market data (h2h, spreads, totals, etc.)
 */
export interface OddsApiMarket {
  key: string;
  last_update?: string;
  outcomes: OddsApiOutcome[];
}

/**
 * Outcome within a market
 */
export interface OddsApiOutcome {
  name: string;
  price: number;
  point?: number; // For spreads/totals
  description?: string;
}

/**
 * Grouped sports for UI
 */
export interface OddsApiSportGroup {
  group: string;
  sports: OddsApiSport[];
}

/**
 * Standard API response wrapper
 */
export interface OddsApiResponse<T> {
  data: T;
  requestsRemaining: number;
  requestsUsed: number;
}

// ============================================
// CLIENT OPTIONS
// ============================================

export interface GetOddsOptions {
  /** Regions to fetch odds from (default: ['eu']) */
  regions?: string[];
  /** Markets to include (default: ['h2h', 'totals']) */
  markets?: string[];
  /** Odds format (default: 'decimal') */
  oddsFormat?: 'decimal' | 'american';
  /** Filter by specific bookmakers */
  bookmakers?: string[];
  /** Date filter for events */
  dateFormat?: 'iso' | 'unix';
}

// ============================================
// API CLIENT CLASS
// ============================================

class TheOddsApiClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ODDS_API_KEY || '';
    this.baseUrl = ODDS_API_BASE_URL;
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Get API key for requests
   */
  private getApiKey(): string {
    if (!this.apiKey) {
      throw new Error('ODDS_API_KEY environment variable is not set');
    }
    return this.apiKey;
  }

  /**
   * Parse response headers for quota info
   */
  private parseQuotaHeaders(response: Response): { remaining: number; used: number } {
    return {
      remaining: parseInt(response.headers.get('x-requests-remaining') || '0', 10),
      used: parseInt(response.headers.get('x-requests-used') || '0', 10),
    };
  }

  /**
   * GET /sports - Fetch all available sports
   * 
   * This endpoint is FREE and does not use API quota.
   */
  async getSports(): Promise<OddsApiResponse<OddsApiSport[]>> {
    const apiKey = this.getApiKey();
    
    const response = await fetch(
      `${this.baseUrl}/sports?apiKey=${apiKey}`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch sports: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const quota = this.parseQuotaHeaders(response);

    return {
      data,
      requestsRemaining: quota.remaining,
      requestsUsed: quota.used,
    };
  }

  /**
   * GET /sports/{sport_key}/events - Fetch events for a sport
   * 
   * This endpoint is FREE and does not use API quota.
   */
  async getEvents(sportKey: string): Promise<OddsApiResponse<OddsApiEvent[]>> {
    const apiKey = this.getApiKey();
    
    const response = await fetch(
      `${this.baseUrl}/sports/${sportKey}/events?apiKey=${apiKey}`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch events for ${sportKey}: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const quota = this.parseQuotaHeaders(response);

    return {
      data,
      requestsRemaining: quota.remaining,
      requestsUsed: quota.used,
    };
  }

  /**
   * GET /sports/{sport_key}/odds - Fetch odds for a sport
   * 
   * WARNING: This endpoint USES API quota (1 per region/market combo)
   */
  async getOddsForSport(
    sportKey: string,
    options: GetOddsOptions = {}
  ): Promise<OddsApiResponse<OddsApiEvent[]>> {
    const apiKey = this.getApiKey();
    
    const {
      regions = ['eu', 'us', 'uk', 'au'],
      markets = ['h2h', 'totals'],
      oddsFormat = 'decimal',
      bookmakers,
    } = options;

    const params = new URLSearchParams({
      apiKey,
      regions: regions.join(','),
      markets: markets.join(','),
      oddsFormat,
    });

    if (bookmakers && bookmakers.length > 0) {
      params.set('bookmakers', bookmakers.join(','));
    }

    const response = await fetch(
      `${this.baseUrl}/sports/${sportKey}/odds?${params}`,
      {
        cache: 'no-store', // Don't cache odds - they change frequently
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch odds for ${sportKey}: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const quota = this.parseQuotaHeaders(response);

    return {
      data,
      requestsRemaining: quota.remaining,
      requestsUsed: quota.used,
    };
  }

  /**
   * GET /sports/{sport_key}/events/{event_id}/odds - Fetch odds for specific event
   * 
   * WARNING: This endpoint USES API quota
   */
  async getEventOdds(
    sportKey: string,
    eventId: string,
    options: GetOddsOptions = {}
  ): Promise<OddsApiResponse<OddsApiEvent>> {
    const apiKey = this.getApiKey();
    
    const {
      regions = ['eu', 'us', 'uk', 'au'],
      markets = ['h2h', 'totals'],
      oddsFormat = 'decimal',
    } = options;

    const params = new URLSearchParams({
      apiKey,
      regions: regions.join(','),
      markets: markets.join(','),
      oddsFormat,
    });

    const response = await fetch(
      `${this.baseUrl}/sports/${sportKey}/events/${eventId}/odds?${params}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch event odds: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const quota = this.parseQuotaHeaders(response);

    return {
      data,
      requestsRemaining: quota.remaining,
      requestsUsed: quota.used,
    };
  }

  /**
   * GET /sports/upcoming/odds - Fetch upcoming events across all sports
   * 
   * WARNING: This endpoint USES API quota
   */
  async getUpcomingOdds(options: GetOddsOptions = {}): Promise<OddsApiResponse<OddsApiEvent[]>> {
    const apiKey = this.getApiKey();
    
    const {
      regions = ['eu', 'us', 'uk', 'au'],
      markets = ['h2h'],
      oddsFormat = 'decimal',
    } = options;

    const params = new URLSearchParams({
      apiKey,
      regions: regions.join(','),
      markets: markets.join(','),
      oddsFormat,
    });

    const response = await fetch(
      `${this.baseUrl}/sports/upcoming/odds?${params}`,
      {
        cache: 'no-store', // Don't cache odds - they change frequently
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch upcoming odds: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const quota = this.parseQuotaHeaders(response);

    return {
      data,
      requestsRemaining: quota.remaining,
      requestsUsed: quota.used,
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const theOddsClient = new TheOddsApiClient();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Group sports by category for UI display
 */
export function groupSportsByCategory(sports: OddsApiSport[]): OddsApiSportGroup[] {
  const groups: Record<string, OddsApiSport[]> = {};

  for (const sport of sports) {
    if (!sport.active) continue;
    
    if (!groups[sport.group]) {
      groups[sport.group] = [];
    }
    groups[sport.group].push(sport);
  }

  return Object.entries(groups)
    .map(([group, sports]) => ({
      group,
      sports: sports.sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => a.group.localeCompare(b.group));
}

/**
 * Calculate average odds across all bookmakers
 */
export function calculateAverageOdds(event: OddsApiEvent): {
  home: number;
  draw: number | null;
  away: number;
} {
  if (!event.bookmakers || event.bookmakers.length === 0) {
    return { home: 0, draw: null, away: 0 };
  }

  let homeSum = 0;
  let drawSum = 0;
  let awaySum = 0;
  let homeCount = 0;
  let drawCount = 0;
  let awayCount = 0;

  for (const bookmaker of event.bookmakers) {
    const h2h = bookmaker.markets.find(m => m.key === 'h2h');
    if (!h2h) continue;

    for (const outcome of h2h.outcomes) {
      if (outcome.name === event.home_team) {
        homeSum += outcome.price;
        homeCount++;
      } else if (outcome.name === event.away_team) {
        awaySum += outcome.price;
        awayCount++;
      } else if (outcome.name === 'Draw') {
        drawSum += outcome.price;
        drawCount++;
      }
    }
  }

  return {
    home: homeCount > 0 ? Math.round((homeSum / homeCount) * 100) / 100 : 0,
    draw: drawCount > 0 ? Math.round((drawSum / drawCount) * 100) / 100 : null,
    away: awayCount > 0 ? Math.round((awaySum / awayCount) * 100) / 100 : 0,
  };
}

/**
 * Extract totals (over/under) from bookmakers
 */
export function extractTotals(event: OddsApiEvent): {
  line: number | null;
  over: number | null;
  under: number | null;
} {
  if (!event.bookmakers || event.bookmakers.length === 0) {
    return { line: null, over: null, under: null };
  }

  for (const bookmaker of event.bookmakers) {
    const totals = bookmaker.markets.find(m => m.key === 'totals');
    if (totals && totals.outcomes.length >= 2) {
      const overOutcome = totals.outcomes.find(o => o.name === 'Over');
      const underOutcome = totals.outcomes.find(o => o.name === 'Under');
      
      if (overOutcome && underOutcome) {
        return {
          line: overOutcome.point || null,
          over: overOutcome.price,
          under: underOutcome.price,
        };
      }
    }
  }

  return { line: null, over: null, under: null };
}

/**
 * Convert decimal odds to implied probability
 */
export function oddsToImpliedProbability(decimalOdds: number): number {
  if (decimalOdds <= 0) return 0;
  return Math.round((1 / decimalOdds) * 10000) / 100;
}

/**
 * Find best odds among bookmakers
 */
export function findBestOdds(
  event: OddsApiEvent,
  side: 'home' | 'draw' | 'away'
): { bookmaker: string; odds: number } | null {
  if (!event.bookmakers || event.bookmakers.length === 0) {
    return null;
  }

  let best: { bookmaker: string; odds: number } | null = null;
  const targetName = side === 'home' 
    ? event.home_team 
    : side === 'away' 
      ? event.away_team 
      : 'Draw';

  for (const bookmaker of event.bookmakers) {
    const h2h = bookmaker.markets.find(m => m.key === 'h2h');
    if (!h2h) continue;

    const outcome = h2h.outcomes.find(o => o.name === targetName);
    if (outcome && (!best || outcome.price > best.odds)) {
      best = { bookmaker: bookmaker.title, odds: outcome.price };
    }
  }

  return best;
}

/**
 * Get all bookmaker odds for an event
 */
export function extractBookmakerOdds(event: OddsApiEvent): Array<{
  name: string;
  home: number;
  draw: number | null;
  away: number;
  lastUpdate: string;
}> {
  if (!event.bookmakers) return [];

  return event.bookmakers.map(bm => {
    const h2h = bm.markets.find(m => m.key === 'h2h');
    if (!h2h) return null;

    const homeOutcome = h2h.outcomes.find(o => o.name === event.home_team);
    const awayOutcome = h2h.outcomes.find(o => o.name === event.away_team);
    const drawOutcome = h2h.outcomes.find(o => o.name === 'Draw');

    if (!homeOutcome || !awayOutcome) return null;

    return {
      name: bm.title,
      home: homeOutcome.price,
      draw: drawOutcome?.price ?? null,
      away: awayOutcome.price,
      lastUpdate: bm.last_update,
    };
  }).filter((bm): bm is NonNullable<typeof bm> => bm !== null);
}
