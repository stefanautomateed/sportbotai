/**
 * Accuracy Core - Module 5: Prediction Logging + Backtesting
 * 
 * Persists every prediction for historical analysis.
 * Provides evaluation utilities for model performance.
 * 
 * NO betting metrics (profit, ROI, staking).
 * Only accuracy and calibration metrics.
 */

import {
  PredictionRecord,
  BacktestMetrics,
  CalibrationBucket,
  SportType,
  RawProbabilities,
  CalibratedProbabilities,
  MarketProbabilities,
  EdgeResult,
  DataQuality,
  VolatilityMetrics,
} from './types';

// ============================================
// CALIBRATION METRICS (Data-0: Infrastructure)
// These metrics evaluate model performance
// Moved here from calibration.ts for proper layer separation
// ============================================

/**
 * Calculate Brier score for a set of predictions
 * Lower is better (0 = perfect, 0.25 = random for binary)
 */
export function calculateBrierScore(
  predictions: Array<{ predicted: number; actual: 0 | 1 }>
): number {
  if (predictions.length === 0) return 0;
  
  const sumSquaredError = predictions.reduce((sum, p) => {
    return sum + Math.pow(p.predicted - p.actual, 2);
  }, 0);
  
  return sumSquaredError / predictions.length;
}

/**
 * Calculate log loss for a set of predictions
 * Lower is better
 */
export function calculateLogLoss(
  predictions: Array<{ predicted: number; actual: 0 | 1 }>
): number {
  if (predictions.length === 0) return 0;
  
  const epsilon = 1e-15; // Avoid log(0)
  
  const sumLogLoss = predictions.reduce((sum, p) => {
    const clipped = Math.max(epsilon, Math.min(1 - epsilon, p.predicted));
    if (p.actual === 1) {
      return sum - Math.log(clipped);
    } else {
      return sum - Math.log(1 - clipped);
    }
  }, 0);
  
  return sumLogLoss / predictions.length;
}

/**
 * Create calibration buckets for analysis
 */
export function createCalibrationBuckets(
  predictions: Array<{ predicted: number; actual: 0 | 1 }>,
  numBuckets: number = 10
): CalibrationBucket[] {
  const buckets: CalibrationBucket[] = [];
  const bucketSize = 1 / numBuckets;
  
  for (let i = 0; i < numBuckets; i++) {
    const rangeMin = i * bucketSize;
    const rangeMax = (i + 1) * bucketSize;
    
    const inBucket = predictions.filter(
      p => p.predicted >= rangeMin && p.predicted < rangeMax
    );
    
    const wins = inBucket.filter(p => p.actual === 1).length;
    const expectedWinRate = (rangeMin + rangeMax) / 2;
    const actualWinRate = inBucket.length > 0 ? wins / inBucket.length : 0;
    
    buckets.push({
      range: [rangeMin, rangeMax],
      predictions: inBucket.length,
      wins,
      expectedWinRate,
      actualWinRate,
      calibrationError: Math.abs(expectedWinRate - actualWinRate),
    });
  }
  
  return buckets;
}

/**
 * Calculate Expected Calibration Error (ECE)
 * Weighted average of calibration errors across buckets
 */
export function calculateECE(buckets: CalibrationBucket[]): number {
  const totalPredictions = buckets.reduce((sum, b) => sum + b.predictions, 0);
  if (totalPredictions === 0) return 0;
  
  const weightedError = buckets.reduce((sum, b) => {
    return sum + (b.predictions / totalPredictions) * b.calibrationError;
  }, 0);
  
  return weightedError;
}

// ============================================
// PREDICTION STORAGE (In-Memory + Prisma)
// ============================================

/**
 * In-memory prediction store for quick access
 * In production, this should be backed by Prisma
 * Using Record for ES5 compatibility
 */
const predictionStore: Record<string, PredictionRecord> = {};

/**
 * Generate unique prediction ID
 */
function generatePredictionId(matchId: string, timestamp: Date): string {
  return `pred_${matchId}_${timestamp.getTime()}`;
}

/**
 * Get all prediction IDs
 */
function getStoreKeys(): string[] {
  return Object.keys(predictionStore);
}

/**
 * Log a new prediction
 */
export async function logPrediction(params: {
  matchId: string;
  sport: SportType;
  league: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: Date;
  rawProbabilities: RawProbabilities;
  calibratedProbabilities: CalibratedProbabilities;
  marketProbabilities: MarketProbabilities;
  edge: EdgeResult;
  dataQuality: DataQuality;
  volatility: VolatilityMetrics;
}): Promise<PredictionRecord> {
  const timestamp = new Date();
  const id = generatePredictionId(params.matchId, timestamp);
  
  const record: PredictionRecord = {
    id,
    timestamp,
    sport: params.sport,
    league: params.league,
    matchId: params.matchId,
    homeTeam: params.homeTeam,
    awayTeam: params.awayTeam,
    kickoff: params.kickoff,
    rawProbabilities: params.rawProbabilities,
    calibratedProbabilities: params.calibratedProbabilities,
    marketProbabilities: params.marketProbabilities,
    edge: params.edge,
    dataQuality: params.dataQuality,
    volatility: params.volatility,
  };
  
  // Store in memory
  predictionStore[id] = record;
  
  // In production, also persist to database
  // await prisma.predictionLog.create({ data: record });
  
  return record;
}

/**
 * Update prediction with final result
 */
export async function settlePrediction(
  matchId: string,
  result: {
    homeScore: number;
    awayScore: number;
  },
  closingOdds?: {
    home: number;
    away: number;
    draw?: number;
  }
): Promise<PredictionRecord | null> {
  // Find prediction by matchId
  let found: PredictionRecord | null = null;
  
  const keys = getStoreKeys();
  for (let i = 0; i < keys.length; i++) {
    const record = predictionStore[keys[i]];
    if (record.matchId === matchId && !record.result) {
      found = record;
      break;
    }
  }
  
  if (!found) return null;
  
  // Determine outcome
  let outcome: 'home' | 'away' | 'draw';
  if (result.homeScore > result.awayScore) {
    outcome = 'home';
  } else if (result.awayScore > result.homeScore) {
    outcome = 'away';
  } else {
    outcome = 'draw';
  }
  
  found.result = {
    homeScore: result.homeScore,
    awayScore: result.awayScore,
    outcome,
    settledAt: new Date(),
  };
  
  if (closingOdds) {
    found.closingOdds = {
      ...closingOdds,
      capturedAt: new Date(),
    };
  }
  
  // Update in store
  predictionStore[found.id] = found;
  
  // In production, also update database
  // await prisma.predictionLog.update({ where: { id: found.id }, data: found });
  
  return found;
}

/**
 * Get prediction by ID
 */
export function getPrediction(id: string): PredictionRecord | undefined {
  return predictionStore[id];
}

/**
 * Get all predictions for a match
 */
export function getPredictionsForMatch(matchId: string): PredictionRecord[] {
  const results: PredictionRecord[] = [];
  const keys = getStoreKeys();
  for (let i = 0; i < keys.length; i++) {
    const record = predictionStore[keys[i]];
    if (record.matchId === matchId) {
      results.push(record);
    }
  }
  return results;
}

// ============================================
// BACKTEST UTILITIES
// ============================================

/**
 * Filter predictions for backtesting
 */
export interface BacktestFilter {
  sport?: SportType;
  league?: string;
  startDate?: Date;
  endDate?: Date;
  minDataQuality?: DataQuality['level'];
  settledOnly?: boolean;
}

/**
 * Get predictions matching filter
 */
export function getFilteredPredictions(filter: BacktestFilter = {}): PredictionRecord[] {
  const results: PredictionRecord[] = [];
  
  const keys = getStoreKeys();
  for (let i = 0; i < keys.length; i++) {
    const record = predictionStore[keys[i]];
    // Apply filters
    if (filter.sport && record.sport !== filter.sport) continue;
    if (filter.league && !record.league.toLowerCase().includes(filter.league.toLowerCase())) continue;
    if (filter.startDate && record.kickoff < filter.startDate) continue;
    if (filter.endDate && record.kickoff > filter.endDate) continue;
    if (filter.settledOnly && !record.result) continue;
    
    if (filter.minDataQuality) {
      const qualityLevels: DataQuality['level'][] = ['INSUFFICIENT', 'LOW', 'MEDIUM', 'HIGH'];
      const minIdx = qualityLevels.indexOf(filter.minDataQuality);
      const recordIdx = qualityLevels.indexOf(record.dataQuality.level);
      if (recordIdx < minIdx) continue;
    }
    
    results.push(record);
  }
  
  return results;
}

/**
 * Calculate backtest metrics for a set of predictions
 */
export function calculateBacktestMetrics(
  predictions: PredictionRecord[]
): BacktestMetrics {
  // Filter to settled only
  const settled = predictions.filter(p => p.result);
  
  if (settled.length === 0) {
    return {
      periodStart: new Date(),
      periodEnd: new Date(),
      totalPredictions: 0,
      brierScore: 0,
      logLoss: 0,
      calibrationError: 0,
      calibrationBuckets: [],
      accuracyAtThreshold: [],
      brierScoreVsMarket: 0,
    };
  }
  
  // Date range
  const dates = settled.map(p => p.kickoff);
  const periodStart = new Date(Math.min(...dates.map(d => d.getTime())));
  const periodEnd = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // Prepare data for metrics - evaluate each outcome separately
  const homeEvaluations = settled.map(p => ({
    predicted: p.calibratedProbabilities.home,
    actual: p.result!.outcome === 'home' ? 1 as const : 0 as const,
  }));
  
  const awayEvaluations = settled.map(p => ({
    predicted: p.calibratedProbabilities.away,
    actual: p.result!.outcome === 'away' ? 1 as const : 0 as const,
  }));
  
  // Combine all evaluations
  const allEvaluations = [...homeEvaluations, ...awayEvaluations];
  
  // Calculate metrics
  const brierScore = calculateBrierScore(allEvaluations);
  const logLoss = calculateLogLoss(allEvaluations);
  
  // Calibration buckets
  const calibrationBuckets = createCalibrationBuckets(allEvaluations);
  const calibrationError = calculateECE(calibrationBuckets);
  
  // Accuracy at different confidence thresholds
  const thresholds = [0.50, 0.55, 0.60, 0.65, 0.70, 0.75];
  const accuracyAtThreshold = thresholds.map(threshold => {
    const qualifying = settled.filter(p => {
      const maxProb = Math.max(
        p.calibratedProbabilities.home,
        p.calibratedProbabilities.away,
        p.calibratedProbabilities.draw || 0
      );
      return maxProb >= threshold;
    });
    
    const correct = qualifying.filter(p => {
      const probs = p.calibratedProbabilities;
      let predictedOutcome: 'home' | 'away' | 'draw';
      
      if (probs.home >= probs.away && probs.home >= (probs.draw || 0)) {
        predictedOutcome = 'home';
      } else if (probs.away >= probs.home && probs.away >= (probs.draw || 0)) {
        predictedOutcome = 'away';
      } else {
        predictedOutcome = 'draw';
      }
      
      return predictedOutcome === p.result!.outcome;
    });
    
    return {
      threshold,
      accuracy: qualifying.length > 0 ? correct.length / qualifying.length : 0,
      coverage: qualifying.length / settled.length,
    };
  });
  
  // Compare to market
  const marketEvaluations = settled.map(p => ({
    predicted: p.marketProbabilities.impliedProbabilitiesNoVig.home,
    actual: p.result!.outcome === 'home' ? 1 as const : 0 as const,
  }));
  const marketBrier = calculateBrierScore(marketEvaluations);
  const brierScoreVsMarket = brierScore - marketBrier; // Negative = we're better
  
  // By league breakdown
  const byLeague: Record<string, { brierScore: number; predictions: number }> = {};
  
  const leagueGroups: Record<string, PredictionRecord[]> = {};
  for (let i = 0; i < settled.length; i++) {
    const p = settled[i];
    const league = p.league;
    if (!leagueGroups[league]) {
      leagueGroups[league] = [];
    }
    leagueGroups[league].push(p);
  }
  
  const leagueNames = Object.keys(leagueGroups);
  for (let i = 0; i < leagueNames.length; i++) {
    const league = leagueNames[i];
    const preds = leagueGroups[league];
    const leagueEvals = preds.map((p: PredictionRecord) => ({
      predicted: p.calibratedProbabilities.home,
      actual: p.result!.outcome === 'home' ? 1 as const : 0 as const,
    }));
    byLeague[league] = {
      brierScore: calculateBrierScore(leagueEvals),
      predictions: preds.length,
    };
  }
  
  return {
    periodStart,
    periodEnd,
    totalPredictions: settled.length,
    brierScore,
    logLoss,
    calibrationError,
    calibrationBuckets,
    accuracyAtThreshold,
    brierScoreVsMarket,
    byLeague,
  };
}

// ============================================
// REPORTING UTILITIES
// ============================================

/**
 * Generate calibration report
 */
export function generateCalibrationReport(
  predictions: PredictionRecord[]
): {
  summary: string;
  buckets: CalibrationBucket[];
  overallError: number;
  recommendations: string[];
} {
  const settled = predictions.filter(p => p.result);
  
  if (settled.length < 20) {
    return {
      summary: 'Insufficient data for calibration analysis (need 20+ settled predictions)',
      buckets: [],
      overallError: 0,
      recommendations: ['Collect more predictions before analyzing calibration'],
    };
  }
  
  const evaluations = settled.map(p => ({
    predicted: Math.max(p.calibratedProbabilities.home, p.calibratedProbabilities.away),
    actual: p.result!.outcome === (p.calibratedProbabilities.home > p.calibratedProbabilities.away ? 'home' : 'away') ? 1 as const : 0 as const,
  }));
  
  const buckets = createCalibrationBuckets(evaluations);
  const overallError = calculateECE(buckets);
  
  const recommendations: string[] = [];
  
  // Analyze each bucket
  for (const bucket of buckets) {
    if (bucket.predictions < 5) continue;
    
    const diff = bucket.actualWinRate - bucket.expectedWinRate;
    
    if (diff > 0.1) {
      recommendations.push(
        `Underconfident in ${(bucket.range[0] * 100).toFixed(0)}-${(bucket.range[1] * 100).toFixed(0)}% range: winning ${(bucket.actualWinRate * 100).toFixed(1)}% vs expected ${(bucket.expectedWinRate * 100).toFixed(1)}%`
      );
    } else if (diff < -0.1) {
      recommendations.push(
        `Overconfident in ${(bucket.range[0] * 100).toFixed(0)}-${(bucket.range[1] * 100).toFixed(0)}% range: winning ${(bucket.actualWinRate * 100).toFixed(1)}% vs expected ${(bucket.expectedWinRate * 100).toFixed(1)}%`
      );
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Calibration looks reasonable - no major adjustments needed');
  }
  
  const summary = `Analyzed ${settled.length} predictions. ECE: ${(overallError * 100).toFixed(2)}%`;
  
  return { summary, buckets, overallError, recommendations };
}

/**
 * Generate performance comparison report
 */
export function generatePerformanceReport(
  predictions: PredictionRecord[]
): {
  modelVsMarket: string;
  brierScore: number;
  marketBrierScore: number;
  improvement: number;
  byEdgeQuality: Record<string, { accuracy: number; count: number }>;
} {
  const settled = predictions.filter(p => p.result);
  
  if (settled.length < 10) {
    return {
      modelVsMarket: 'Insufficient data',
      brierScore: 0,
      marketBrierScore: 0,
      improvement: 0,
      byEdgeQuality: {},
    };
  }
  
  // Model predictions
  const modelEvals = settled.map(p => ({
    predicted: p.calibratedProbabilities.home,
    actual: p.result!.outcome === 'home' ? 1 as const : 0 as const,
  }));
  
  // Market predictions
  const marketEvals = settled.map(p => ({
    predicted: p.marketProbabilities.impliedProbabilitiesNoVig.home,
    actual: p.result!.outcome === 'home' ? 1 as const : 0 as const,
  }));
  
  const brierScore = calculateBrierScore(modelEvals);
  const marketBrierScore = calculateBrierScore(marketEvals);
  const improvement = ((marketBrierScore - brierScore) / marketBrierScore) * 100;
  
  let modelVsMarket: string;
  if (improvement > 5) {
    modelVsMarket = `Model outperforming market by ${improvement.toFixed(1)}%`;
  } else if (improvement < -5) {
    modelVsMarket = `Model underperforming market by ${Math.abs(improvement).toFixed(1)}%`;
  } else {
    modelVsMarket = 'Model performing similarly to market';
  }
  
  // By edge quality
  const byEdgeQuality: Record<string, { accuracy: number; count: number }> = {};
  const qualityLevels = ['HIGH', 'MEDIUM', 'LOW', 'SUPPRESSED'];
  
  for (const quality of qualityLevels) {
    const matching = settled.filter(p => p.edge.primaryEdge.quality === quality);
    if (matching.length === 0) continue;
    
    const correct = matching.filter(p => {
      const probs = p.calibratedProbabilities;
      let predicted: 'home' | 'away' | 'draw' = 'home';
      if (probs.away > probs.home && probs.away > (probs.draw || 0)) predicted = 'away';
      if ((probs.draw || 0) > probs.home && (probs.draw || 0) > probs.away) predicted = 'draw';
      return predicted === p.result!.outcome;
    });
    
    byEdgeQuality[quality] = {
      accuracy: correct.length / matching.length,
      count: matching.length,
    };
  }
  
  return {
    modelVsMarket,
    brierScore,
    marketBrierScore,
    improvement,
    byEdgeQuality,
  };
}

// ============================================
// CLV (Closing Line Value) ANALYSIS
// ============================================

/**
 * Calculate closing line value for predictions
 * Positive CLV = beat the closing line
 */
export function calculateCLV(predictions: PredictionRecord[]): {
  averageCLV: number;
  predictions: number;
  distribution: { range: string; count: number }[];
} {
  const withClosing = predictions.filter(p => p.closingOdds);
  
  if (withClosing.length === 0) {
    return { averageCLV: 0, predictions: 0, distribution: [] };
  }
  
  const clvValues: number[] = [];
  
  for (const p of withClosing) {
    // Calculate implied probabilities from closing odds
    const closingHome = 1 / p.closingOdds!.home;
    const closingAway = 1 / p.closingOdds!.away;
    const closingTotal = closingHome + closingAway + (p.closingOdds!.draw ? 1 / p.closingOdds!.draw : 0);
    
    const closingHomeNoVig = closingHome / closingTotal;
    
    // CLV = our probability - closing probability
    const clv = p.calibratedProbabilities.home - closingHomeNoVig;
    clvValues.push(clv);
  }
  
  const averageCLV = clvValues.reduce((a, b) => a + b, 0) / clvValues.length;
  
  // Distribution
  const distribution = [
    { range: '<-5%', count: clvValues.filter(v => v < -0.05).length },
    { range: '-5% to -2%', count: clvValues.filter(v => v >= -0.05 && v < -0.02).length },
    { range: '-2% to +2%', count: clvValues.filter(v => v >= -0.02 && v < 0.02).length },
    { range: '+2% to +5%', count: clvValues.filter(v => v >= 0.02 && v < 0.05).length },
    { range: '>+5%', count: clvValues.filter(v => v >= 0.05).length },
  ];
  
  return {
    averageCLV,
    predictions: withClosing.length,
    distribution,
  };
}

// ============================================
// EXPORT STORE STATS
// ============================================

/**
 * Get store statistics
 */
export function getStoreStats(): {
  total: number;
  settled: number;
  pending: number;
  bySport: Record<string, number>;
} {
  let settled = 0;
  let pending = 0;
  const bySport: Record<string, number> = {};
  
  const keys = getStoreKeys();
  for (let i = 0; i < keys.length; i++) {
    const record = predictionStore[keys[i]];
    if (record.result) {
      settled++;
    } else {
      pending++;
    }
    
    bySport[record.sport] = (bySport[record.sport] || 0) + 1;
  }
  
  return {
    total: keys.length,
    settled,
    pending,
    bySport,
  };
}

/**
 * Clear old predictions (for memory management)
 */
export function pruneOldPredictions(olderThan: Date): number {
  let removed = 0;
  
  const keys = getStoreKeys();
  for (let i = 0; i < keys.length; i++) {
    const id = keys[i];
    const record = predictionStore[id];
    if (record.kickoff < olderThan) {
      delete predictionStore[id];
      removed++;
    }
  }
  
  return removed;
}
