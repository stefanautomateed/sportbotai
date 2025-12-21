/**
 * Accuracy Core - Type Definitions
 * 
 * Central types for the professional-grade analytics pipeline.
 * All modules reference these types for consistency.
 */

// ============================================
// MARKET DATA TYPES
// ============================================

export type SportType = 'soccer' | 'basketball' | 'football' | 'hockey';

export interface BookmakerOdds {
  bookmaker: string;
  homeOdds: number;
  awayOdds: number;
  drawOdds?: number; // Optional for sports without draws
  timestamp?: Date;
}

export interface MarketProbabilities {
  impliedProbabilitiesRaw: {
    home: number;
    away: number;
    draw?: number;
  };
  impliedProbabilitiesNoVig: {
    home: number;
    away: number;
    draw?: number;
  };
  marketMargin: number; // Vig percentage (e.g., 0.06 = 6%)
  bookmakerCount: number;
  consensusOdds: {
    home: number;
    away: number;
    draw?: number;
  };
}

// ============================================
// MODEL TYPES
// ============================================

export interface TeamStrength {
  attack: number;  // Attack rating (relative to league average = 1.0)
  defense: number; // Defense rating (relative to league average = 1.0)
  overall: number; // Combined strength rating
}

export interface ModelInput {
  sport: SportType;
  homeTeam: string;
  awayTeam: string;
  league: string;
  
  // Team stats
  homeStats: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    scored: number;
    conceded: number;
    homeWins?: number;
    homePlayed?: number;
    homeScored?: number;
    homeConceded?: number;
  };
  awayStats: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    scored: number;
    conceded: number;
    awayWins?: number;
    awayPlayed?: number;
    awayScored?: number;
    awayConceded?: number;
  };
  
  // Recent form (last 5 games: "WWLDW")
  homeForm: string;
  awayForm: string;
  
  // Head-to-head
  h2h?: {
    total: number;
    homeWins: number;
    awayWins: number;
    draws: number;
    homeGoals?: number;
    awayGoals?: number;
  };
  
  // League context
  leagueAverageGoals?: number; // Average goals per game in this league
}

export interface RawProbabilities {
  home: number;
  away: number;
  draw?: number;
  method: string; // e.g., "poisson", "elo", "dixon-coles"
}

export interface CalibratedProbabilities {
  home: number;
  away: number;
  draw?: number;
  calibrationMethod: 'platt' | 'isotonic' | 'none';
  confidenceInterval?: {
    home: [number, number];
    away: [number, number];
    draw?: [number, number];
  };
}

// ============================================
// EDGE & QUALITY TYPES
// ============================================

export type EdgeQuality = 'HIGH' | 'MEDIUM' | 'LOW' | 'SUPPRESSED';

export interface EdgeResult {
  home: number;  // Edge on home outcome (model - market)
  away: number;  // Edge on away outcome
  draw?: number; // Edge on draw outcome
  
  primaryEdge: {
    outcome: 'home' | 'away' | 'draw' | 'none';
    value: number;
    quality: EdgeQuality;
  };
  
  reasons: string[]; // Explains any quality downgrades
}

export interface DataQuality {
  score: number; // 0-100
  level: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  issues: string[];
  
  // Specific checks
  hasMinimumGames: boolean;
  hasRecentForm: boolean;
  hasH2HData: boolean;
  hasMultipleBookmakers: boolean;
  hasCompleteStats: boolean;
}

export interface VolatilityMetrics {
  oddsVolatility: number; // Standard deviation of odds across books
  formVolatility: number; // Variability in recent results
  isVolatile: boolean;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
}

// ============================================
// PREDICTION & LOGGING TYPES
// ============================================

export interface PredictionRecord {
  id: string;
  timestamp: Date;
  
  // Match identification
  sport: SportType;
  league: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: Date;
  
  // Model outputs
  rawProbabilities: RawProbabilities;
  calibratedProbabilities: CalibratedProbabilities;
  
  // Market data
  marketProbabilities: MarketProbabilities;
  
  // Edge analysis
  edge: EdgeResult;
  
  // Quality metrics
  dataQuality: DataQuality;
  volatility: VolatilityMetrics;
  
  // Result (filled after match completion)
  result?: {
    homeScore: number;
    awayScore: number;
    outcome: 'home' | 'away' | 'draw';
    settledAt: Date;
  };
  
  // Closing odds (for CLV analysis)
  closingOdds?: {
    home: number;
    away: number;
    draw?: number;
    capturedAt: Date;
  };
}

export interface CalibrationBucket {
  range: [number, number]; // e.g., [0.50, 0.55]
  predictions: number;
  wins: number;
  expectedWinRate: number;
  actualWinRate: number;
  calibrationError: number;
}

export interface BacktestMetrics {
  periodStart: Date;
  periodEnd: Date;
  totalPredictions: number;
  
  // Core metrics
  brierScore: number;
  logLoss: number;
  
  // Calibration
  calibrationError: number;
  calibrationBuckets: CalibrationBucket[];
  
  // Accuracy
  accuracyAtThreshold: {
    threshold: number;
    accuracy: number;
    coverage: number;
  }[];
  
  // Comparison to market
  brierScoreVsMarket: number; // Difference vs market-implied
  
  // By sport/league breakdown
  byLeague?: Record<string, {
    brierScore: number;
    predictions: number;
  }>;
}

// ============================================
// PIPELINE OUTPUT (What LLM receives)
// ============================================

export interface PipelineOutput {
  // Calibrated probabilities (READ-ONLY for LLM)
  probabilities: CalibratedProbabilities;
  
  // Edge analysis (READ-ONLY for LLM)
  edge: {
    value: number;
    quality: EdgeQuality;
    outcome: 'home' | 'away' | 'draw' | 'none';
  };
  
  // Quality flags (READ-ONLY for LLM)
  dataQuality: DataQuality['level'];
  volatility: VolatilityMetrics['level'];
  
  // Derived signals for narrative
  favored: 'home' | 'away' | 'draw' | 'even';
  confidence: 'high' | 'medium' | 'low';
  
  // Suppress flags
  suppressEdge: boolean;
  suppressReasons: string[];
  
  // Market context
  marketMargin: number;
  bookmakerCount: number;
}
