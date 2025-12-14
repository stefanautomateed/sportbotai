/**
 * Base Adapter Interface
 * 
 * Defines the contract that all sport adapters must implement.
 * Adapters transform provider-specific data into normalized formats.
 */

import {
  Sport,
  DataProvider,
  DataLayerResponse,
  NormalizedTeam,
  NormalizedMatch,
  NormalizedTeamStats,
  NormalizedH2H,
  NormalizedRecentGames,
  NormalizedInjury,
  TeamQuery,
  MatchQuery,
  StatsQuery,
  H2HQuery,
} from '../types';

/**
 * Base interface for all sport adapters
 */
export interface ISportAdapter {
  /** The sport this adapter handles */
  readonly sport: Sport;
  
  /** The data provider this adapter connects to */
  readonly provider: DataProvider;
  
  /** Find a team by name or ID */
  findTeam(query: TeamQuery): Promise<DataLayerResponse<NormalizedTeam>>;
  
  /** Get upcoming or recent matches */
  getMatches(query: MatchQuery): Promise<DataLayerResponse<NormalizedMatch[]>>;
  
  /** Get team statistics for a season */
  getTeamStats(query: StatsQuery): Promise<DataLayerResponse<NormalizedTeamStats>>;
  
  /** Get recent games for a team */
  getRecentGames(teamId: string, limit?: number): Promise<DataLayerResponse<NormalizedRecentGames>>;
  
  /** Get head-to-head history between two teams */
  getH2H(query: H2HQuery): Promise<DataLayerResponse<NormalizedH2H>>;
  
  /** Get injuries for a team (optional - not all providers support this) */
  getInjuries?(teamId: string): Promise<DataLayerResponse<NormalizedInjury[]>>;
  
  /** Check if the adapter is configured and ready */
  isAvailable(): boolean;
}

/**
 * Abstract base class with common functionality
 */
export abstract class BaseSportAdapter implements ISportAdapter {
  abstract readonly sport: Sport;
  abstract readonly provider: DataProvider;
  
  protected apiKey?: string;
  protected baseUrl: string = '';
  protected defaultHeaders: Record<string, string> = {};
  
  constructor(config: AdapterConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || '';
    if (config.headers) {
      this.defaultHeaders = config.headers;
    }
  }
  
  /**
   * Check if the adapter has required configuration
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }
  
  /**
   * Make an API request with error handling
   */
  protected async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: {
          code: 'NOT_CONFIGURED',
          message: `${this.sport} adapter is not configured (missing API key)`,
        },
      };
    }
    
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    };
    
    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        next: options.cache ? { revalidate: options.cache } : undefined,
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: `API request failed: ${response.statusText}`,
          },
        };
      }
      
      const data = await response.json();
      return { success: true, data };
      
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
  
  /**
   * Create a successful response wrapper
   */
  protected success<T>(data: T, cached: boolean = false): DataLayerResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        provider: this.provider,
        cached,
        fetchedAt: new Date(),
      },
    };
  }
  
  /**
   * Create an error response wrapper
   */
  protected error<T>(code: string, message: string): DataLayerResponse<T> {
    return {
      success: false,
      error: {
        code,
        message,
        provider: this.provider,
      },
      metadata: {
        provider: this.provider,
        cached: false,
        fetchedAt: new Date(),
      },
    };
  }
  
  // Abstract methods that must be implemented by concrete adapters
  abstract findTeam(query: TeamQuery): Promise<DataLayerResponse<NormalizedTeam>>;
  abstract getMatches(query: MatchQuery): Promise<DataLayerResponse<NormalizedMatch[]>>;
  abstract getTeamStats(query: StatsQuery): Promise<DataLayerResponse<NormalizedTeamStats>>;
  abstract getRecentGames(teamId: string, limit?: number): Promise<DataLayerResponse<NormalizedRecentGames>>;
  abstract getH2H(query: H2HQuery): Promise<DataLayerResponse<NormalizedH2H>>;
}

// ============================================================================
// Helper Types
// ============================================================================

export interface AdapterConfig {
  apiKey?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  cache?: number; // Revalidation time in seconds
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// Adapter Registry
// ============================================================================

/**
 * Registry for managing sport adapters
 */
export class AdapterRegistry {
  private adapters: Map<Sport, ISportAdapter> = new Map();
  
  register(adapter: ISportAdapter): void {
    this.adapters.set(adapter.sport, adapter);
  }
  
  get(sport: Sport): ISportAdapter | undefined {
    return this.adapters.get(sport);
  }
  
  has(sport: Sport): boolean {
    return this.adapters.has(sport);
  }
  
  getAvailable(): Sport[] {
    return Array.from(this.adapters.entries())
      .filter(([, adapter]) => adapter.isAvailable())
      .map(([sport]) => sport);
  }
  
  all(): ISportAdapter[] {
    return Array.from(this.adapters.values());
  }
}
