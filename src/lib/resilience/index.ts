/**
 * Resilience Module Exports
 * 
 * Provides circuit breaker, response metadata, and retry utilities
 * for building robust API integrations.
 */

export {
  // Circuit Breaker
  circuitBreaker,
  apiSportsBreaker,
  oddsApiBreaker,
  openAIBreaker,
  perplexityBreaker,
  fetchWithCircuitBreaker,
  getCircuitHealth,
  type CircuitState,
  type CircuitStats,
  type CircuitBreakerConfig,
  type CircuitBreakerResult,
} from './circuit-breaker';

export {
  // Response Metadata
  calculateDataQuality,
  createResponseMetadata,
  getDataStatusDisplay,
  STANDARD_FIELDS,
  type SourceType,
  type DataSource,
  type DataQualityLevel,
  type DataQualityAssessment,
  type QualityFactor,
  type ResponseMetadata,
  type DataStatusDisplay,
  type StandardField,
} from './response-metadata';
