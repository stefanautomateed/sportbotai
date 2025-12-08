/**
 * Types for BetSense AI application
 * 
 * Centralized TypeScript types used throughout the application.
 */

// ============================================
// ENUMS & CONSTANTS
// ============================================

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ValueFlag = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
export type Trend = 'RISING' | 'FALLING' | 'STABLE' | 'UNKNOWN';
export type DataQuality = 'LOW' | 'MEDIUM' | 'HIGH';
export type SourceType = 'MANUAL' | 'API';
export type MarketType = '1X2' | 'OVER_UNDER' | 'BTTS' | 'NONE';
export type BestValueSide = 'HOME' | 'DRAW' | 'AWAY' | 'NONE';

// ============================================
// ANALYZER REQUEST TYPES
// ============================================

/**
 * Input data for match analysis (legacy format - kept for backwards compatibility)
 */
export interface AnalyzeRequest {
  sport: string;
  league: string;
  teamA: string;
  teamB: string;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  userPrediction?: string;
  stake?: number;
}

/**
 * Enhanced input data for match analysis
 */
export interface AnalyzeRequestV2 {
  matchData: {
    matchId?: string;
    sport: string;
    league: string;
    homeTeam: string;
    awayTeam: string;
    matchDate?: string;
    sourceType: SourceType;
    odds: {
      home: number;
      draw?: number | null;
      away: number;
      overUnderLine?: number;
      over?: number;
      under?: number;
    };
    bookmakerCount?: number;
  };
  userPick?: string;
  userStake?: number;
}

// ============================================
// ANALYZER RESPONSE TYPES (NEW SCHEMA)
// ============================================

/**
 * Match information section
 */
export interface MatchInfo {
  matchId: string | null;
  sport: string;
  leagueName: string;
  matchDate: string;
  homeTeam: string;
  awayTeam: string;
  sourceType: SourceType;
  dataQuality: DataQuality;
}

/**
 * Probability estimates
 */
export interface Probabilities {
  homeWin: number | null;
  draw: number | null;
  awayWin: number | null;
  overUnderLine: number | null;
  over: number | null;
  under: number | null;
}

/**
 * Value analysis section
 */
export interface ValueAnalysis {
  impliedProbabilities: {
    homeWin: number | null;
    draw: number | null;
    awayWin: number | null;
  };
  valueFlags: {
    homeWin: ValueFlag;
    draw: ValueFlag;
    awayWin: ValueFlag;
  };
  bestValueSide: BestValueSide;
  valueCommentShort: string;
  valueCommentDetailed: string;
}

/**
 * Risk analysis section
 */
export interface RiskAnalysis {
  overallRiskLevel: RiskLevel;
  riskExplanation: string;
  bankrollImpact: string;
  psychologicalBias: {
    name: string;
    description: string;
  };
}

/**
 * Momentum and form section
 */
export interface MomentumAndForm {
  homeMomentumScore: number | null;
  awayMomentumScore: number | null;
  homeTrend: Trend;
  awayTrend: Trend;
  keyFormFactors: string[];
}

/**
 * Market stability for a single market
 */
export interface MarketStabilityItem {
  stability: RiskLevel;
  confidence: 1 | 2 | 3 | 4 | 5;
  comment: string;
}

/**
 * Market stability section
 */
export interface MarketStability {
  markets: {
    main_1x2: MarketStabilityItem;
    over_under: MarketStabilityItem;
    btts: MarketStabilityItem;
  };
  safestMarketType: MarketType;
  safestMarketExplanation: string;
}

/**
 * Upset potential section
 */
export interface UpsetPotential {
  upsetProbability: number;
  upsetComment: string;
}

/**
 * Tactical analysis section
 */
export interface TacticalAnalysis {
  stylesSummary: string;
  matchNarrative: string;
  keyMatchFactors: string[];
  expertConclusionOneLiner: string;
}

/**
 * User context section
 */
export interface UserContext {
  userPick: string | null;
  userStake: number | null;
  pickComment: string;
}

/**
 * Responsible gambling section
 */
export interface ResponsibleGambling {
  coreNote: string;
  tailoredNote: string;
}

/**
 * Meta information section
 */
export interface AnalysisMeta {
  modelVersion: string;
  analysisGeneratedAt: string;
  dataSourcesUsed: string[];
  warnings: string[];
}

/**
 * Complete analysis response (new schema)
 */
export interface AnalyzeResponseV2 {
  success: boolean;
  confidenceScore: number;
  matchInfo: MatchInfo;
  probabilities: Probabilities;
  valueAnalysis: ValueAnalysis;
  riskAnalysis: RiskAnalysis;
  momentumAndForm: MomentumAndForm;
  marketStability: MarketStability;
  upsetPotential: UpsetPotential;
  tacticalAnalysis: TacticalAnalysis;
  userContext: UserContext;
  responsibleGambling: ResponsibleGambling;
  meta: AnalysisMeta;
  error?: string;
}

/**
 * Legacy response format (kept for backwards compatibility)
 */
export interface AnalyzeResponse {
  probabilities: {
    homeWin: number | null;
    draw: number | null;
    awayWin: number | null;
    over: number | null;
    under: number | null;
  };
  valueComment: string;
  riskLevel: RiskLevel;
  analysisSummary: string;
  responsibleGamblingNote: string;
}

// ============================================
// MATCH DATA TYPES
// ============================================

/**
 * Request for match data endpoint
 */
export interface MatchDataRequest {
  sportKey: string;
  eventId?: string;
}

/**
 * Processed match data for analysis
 */
export interface MatchData {
  matchId: string;
  sport: string;
  sportKey: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  sourceType: SourceType;
  odds: {
    home: number;
    draw: number | null;
    away: number;
    overUnderLine?: number;
    over?: number;
    under?: number;
  };
  bookmakers: {
    name: string;
    home: number;
    draw: number | null;
    away: number;
  }[];
  averageOdds: {
    home: number;
    draw: number | null;
    away: number;
  };
  impliedProbabilities: {
    home: number;
    draw: number | null;
    away: number;
  };
}

/**
 * Response from match data endpoint
 */
export interface MatchDataResponse {
  success: boolean;
  data?: MatchData;
  events?: MatchData[];
  error?: string;
  requestsRemaining?: number;
}

// ============================================
// STRIPE TYPES
// ============================================

/**
 * Request for creating Stripe checkout session
 */
export interface CreateCheckoutSessionRequest {
  priceId: string;
  planName: string;
}

/**
 * Response from Stripe checkout session
 */
export interface CreateCheckoutSessionResponse {
  url: string;
}

// ============================================
// PRICING TYPES
// ============================================

/**
 * Pricing plan
 */
export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  priceId: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
}
