/**
 * Accuracy Core - Module 1: Vig Removal + Implied Probabilities
 * 
 * Converts bookmaker odds to clean, vig-free market probabilities.
 * This is pure math - no AI, no predictions.
 */

import { BookmakerOdds, MarketProbabilities } from './types';

// ============================================
// ODDS CONVERSION UTILITIES
// ============================================

/**
 * Convert decimal odds to implied probability
 * Formula: 1 / odds
 */
export function decimalToImplied(odds: number): number {
  if (odds <= 1) return 1;
  return 1 / odds;
}

/**
 * Convert American odds to implied probability
 */
export function americanToImplied(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

/**
 * Convert fractional odds (e.g., "5/2") to implied probability
 */
export function fractionalToImplied(numerator: number, denominator: number): number {
  return denominator / (numerator + denominator);
}

/**
 * Detect odds format and convert to decimal
 */
export function normalizeToDecimal(odds: number | string): number {
  if (typeof odds === 'string') {
    // Handle fractional like "5/2"
    if (odds.includes('/')) {
      const [num, den] = odds.split('/').map(Number);
      return (num / den) + 1;
    }
    odds = parseFloat(odds);
  }
  
  // American odds detection (typically > 100 or < -100)
  if (odds >= 100) {
    return (odds / 100) + 1;
  } else if (odds <= -100) {
    return (100 / Math.abs(odds)) + 1;
  }
  
  // Already decimal
  return odds;
}

// ============================================
// VIG REMOVAL METHODS
// ============================================

/**
 * Calculate market margin (vig/juice/overround)
 * Sum of implied probabilities - 1
 */
export function calculateMargin(impliedProbs: number[]): number {
  const total = impliedProbs.reduce((sum, p) => sum + p, 0);
  return total - 1;
}

/**
 * Remove vig using proportional normalization (most common method)
 * Simply divide each implied probability by the total
 */
export function removeVigProportional(impliedProbs: number[]): number[] {
  const total = impliedProbs.reduce((sum, p) => sum + p, 0);
  if (total <= 0) return impliedProbs.map(() => 1 / impliedProbs.length);
  return impliedProbs.map(p => p / total);
}

/**
 * Remove vig using power method (Shin's method approximation)
 * Better for markets where favorites are overbet
 * This iteratively finds a power that normalizes probabilities
 */
export function removeVigPowerMethod(impliedProbs: number[], maxIterations = 100): number[] {
  const margin = calculateMargin(impliedProbs);
  if (margin <= 0) return impliedProbs;
  
  // Binary search for the power that normalizes to 1
  let low = 0;
  let high = 1;
  let power = 0.5;
  
  for (let i = 0; i < maxIterations; i++) {
    power = (low + high) / 2;
    const adjusted = impliedProbs.map(p => Math.pow(p, power));
    const total = adjusted.reduce((sum, p) => sum + p, 0);
    
    if (Math.abs(total - 1) < 0.0001) break;
    
    if (total > 1) {
      high = power;
    } else {
      low = power;
    }
  }
  
  const adjusted = impliedProbs.map(p => Math.pow(p, power));
  const total = adjusted.reduce((sum, p) => sum + p, 0);
  return adjusted.map(p => p / total);
}

/**
 * Remove vig using Shin's method
 * Accounts for the presence of informed bettors
 * Better for sharp markets
 */
export function removeVigShin(impliedProbs: number[], maxIterations = 100): number[] {
  const n = impliedProbs.length;
  const sum = impliedProbs.reduce((s, p) => s + p, 0);
  
  // Binary search for z (proportion of informed money)
  let low = 0;
  let high = 0.5;
  let z = 0.1;
  
  for (let i = 0; i < maxIterations; i++) {
    z = (low + high) / 2;
    
    const adjustedSum = impliedProbs.reduce((s, p) => {
      const denom = 1 - z + z * n * p / sum;
      return s + (p / denom);
    }, 0);
    
    if (Math.abs(adjustedSum - 1) < 0.0001) break;
    
    if (adjustedSum > 1) {
      low = z;
    } else {
      high = z;
    }
  }
  
  // Apply Shin adjustment
  return impliedProbs.map(p => {
    const denom = 1 - z + z * n * p / sum;
    return p / denom;
  });
}

// ============================================
// CONSENSUS ODDS CALCULATION
// ============================================

/**
 * Calculate median odds across bookmakers
 * More robust than mean for outlier handling
 */
export function calculateMedianOdds(oddsArray: number[]): number {
  if (oddsArray.length === 0) return 0;
  const sorted = [...oddsArray].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate mean odds with outlier removal
 * Removes odds > 2 standard deviations from mean
 */
export function calculateTrimmedMeanOdds(oddsArray: number[]): number {
  if (oddsArray.length === 0) return 0;
  if (oddsArray.length <= 2) return oddsArray.reduce((a, b) => a + b, 0) / oddsArray.length;
  
  const mean = oddsArray.reduce((a, b) => a + b, 0) / oddsArray.length;
  const stdDev = Math.sqrt(
    oddsArray.reduce((sum, o) => sum + Math.pow(o - mean, 2), 0) / oddsArray.length
  );
  
  const filtered = oddsArray.filter(o => Math.abs(o - mean) <= 2 * stdDev);
  return filtered.length > 0
    ? filtered.reduce((a, b) => a + b, 0) / filtered.length
    : mean;
}

// ============================================
// MAIN MARKET PROBABILITY FUNCTION
// ============================================

export interface MarketProbabilityOptions {
  vigRemovalMethod?: 'proportional' | 'power' | 'shin';
  consensusMethod?: 'median' | 'mean' | 'trimmed';
  minBookmakers?: number;
}

/**
 * Process multiple bookmaker odds into clean market probabilities
 * 
 * @param odds Array of bookmaker odds
 * @param hasDraw Whether this sport has draws
 * @param options Configuration options
 * @returns Clean market probabilities with vig removed
 */
export function calculateMarketProbabilities(
  odds: BookmakerOdds[],
  hasDraw: boolean = true,
  options: MarketProbabilityOptions = {}
): MarketProbabilities {
  const {
    vigRemovalMethod = 'proportional',
    consensusMethod = 'median',
    minBookmakers = 1,
  } = options;
  
  // Filter out invalid odds
  const validOdds = odds.filter(o => 
    o.homeOdds > 1 && 
    o.awayOdds > 1 && 
    (!hasDraw || (o.drawOdds && o.drawOdds > 1))
  );
  
  if (validOdds.length < minBookmakers) {
    // Return default probabilities if insufficient data
    const defaultProb = hasDraw ? 1/3 : 0.5;
    return {
      impliedProbabilitiesRaw: {
        home: defaultProb,
        away: defaultProb,
        draw: hasDraw ? defaultProb : undefined,
      },
      impliedProbabilitiesNoVig: {
        home: defaultProb,
        away: defaultProb,
        draw: hasDraw ? defaultProb : undefined,
      },
      marketMargin: 0,
      bookmakerCount: 0,
      consensusOdds: {
        home: 2.0,
        away: 2.0,
        draw: hasDraw ? 3.0 : undefined,
      },
    };
  }
  
  // Calculate consensus odds
  const homeOddsArray = validOdds.map(o => o.homeOdds);
  const awayOddsArray = validOdds.map(o => o.awayOdds);
  const drawOddsArray = hasDraw ? validOdds.map(o => o.drawOdds!).filter(d => d > 0) : [];
  
  let consensusHome: number;
  let consensusAway: number;
  let consensusDraw: number | undefined;
  
  switch (consensusMethod) {
    case 'trimmed':
      consensusHome = calculateTrimmedMeanOdds(homeOddsArray);
      consensusAway = calculateTrimmedMeanOdds(awayOddsArray);
      consensusDraw = hasDraw ? calculateTrimmedMeanOdds(drawOddsArray) : undefined;
      break;
    case 'mean':
      consensusHome = homeOddsArray.reduce((a, b) => a + b, 0) / homeOddsArray.length;
      consensusAway = awayOddsArray.reduce((a, b) => a + b, 0) / awayOddsArray.length;
      consensusDraw = hasDraw && drawOddsArray.length > 0
        ? drawOddsArray.reduce((a, b) => a + b, 0) / drawOddsArray.length
        : undefined;
      break;
    case 'median':
    default:
      consensusHome = calculateMedianOdds(homeOddsArray);
      consensusAway = calculateMedianOdds(awayOddsArray);
      consensusDraw = hasDraw ? calculateMedianOdds(drawOddsArray) : undefined;
  }
  
  // Calculate raw implied probabilities
  const impliedHome = decimalToImplied(consensusHome);
  const impliedAway = decimalToImplied(consensusAway);
  const impliedDraw = consensusDraw ? decimalToImplied(consensusDraw) : undefined;
  
  const rawProbs = hasDraw
    ? [impliedHome, impliedAway, impliedDraw!]
    : [impliedHome, impliedAway];
  
  // Calculate margin
  const margin = calculateMargin(rawProbs);
  
  // Remove vig
  let cleanProbs: number[];
  switch (vigRemovalMethod) {
    case 'power':
      cleanProbs = removeVigPowerMethod(rawProbs);
      break;
    case 'shin':
      cleanProbs = removeVigShin(rawProbs);
      break;
    case 'proportional':
    default:
      cleanProbs = removeVigProportional(rawProbs);
  }
  
  return {
    impliedProbabilitiesRaw: {
      home: impliedHome,
      away: impliedAway,
      draw: impliedDraw,
    },
    impliedProbabilitiesNoVig: {
      home: cleanProbs[0],
      away: cleanProbs[1],
      draw: hasDraw ? cleanProbs[2] : undefined,
    },
    marketMargin: margin,
    bookmakerCount: validOdds.length,
    consensusOdds: {
      home: consensusHome,
      away: consensusAway,
      draw: consensusDraw,
    },
  };
}

/**
 * Quick utility to get market probabilities from single odds
 */
export function quickMarketProbabilities(
  homeOdds: number,
  awayOdds: number,
  drawOdds?: number
): MarketProbabilities {
  return calculateMarketProbabilities(
    [{ bookmaker: 'single', homeOdds, awayOdds, drawOdds }],
    drawOdds !== undefined
  );
}

// ============================================
// RAW VOLATILITY STATS (Data-1: Pure normalization)
// Interpretation (LOW/MEDIUM/HIGH) belongs in edge-quality.ts (Data-2.5)
// ============================================

/**
 * Raw volatility statistics across bookmakers
 * Returns raw numbers only - NO interpretation
 */
export interface RawOddsVolatility {
  homeStdDev: number;
  awayStdDev: number;
  homeCV: number;      // Coefficient of variation
  awayCV: number;
  avgCV: number;       // Average CV across outcomes
  bookmakerCount: number;
}

/**
 * Calculate raw odds volatility statistics
 * Data-1 layer: Returns raw stats, NO interpretation
 */
export function calculateOddsVolatilityRaw(odds: BookmakerOdds[]): RawOddsVolatility {
  if (odds.length < 2) {
    return {
      homeStdDev: 0,
      awayStdDev: 0,
      homeCV: 0,
      awayCV: 0,
      avgCV: 0,
      bookmakerCount: odds.length,
    };
  }
  
  const homeOdds = odds.map(o => o.homeOdds);
  const awayOdds = odds.map(o => o.awayOdds);
  
  const homeMean = homeOdds.reduce((a, b) => a + b, 0) / homeOdds.length;
  const awayMean = awayOdds.reduce((a, b) => a + b, 0) / awayOdds.length;
  
  const homeStdDev = Math.sqrt(
    homeOdds.reduce((sum, o) => sum + Math.pow(o - homeMean, 2), 0) / homeOdds.length
  );
  const awayStdDev = Math.sqrt(
    awayOdds.reduce((sum, o) => sum + Math.pow(o - awayMean, 2), 0) / awayOdds.length
  );
  
  const homeCV = homeMean > 0 ? homeStdDev / homeMean : 0;
  const awayCV = awayMean > 0 ? awayStdDev / awayMean : 0;
  const avgCV = (homeCV + awayCV) / 2;
  
  return {
    homeStdDev,
    awayStdDev,
    homeCV,
    awayCV,
    avgCV,
    bookmakerCount: odds.length,
  };
}

/**
 * Legacy wrapper - returns single CV number for backward compatibility
 * @deprecated Use calculateOddsVolatilityRaw for full stats
 */
export function calculateOddsVolatility(odds: BookmakerOdds[]): number {
  return calculateOddsVolatilityRaw(odds).avgCV;
}

// ============================================
// RAW DATA QUALITY FLAGS (Data-1: Pure normalization)
// Interpretation (HIGH/MEDIUM/LOW) belongs in edge-quality.ts (Data-2.5)
// ============================================

/**
 * Raw data quality flags - NO interpretation, just facts
 */
export interface RawDataQualityFlags {
  homeGamesPlayed: number;
  awayGamesPlayed: number;
  homeFormLength: number;
  awayFormLength: number;
  h2hGamesCount: number;
  bookmakerCount: number;
  hasHomeScoring: boolean;
  hasAwayScoring: boolean;
}

/**
 * Extract raw data quality flags
 * Data-1 layer: Returns raw flags, NO interpretation
 */
export function extractDataQualityFlags(
  homeStats: { played: number; scored: number },
  awayStats: { played: number; scored: number },
  homeForm: string,
  awayForm: string,
  h2h: { total: number } | undefined,
  bookmakerCount: number
): RawDataQualityFlags {
  return {
    homeGamesPlayed: homeStats.played,
    awayGamesPlayed: awayStats.played,
    homeFormLength: homeForm.length,
    awayFormLength: awayForm.length,
    h2hGamesCount: h2h?.total ?? 0,
    bookmakerCount,
    hasHomeScoring: homeStats.scored > 0,
    hasAwayScoring: awayStats.scored > 0,
  };
}
