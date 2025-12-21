/**
 * Accuracy Core - Module 4: Edge Quality Filter
 * 
 * Computes "edge" as ModelProbability - MarketProbability (vig removed).
 * Applies quality filters to determine if edge should be shown.
 * 
 * This is the gatekeeper - prevents false confidence from bad data.
 */

import {
  CalibratedProbabilities,
  MarketProbabilities,
  EdgeResult,
  EdgeQuality,
  DataQuality,
  VolatilityMetrics,
  ModelInput,
  BookmakerOdds,
} from './types';
import { 
  calculateOddsVolatilityRaw, 
  RawOddsVolatility,
  extractDataQualityFlags,
  RawDataQualityFlags,
} from './market-probabilities';

// ============================================
// CONFIGURATION
// ============================================

const EDGE_CONFIG = {
  // Minimum edge to be considered meaningful
  minEdgeThreshold: 0.02,      // 2%
  
  // Edge quality thresholds
  highEdgeThreshold: 0.05,     // 5%+ = high quality edge
  mediumEdgeThreshold: 0.03,   // 3%+ = medium quality
  
  // Data quality requirements
  minGamesPlayed: 5,           // Minimum games for each team
  minBookmakers: 2,            // Minimum books for consensus
  minH2HGames: 2,              // Minimum H2H for pattern
  
  // Volatility thresholds
  volatilityLow: 0.02,         // CV < 2%
  volatilityMedium: 0.05,      // CV < 5%
  volatilityHigh: 0.10,        // CV < 10%
  
  // Suppression triggers
  suppressOnExtreme: true,     // Suppress edge > 20%
  extremeEdgeThreshold: 0.20,  // 20%
  suppressOnLowData: true,     // Suppress when data quality is LOW
  suppressOnHighVolatility: true,
};

// ============================================
// EDGE CALCULATION
// ============================================

/**
 * Calculate raw edge values
 * Edge = Model Probability - Market Probability (no vig)
 */
export function calculateEdge(
  model: CalibratedProbabilities,
  market: MarketProbabilities
): { home: number; away: number; draw?: number } {
  const noVig = market.impliedProbabilitiesNoVig;
  
  return {
    home: model.home - noVig.home,
    away: model.away - noVig.away,
    draw: model.draw !== undefined && noVig.draw !== undefined
      ? model.draw - noVig.draw
      : undefined,
  };
}

/**
 * Find the primary edge (largest positive edge)
 */
function findPrimaryEdge(
  edges: { home: number; away: number; draw?: number }
): { outcome: 'home' | 'away' | 'draw' | 'none'; value: number } {
  const candidates: Array<{ outcome: 'home' | 'away' | 'draw'; value: number }> = [
    { outcome: 'home', value: edges.home },
    { outcome: 'away', value: edges.away },
  ];
  
  if (edges.draw !== undefined) {
    candidates.push({ outcome: 'draw', value: edges.draw });
  }
  
  // Sort by value descending
  candidates.sort((a, b) => b.value - a.value);
  
  const best = candidates[0];
  
  // If best edge is below threshold, no meaningful edge
  if (best.value < EDGE_CONFIG.minEdgeThreshold) {
    return { outcome: 'none', value: 0 };
  }
  
  return best;
}

// ============================================
// DATA QUALITY INTERPRETATION (Data-2.5: Validation/Gating)
// Raw flags come from market-probabilities.ts (Data-1)
// Interpretation (HIGH/MEDIUM/LOW) happens HERE
// ============================================

/**
 * Interpret raw data quality flags into quality assessment
 * Data-2.5 layer: Takes raw flags, produces interpreted quality level
 */
export function interpretDataQuality(flags: RawDataQualityFlags): DataQuality {
  const issues: string[] = [];
  let score = 100;
  
  // Check minimum games played
  const hasMinimumGames = 
    flags.homeGamesPlayed >= EDGE_CONFIG.minGamesPlayed &&
    flags.awayGamesPlayed >= EDGE_CONFIG.minGamesPlayed;
  
  if (!hasMinimumGames) {
    issues.push(`Insufficient games: ${flags.homeGamesPlayed}/${flags.awayGamesPlayed} played (need ${EDGE_CONFIG.minGamesPlayed})`);
    score -= 30;
  }
  
  // Check recent form
  const hasRecentForm = 
    flags.homeFormLength >= 3 &&
    flags.awayFormLength >= 3;
  
  if (!hasRecentForm) {
    issues.push('Limited recent form data');
    score -= 15;
  }
  
  // Check H2H data
  const hasH2HData = flags.h2hGamesCount >= EDGE_CONFIG.minH2HGames;
  
  if (!hasH2HData) {
    issues.push('No head-to-head history');
    score -= 10;
  }
  
  // Check bookmaker coverage
  const hasMultipleBookmakers = flags.bookmakerCount >= EDGE_CONFIG.minBookmakers;
  
  if (!hasMultipleBookmakers) {
    issues.push(`Only ${flags.bookmakerCount} bookmaker(s) - limited market consensus`);
    score -= 20;
  }
  
  // Check complete stats
  const hasCompleteStats = flags.hasHomeScoring && flags.hasAwayScoring;
  
  if (!hasCompleteStats) {
    issues.push('Missing scoring/conceding data');
    score -= 15;
  }
  
  // Determine level (INTERPRETATION happens here)
  let level: DataQuality['level'];
  if (score >= 80) level = 'HIGH';
  else if (score >= 60) level = 'MEDIUM';
  else if (score >= 40) level = 'LOW';
  else level = 'INSUFFICIENT';
  
  return {
    score: Math.max(0, score),
    level,
    issues,
    hasMinimumGames,
    hasRecentForm,
    hasH2HData,
    hasMultipleBookmakers,
    hasCompleteStats,
  };
}

/**
 * Legacy wrapper - extracts flags from ModelInput then interprets
 * @deprecated Use extractDataQualityFlags + interpretDataQuality for proper layer separation
 */
export function assessDataQuality(input: ModelInput, bookmakerCount: number): DataQuality {
  // Extract raw flags (Data-1 operation)
  const flags = extractDataQualityFlags(
    input.homeStats,
    input.awayStats,
    input.homeForm,
    input.awayForm,
    input.h2h,
    bookmakerCount
  );
  
  // Interpret flags (Data-2.5 operation)
  return interpretDataQuality(flags);
}

// ============================================
// VOLATILITY INTERPRETATION (Data-2.5: Validation/Gating)
// Raw stats come from market-probabilities.ts (Data-1)
// Interpretation (LOW/MEDIUM/HIGH) happens HERE
// ============================================

/**
 * Interpret raw volatility into volatility assessment
 * Data-2.5 layer: Takes raw CV, produces interpreted level
 */
export function interpretVolatility(
  rawVolatility: RawOddsVolatility,
  formVolatility: number
): VolatilityMetrics {
  const oddsVolatility = rawVolatility.avgCV;
  const combined = (oddsVolatility + formVolatility) / 2;
  
  // INTERPRETATION happens here (Data-2.5)
  let level: VolatilityMetrics['level'];
  if (combined < EDGE_CONFIG.volatilityLow) level = 'LOW';
  else if (combined < EDGE_CONFIG.volatilityMedium) level = 'MEDIUM';
  else if (combined < EDGE_CONFIG.volatilityHigh) level = 'HIGH';
  else level = 'EXTREME';
  
  return {
    oddsVolatility,
    formVolatility,
    isVolatile: level === 'HIGH' || level === 'EXTREME',
    level,
  };
}

/**
 * Assess volatility of odds and form
 * Uses raw stats from Data-1, interprets here in Data-2.5
 */
export function assessVolatility(
  odds: BookmakerOdds[],
  homeForm: string,
  awayForm: string
): VolatilityMetrics {
  // Get raw volatility (Data-1 operation)
  const rawVolatility = calculateOddsVolatilityRaw(odds);
  
  // Calculate form volatility
  const formVolatility = calculateFormVolatility(homeForm, awayForm);
  
  // Interpret (Data-2.5 operation)
  return interpretVolatility(rawVolatility, formVolatility);
}

/**
 * Calculate form volatility (alternating W/L = high volatility)
 */
function calculateFormVolatility(homeForm: string, awayForm: string): number {
  const countAlternations = (form: string): number => {
    let alternations = 0;
    for (let i = 1; i < form.length; i++) {
      const prev = form[i - 1].toUpperCase();
      const curr = form[i].toUpperCase();
      // Count W->L or L->W transitions
      if ((prev === 'W' && curr === 'L') || (prev === 'L' && curr === 'W')) {
        alternations++;
      }
    }
    return form.length > 1 ? alternations / (form.length - 1) : 0;
  };
  
  const homeVol = countAlternations(homeForm);
  const awayVol = countAlternations(awayForm);
  
  return (homeVol + awayVol) / 2;
}

// ============================================
// EDGE QUALITY DETERMINATION
// ============================================

/**
 * Determine edge quality based on all factors
 */
function determineEdgeQuality(
  edgeValue: number,
  dataQuality: DataQuality,
  volatility: VolatilityMetrics
): { quality: EdgeQuality; reasons: string[] } {
  const reasons: string[] = [];
  
  // Check for suppression conditions first
  
  // 1. Extreme edge (likely data error)
  if (EDGE_CONFIG.suppressOnExtreme && Math.abs(edgeValue) > EDGE_CONFIG.extremeEdgeThreshold) {
    reasons.push(`Edge ${(edgeValue * 100).toFixed(1)}% is suspiciously large - possible data issue`);
    return { quality: 'SUPPRESSED', reasons };
  }
  
  // 2. Insufficient data
  if (EDGE_CONFIG.suppressOnLowData && dataQuality.level === 'INSUFFICIENT') {
    reasons.push('Insufficient data to calculate reliable edge');
    return { quality: 'SUPPRESSED', reasons };
  }
  
  // 3. Extreme volatility
  if (EDGE_CONFIG.suppressOnHighVolatility && volatility.level === 'EXTREME') {
    reasons.push('Market volatility too high for reliable edge calculation');
    return { quality: 'SUPPRESSED', reasons };
  }
  
  // 4. No meaningful edge
  if (edgeValue < EDGE_CONFIG.minEdgeThreshold) {
    reasons.push('No statistically meaningful edge detected');
    return { quality: 'LOW', reasons };
  }
  
  // Determine quality based on edge size and data quality
  let baseQuality: EdgeQuality;
  
  if (edgeValue >= EDGE_CONFIG.highEdgeThreshold) {
    baseQuality = 'HIGH';
  } else if (edgeValue >= EDGE_CONFIG.mediumEdgeThreshold) {
    baseQuality = 'MEDIUM';
  } else {
    baseQuality = 'LOW';
  }
  
  // Downgrade based on data quality
  if (dataQuality.level === 'LOW' && baseQuality === 'HIGH') {
    baseQuality = 'MEDIUM';
    reasons.push('Edge downgraded due to limited data');
  }
  
  if (dataQuality.level === 'LOW' && baseQuality === 'MEDIUM') {
    baseQuality = 'LOW';
    reasons.push('Edge downgraded due to limited data');
  }
  
  // Downgrade based on volatility
  if (volatility.level === 'HIGH') {
    if (baseQuality === 'HIGH') {
      baseQuality = 'MEDIUM';
      reasons.push('Edge downgraded due to high market volatility');
    } else if (baseQuality === 'MEDIUM') {
      baseQuality = 'LOW';
      reasons.push('Edge downgraded due to high market volatility');
    }
  }
  
  // Add positive reasons
  if (baseQuality === 'HIGH') {
    reasons.push(`Strong ${(edgeValue * 100).toFixed(1)}% edge with reliable data`);
  } else if (baseQuality === 'MEDIUM') {
    reasons.push(`Moderate ${(edgeValue * 100).toFixed(1)}% edge detected`);
  }
  
  return { quality: baseQuality, reasons };
}

// ============================================
// MAIN EDGE QUALITY FUNCTION
// ============================================

export interface EdgeQualityInput {
  calibratedProbs: CalibratedProbabilities;
  marketProbs: MarketProbabilities;
  modelInput: ModelInput;
  odds: BookmakerOdds[];
}

/**
 * Main edge quality assessment
 * Returns complete edge analysis with quality rating
 */
export function assessEdgeQuality(input: EdgeQualityInput): EdgeResult {
  const { calibratedProbs, marketProbs, modelInput, odds } = input;
  
  // 1. Calculate raw edges
  const edges = calculateEdge(calibratedProbs, marketProbs);
  
  // 2. Find primary edge
  const primary = findPrimaryEdge(edges);
  
  // 3. Assess data quality
  const dataQuality = assessDataQuality(modelInput, marketProbs.bookmakerCount);
  
  // 4. Assess volatility
  const volatility = assessVolatility(odds, modelInput.homeForm, modelInput.awayForm);
  
  // 5. Determine quality
  const { quality, reasons } = determineEdgeQuality(
    primary.value,
    dataQuality,
    volatility
  );
  
  return {
    home: edges.home,
    away: edges.away,
    draw: edges.draw,
    primaryEdge: {
      outcome: primary.outcome,
      value: primary.value,
      quality,
    },
    reasons,
  };
}

// ============================================
// LEAGUE QUALITY FILTERS
// ============================================

/**
 * Known low-liquidity leagues to filter
 */
const LOW_LIQUIDITY_LEAGUES = [
  'amateur',
  'youth',
  'reserve',
  'women', // Can be enabled separately
  'friendly',
  'cup_early_round',
];

/**
 * Check if league should be filtered
 */
export function shouldFilterLeague(league: string): boolean {
  const normalized = league.toLowerCase();
  
  for (let i = 0; i < LOW_LIQUIDITY_LEAGUES.length; i++) {
    if (normalized.includes(LOW_LIQUIDITY_LEAGUES[i])) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get league quality multiplier for edge calculation
 */
export function getLeagueQualityMultiplier(league: string): number {
  const normalized = league.toLowerCase();
  
  // Top leagues get full weight
  const topLeagues = [
    'premier league', 'la liga', 'bundesliga', 'serie a', 'ligue 1',
    'champions league', 'europa league',
    'nba', 'nfl', 'nhl', 'mlb',
    'eredivisie', 'primeira liga', 'super lig',
  ];
  
  for (const top of topLeagues) {
    if (normalized.includes(top)) return 1.0;
  }
  
  // Second tier leagues
  const tier2 = [
    'championship', 'segunda', '2. bundesliga', 'serie b', 'ligue 2',
    'mls', 'a-league', 'j-league', 'k-league',
  ];
  
  for (const t2 of tier2) {
    if (normalized.includes(t2)) return 0.9;
  }
  
  // Lower leagues get reduced confidence
  return 0.8;
}

// ============================================
// EXPORT COMPLETE QUALITY CHECK
// ============================================

export interface CompleteQualityCheck {
  edge: EdgeResult;
  dataQuality: DataQuality;
  volatility: VolatilityMetrics;
  leagueMultiplier: number;
  shouldSuppress: boolean;
  suppressReasons: string[];
}

/**
 * Run complete quality check on a match
 */
export function runCompleteQualityCheck(input: EdgeQualityInput): CompleteQualityCheck {
  const edge = assessEdgeQuality(input);
  const dataQuality = assessDataQuality(input.modelInput, input.marketProbs.bookmakerCount);
  const volatility = assessVolatility(input.odds, input.modelInput.homeForm, input.modelInput.awayForm);
  const leagueMultiplier = getLeagueQualityMultiplier(input.modelInput.league);
  
  const shouldSuppress = 
    edge.primaryEdge.quality === 'SUPPRESSED' ||
    dataQuality.level === 'INSUFFICIENT' ||
    shouldFilterLeague(input.modelInput.league);
  
  const suppressReasons: string[] = [];
  if (edge.primaryEdge.quality === 'SUPPRESSED') {
    suppressReasons.push(...edge.reasons);
  }
  if (dataQuality.level === 'INSUFFICIENT') {
    suppressReasons.push('Data quality insufficient');
  }
  if (shouldFilterLeague(input.modelInput.league)) {
    suppressReasons.push('Low-liquidity league');
  }
  
  return {
    edge,
    dataQuality,
    volatility,
    leagueMultiplier,
    shouldSuppress,
    suppressReasons,
  };
}
