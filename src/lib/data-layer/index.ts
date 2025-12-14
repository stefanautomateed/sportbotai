/**
 * Unified Data Layer
 * 
 * This is the main entry point for all data access.
 * Agents and consumers interact with this layer only - never directly with APIs.
 * 
 * Benefits:
 * - Single interface for all sports
 * - Provider-agnostic (can swap API-Sports for another provider)
 * - Built-in caching support
 * - Consistent error handling
 * - Type-safe responses
 */

import {
  Sport,
  DataLayerResponse,
  NormalizedTeam,
  NormalizedMatch,
  NormalizedTeamStats,
  NormalizedH2H,
  NormalizedRecentGames,
  NormalizedInjury,
  EnrichedMatchData,
  TeamQuery,
  MatchQuery,
  StatsQuery,
  H2HQuery,
} from './types';

import { ISportAdapter, AdapterRegistry } from './adapters/base';
import { getBasketballAdapter } from './adapters/basketball';
import { getHockeyAdapter } from './adapters/hockey';
import { getNFLAdapter } from './adapters/nfl';
import { getSoccerAdapter } from './adapters/soccer';

/**
 * Data Layer Configuration
 */
export interface DataLayerConfig {
  enableCaching?: boolean;
  cacheTTL?: number; // seconds
  logRequests?: boolean;
}

/**
 * Main Data Layer Class
 */
export class DataLayer {
  private registry: AdapterRegistry;
  private config: DataLayerConfig;
  private cache: Map<string, { data: unknown; expiry: Date }>;
  
  constructor(config: DataLayerConfig = {}) {
    this.config = {
      enableCaching: config.enableCaching ?? true,
      cacheTTL: config.cacheTTL ?? 300, // 5 minutes default
      logRequests: config.logRequests ?? false,
    };
    
    this.registry = new AdapterRegistry();
    this.cache = new Map();
    
    // Register all adapters
    this.registerAdapters();
  }
  
  /**
   * Register all sport adapters
   */
  private registerAdapters(): void {
    this.registry.register(getSoccerAdapter());
    this.registry.register(getBasketballAdapter());
    this.registry.register(getHockeyAdapter());
    this.registry.register(getNFLAdapter());
  }
  
  /**
   * Get adapter for a sport
   */
  private getAdapter(sport: Sport): ISportAdapter | undefined {
    return this.registry.get(sport);
  }
  
  /**
   * Log a request if enabled
   */
  private log(message: string, data?: unknown): void {
    if (this.config.logRequests) {
      console.log(`[DataLayer] ${message}`, data || '');
    }
  }
  
  /**
   * Generate cache key
   */
  private getCacheKey(method: string, params: unknown): string {
    return `${method}:${JSON.stringify(params)}`;
  }
  
  /**
   * Get from cache
   */
  private getFromCache<T>(key: string): T | undefined {
    if (!this.config.enableCaching) return undefined;
    
    const cached = this.cache.get(key);
    if (cached && cached.expiry > new Date()) {
      this.log(`Cache hit: ${key}`);
      return cached.data as T;
    }
    
    return undefined;
  }
  
  /**
   * Set cache
   */
  private setCache(key: string, data: unknown): void {
    if (!this.config.enableCaching) return;
    
    const expiry = new Date(Date.now() + (this.config.cacheTTL! * 1000));
    this.cache.set(key, { data, expiry });
  }
  
  // ============================================================================
  // Public API Methods
  // ============================================================================
  
  /**
   * List available sports
   */
  getAvailableSports(): Sport[] {
    return this.registry.getAvailable();
  }
  
  /**
   * Check if a sport is available
   */
  isSportAvailable(sport: Sport): boolean {
    const adapter = this.getAdapter(sport);
    return adapter?.isAvailable() ?? false;
  }
  
  /**
   * Find a team across any sport
   */
  async findTeam(query: TeamQuery): Promise<DataLayerResponse<NormalizedTeam>> {
    const cacheKey = this.getCacheKey('findTeam', query);
    const cached = this.getFromCache<DataLayerResponse<NormalizedTeam>>(cacheKey);
    if (cached) return cached;
    
    this.log('findTeam', query);
    
    const adapter = this.getAdapter(query.sport);
    if (!adapter) {
      return {
        success: false,
        error: {
          code: 'SPORT_NOT_SUPPORTED',
          message: `Sport "${query.sport}" is not supported`,
        },
        metadata: {
          provider: 'api-sports',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    const result = await adapter.findTeam(query);
    
    if (result.success) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * Get matches for a sport
   */
  async getMatches(query: MatchQuery): Promise<DataLayerResponse<NormalizedMatch[]>> {
    const cacheKey = this.getCacheKey('getMatches', query);
    const cached = this.getFromCache<DataLayerResponse<NormalizedMatch[]>>(cacheKey);
    if (cached) return cached;
    
    this.log('getMatches', query);
    
    const adapter = this.getAdapter(query.sport);
    if (!adapter) {
      return {
        success: false,
        error: {
          code: 'SPORT_NOT_SUPPORTED',
          message: `Sport "${query.sport}" is not supported`,
        },
        metadata: {
          provider: 'api-sports',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    const result = await adapter.getMatches(query);
    
    if (result.success) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * Get team statistics
   */
  async getTeamStats(query: StatsQuery): Promise<DataLayerResponse<NormalizedTeamStats>> {
    const cacheKey = this.getCacheKey('getTeamStats', query);
    const cached = this.getFromCache<DataLayerResponse<NormalizedTeamStats>>(cacheKey);
    if (cached) return cached;
    
    this.log('getTeamStats', query);
    
    const adapter = this.getAdapter(query.sport);
    if (!adapter) {
      return {
        success: false,
        error: {
          code: 'SPORT_NOT_SUPPORTED',
          message: `Sport "${query.sport}" is not supported`,
        },
        metadata: {
          provider: 'api-sports',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    const result = await adapter.getTeamStats(query);
    
    if (result.success) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * Get recent games for a team
   */
  async getRecentGames(
    sport: Sport,
    teamId: string,
    limit?: number
  ): Promise<DataLayerResponse<NormalizedRecentGames>> {
    const cacheKey = this.getCacheKey('getRecentGames', { sport, teamId, limit });
    const cached = this.getFromCache<DataLayerResponse<NormalizedRecentGames>>(cacheKey);
    if (cached) return cached;
    
    this.log('getRecentGames', { sport, teamId, limit });
    
    const adapter = this.getAdapter(sport);
    if (!adapter) {
      return {
        success: false,
        error: {
          code: 'SPORT_NOT_SUPPORTED',
          message: `Sport "${sport}" is not supported`,
        },
        metadata: {
          provider: 'api-sports',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    const result = await adapter.getRecentGames(teamId, limit);
    
    if (result.success) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * Get head-to-head history
   */
  async getH2H(query: H2HQuery): Promise<DataLayerResponse<NormalizedH2H>> {
    const cacheKey = this.getCacheKey('getH2H', query);
    const cached = this.getFromCache<DataLayerResponse<NormalizedH2H>>(cacheKey);
    if (cached) return cached;
    
    this.log('getH2H', query);
    
    const adapter = this.getAdapter(query.sport);
    if (!adapter) {
      return {
        success: false,
        error: {
          code: 'SPORT_NOT_SUPPORTED',
          message: `Sport "${query.sport}" is not supported`,
        },
        metadata: {
          provider: 'api-sports',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    const result = await adapter.getH2H(query);
    
    if (result.success) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * Get injuries for a team (if supported by the sport)
   */
  async getInjuries(sport: Sport, teamId: string): Promise<DataLayerResponse<NormalizedInjury[]>> {
    const cacheKey = this.getCacheKey('getInjuries', { sport, teamId });
    const cached = this.getFromCache<DataLayerResponse<NormalizedInjury[]>>(cacheKey);
    if (cached) return cached;
    
    this.log('getInjuries', { sport, teamId });
    
    const adapter = this.getAdapter(sport);
    if (!adapter) {
      return {
        success: false,
        error: {
          code: 'SPORT_NOT_SUPPORTED',
          message: `Sport "${sport}" is not supported`,
        },
        metadata: {
          provider: 'api-sports',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    if (!adapter.getInjuries) {
      return {
        success: false,
        error: {
          code: 'NOT_SUPPORTED',
          message: `Injuries data is not available for ${sport}`,
        },
        metadata: {
          provider: 'api-sports',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    const result = await adapter.getInjuries(teamId);
    
    if (result.success) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * Get enriched match data for analysis
   * This is the main method agents should use for match analysis
   */
  async getEnrichedMatchData(
    sport: Sport,
    homeTeam: string,
    awayTeam: string,
    options: {
      includeStats?: boolean;
      includeRecentGames?: boolean;
      includeH2H?: boolean;
      includeInjuries?: boolean;
      recentGamesLimit?: number;
      h2hLimit?: number;
    } = {}
  ): Promise<DataLayerResponse<EnrichedMatchData>> {
    const opts = {
      includeStats: options.includeStats ?? true,
      includeRecentGames: options.includeRecentGames ?? true,
      includeH2H: options.includeH2H ?? true,
      includeInjuries: options.includeInjuries ?? true,
      recentGamesLimit: options.recentGamesLimit ?? 5,
      h2hLimit: options.h2hLimit ?? 5,
    };
    
    this.log('getEnrichedMatchData', { sport, homeTeam, awayTeam, options: opts });
    
    // Find both teams
    const [homeTeamResult, awayTeamResult] = await Promise.all([
      this.findTeam({ name: homeTeam, sport }),
      this.findTeam({ name: awayTeam, sport }),
    ]);
    
    if (!homeTeamResult.success || !homeTeamResult.data) {
      return {
        success: false,
        error: {
          code: 'TEAM_NOT_FOUND',
          message: `Could not find home team: ${homeTeam}`,
        },
        metadata: {
          provider: 'api-sports',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    if (!awayTeamResult.success || !awayTeamResult.data) {
      return {
        success: false,
        error: {
          code: 'TEAM_NOT_FOUND',
          message: `Could not find away team: ${awayTeam}`,
        },
        metadata: {
          provider: 'api-sports',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    const home = homeTeamResult.data;
    const away = awayTeamResult.data;
    
    // Fetch all data in parallel
    const promises: Promise<unknown>[] = [];
    
    // Stats
    if (opts.includeStats) {
      promises.push(
        this.getTeamStats({ teamId: home.externalId, sport }),
        this.getTeamStats({ teamId: away.externalId, sport })
      );
    } else {
      promises.push(Promise.resolve(null), Promise.resolve(null));
    }
    
    // Recent games
    if (opts.includeRecentGames) {
      promises.push(
        this.getRecentGames(sport, home.externalId, opts.recentGamesLimit),
        this.getRecentGames(sport, away.externalId, opts.recentGamesLimit)
      );
    } else {
      promises.push(Promise.resolve(null), Promise.resolve(null));
    }
    
    // H2H
    if (opts.includeH2H) {
      promises.push(
        this.getH2H({ team1: homeTeam, team2: awayTeam, sport, limit: opts.h2hLimit })
      );
    } else {
      promises.push(Promise.resolve(null));
    }
    
    // Injuries
    if (opts.includeInjuries) {
      promises.push(
        this.getInjuries(sport, home.externalId),
        this.getInjuries(sport, away.externalId)
      );
    } else {
      promises.push(Promise.resolve(null), Promise.resolve(null));
    }
    
    const [
      homeStats,
      awayStats,
      homeGames,
      awayGames,
      h2h,
      homeInjuries,
      awayInjuries,
    ] = await Promise.all(promises) as [
      DataLayerResponse<NormalizedTeamStats> | null,
      DataLayerResponse<NormalizedTeamStats> | null,
      DataLayerResponse<NormalizedRecentGames> | null,
      DataLayerResponse<NormalizedRecentGames> | null,
      DataLayerResponse<NormalizedH2H> | null,
      DataLayerResponse<NormalizedInjury[]> | null,
      DataLayerResponse<NormalizedInjury[]> | null,
    ];
    
    // Build enriched data
    const enrichedData: EnrichedMatchData = {
      match: {
        id: `${sport}-${home.externalId}-${away.externalId}`,
        externalId: '',
        sport,
        league: home.league || '',
        leagueId: '',
        season: '',
        homeTeam: home,
        awayTeam: away,
        status: 'scheduled',
        date: new Date(),
        provider: 'api-sports',
        fetchedAt: new Date(),
      },
      
      homeTeam: {
        team: home,
        stats: homeStats?.success ? homeStats.data : undefined,
        recentGames: homeGames?.success ? homeGames.data : undefined,
        injuries: homeInjuries?.success ? homeInjuries.data : undefined,
      },
      
      awayTeam: {
        team: away,
        stats: awayStats?.success ? awayStats.data : undefined,
        recentGames: awayGames?.success ? awayGames.data : undefined,
        injuries: awayInjuries?.success ? awayInjuries.data : undefined,
      },
      
      h2h: h2h?.success ? h2h.data : undefined,
      
      fetchedAt: new Date(),
    };
    
    return {
      success: true,
      data: enrichedData,
      metadata: {
        provider: 'api-sports',
        cached: false,
        fetchedAt: new Date(),
      },
    };
  }
  
  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    this.log('Cache cleared');
  }
  
  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let instance: DataLayer | null = null;

/**
 * Get the singleton DataLayer instance
 */
export function getDataLayer(config?: DataLayerConfig): DataLayer {
  if (!instance) {
    instance = new DataLayer(config);
  }
  return instance;
}

/**
 * Create a new DataLayer instance (for testing)
 */
export function createDataLayer(config?: DataLayerConfig): DataLayer {
  return new DataLayer(config);
}
