/**
 * Enhanced Response Metadata Types
 * 
 * Provides granular tracking of data sources, quality, and warnings
 * for frontend display and debugging.
 * 
 * Every API response should include this metadata so the frontend
 * can show: "Verified (live) / Verified (cached) / Limited data"
 */

// ============================================
// SOURCE TRACKING
// ============================================

export type SourceType = 'LIVE' | 'CACHE' | 'DATABASE' | 'FALLBACK' | 'MOCK';

export interface DataSource {
  name: string;                    // e.g., 'API-Sports', 'Redis Cache', 'PostgreSQL'
  type: SourceType;
  fetchedAt: Date;
  latencyMs?: number;
  notes?: string;                  // e.g., 'Partial data', 'Odds stale >5min'
  provider?: string;               // e.g., 'api-football', 'the-odds-api'
  endpoint?: string;               // e.g., '/fixtures', '/odds'
  cacheAge?: number;               // Seconds since cached
  seasonValidated?: boolean;       // Did season validation pass?
}

// ============================================
// DATA QUALITY
// ============================================

export type DataQualityLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';

export interface DataQualityAssessment {
  level: DataQualityLevel;
  score: number;                   // 0-100
  factors: QualityFactor[];
}

export interface QualityFactor {
  name: string;                    // e.g., 'Team Form', 'Head-to-Head', 'Odds'
  available: boolean;
  weight: number;                  // How important is this factor (0-1)
  stale?: boolean;                 // Is this data older than expected?
  partial?: boolean;               // Is this data incomplete?
}

// ============================================
// ENHANCED RESPONSE METADATA
// ============================================

export interface ResponseMetadata {
  // Source tracking
  sources: DataSource[];           // All data sources used
  primarySource: SourceType;       // Main source for this response
  
  // Quality assessment
  dataQuality: DataQualityLevel;
  qualityScore: number;            // 0-100
  
  // Field tracking
  missingFields: string[];         // Fields we couldn't populate
  partialFields: string[];         // Fields with incomplete data
  staleFields: string[];           // Fields with old data
  
  // Warnings (non-alarming, informational)
  warnings: string[];
  
  // Timing
  totalLatencyMs: number;
  fetchedAt: Date;
  
  // Circuit breaker status
  circuitBreakerTriggered: boolean;
  fallbackUsed: boolean;
  
  // Validation
  seasonValidated: boolean;
  leagueValidated: boolean;
  teamsValidated: boolean;
}

// ============================================
// QUALITY CALCULATION HELPERS
// ============================================

const QUALITY_WEIGHTS: Record<string, number> = {
  homeForm: 0.15,
  awayForm: 0.15,
  headToHead: 0.10,
  homeStats: 0.10,
  awayStats: 0.10,
  odds: 0.20,
  injuries: 0.05,
  standings: 0.05,
  weather: 0.02,
  referee: 0.03,
  venue: 0.05,
};

/**
 * Calculate data quality from available factors
 */
export function calculateDataQuality(factors: QualityFactor[]): DataQualityAssessment {
  let totalWeight = 0;
  let weightedScore = 0;

  for (const factor of factors) {
    const weight = factor.weight || QUALITY_WEIGHTS[factor.name] || 0.05;
    totalWeight += weight;

    if (factor.available) {
      let factorScore = 1.0;
      if (factor.stale) factorScore *= 0.7;
      if (factor.partial) factorScore *= 0.8;
      weightedScore += weight * factorScore;
    }
  }

  const score = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
  
  let level: DataQualityLevel;
  if (score >= 80) level = 'HIGH';
  else if (score >= 50) level = 'MEDIUM';
  else if (score >= 20) level = 'LOW';
  else level = 'INSUFFICIENT';

  return { level, score, factors };
}

/**
 * Create response metadata from sources and quality factors
 */
export function createResponseMetadata(params: {
  sources: DataSource[];
  factors: QualityFactor[];
  missingFields?: string[];
  partialFields?: string[];
  staleFields?: string[];
  warnings?: string[];
  totalLatencyMs: number;
  circuitBreakerTriggered?: boolean;
  fallbackUsed?: boolean;
  seasonValidated?: boolean;
  leagueValidated?: boolean;
  teamsValidated?: boolean;
}): ResponseMetadata {
  const quality = calculateDataQuality(params.factors);
  
  // Determine primary source
  const liveSource = params.sources.find(s => s.type === 'LIVE');
  const cacheSource = params.sources.find(s => s.type === 'CACHE');
  const dbSource = params.sources.find(s => s.type === 'DATABASE');
  
  let primarySource: SourceType = 'FALLBACK';
  if (liveSource) primarySource = 'LIVE';
  else if (cacheSource) primarySource = 'CACHE';
  else if (dbSource) primarySource = 'DATABASE';

  // Generate warnings
  const warnings = [...(params.warnings || [])];
  
  if (params.staleFields && params.staleFields.length > 0) {
    warnings.push(`Some data may be outdated: ${params.staleFields.join(', ')}`);
  }
  
  if (params.circuitBreakerTriggered) {
    warnings.push('Using cached data due to API issues');
  }
  
  if (quality.level === 'LOW') {
    warnings.push('Limited data available for this match');
  }

  return {
    sources: params.sources,
    primarySource,
    dataQuality: quality.level,
    qualityScore: quality.score,
    missingFields: params.missingFields || [],
    partialFields: params.partialFields || [],
    staleFields: params.staleFields || [],
    warnings,
    totalLatencyMs: params.totalLatencyMs,
    fetchedAt: new Date(),
    circuitBreakerTriggered: params.circuitBreakerTriggered || false,
    fallbackUsed: params.fallbackUsed || false,
    seasonValidated: params.seasonValidated ?? true,
    leagueValidated: params.leagueValidated ?? true,
    teamsValidated: params.teamsValidated ?? true,
  };
}

// ============================================
// FRONTEND DISPLAY HELPERS
// ============================================

export interface DataStatusDisplay {
  label: string;                   // "Verified (live)" | "Verified (cached)" | "Limited data"
  color: 'green' | 'yellow' | 'orange' | 'red';
  icon: 'check' | 'clock' | 'alert' | 'warning';
  tooltip: string;
}

/**
 * Get display status for frontend
 */
export function getDataStatusDisplay(metadata: ResponseMetadata): DataStatusDisplay {
  if (metadata.dataQuality === 'HIGH' && metadata.primarySource === 'LIVE') {
    return {
      label: 'Verified (live)',
      color: 'green',
      icon: 'check',
      tooltip: 'Fresh data from official sources',
    };
  }
  
  if (metadata.dataQuality === 'HIGH' && metadata.primarySource === 'CACHE') {
    const cacheSource = metadata.sources.find(s => s.type === 'CACHE');
    const ageMin = cacheSource?.cacheAge ? Math.round(cacheSource.cacheAge / 60) : 0;
    return {
      label: 'Verified (cached)',
      color: 'green',
      icon: 'clock',
      tooltip: ageMin > 0 ? `Data from ${ageMin} min ago` : 'Recently cached data',
    };
  }
  
  if (metadata.dataQuality === 'MEDIUM') {
    return {
      label: 'Partial data',
      color: 'yellow',
      icon: 'alert',
      tooltip: metadata.warnings[0] || 'Some data unavailable',
    };
  }
  
  if (metadata.dataQuality === 'LOW') {
    return {
      label: 'Limited data',
      color: 'orange',
      icon: 'warning',
      tooltip: `Missing: ${metadata.missingFields.slice(0, 3).join(', ')}${metadata.missingFields.length > 3 ? '...' : ''}`,
    };
  }
  
  return {
    label: 'Minimal data',
    color: 'red',
    icon: 'warning',
    tooltip: 'Insufficient data for reliable analysis',
  };
}

// ============================================
// STANDARD FIELD NAMES
// ============================================

export const STANDARD_FIELDS = {
  // Team data
  HOME_FORM: 'homeForm',
  AWAY_FORM: 'awayForm',
  HOME_STATS: 'homeStats',
  AWAY_STATS: 'awayStats',
  HEAD_TO_HEAD: 'headToHead',
  
  // Match data
  ODDS: 'odds',
  STANDINGS: 'standings',
  INJURIES: 'injuries',
  SUSPENSIONS: 'suspensions',
  
  // Context
  WEATHER: 'weather',
  VENUE: 'venue',
  REFEREE: 'referee',
  
  // Analysis
  AI_PROBABILITIES: 'aiProbabilities',
  VALUE_EDGES: 'valueEdges',
  NARRATIVE: 'narrative',
} as const;

export type StandardField = typeof STANDARD_FIELDS[keyof typeof STANDARD_FIELDS];
