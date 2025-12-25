/**
 * Circuit Breaker Pattern
 * 
 * Prevents cascading failures by temporarily disabling failing endpoints.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failing, all requests bypass external API and use cache
 * - HALF_OPEN: Testing if service recovered, allowing limited requests
 * 
 * Configuration:
 * - failureThreshold: Number of failures before opening circuit
 * - recoveryTimeout: How long to wait before trying again (ms)
 * - halfOpenRequests: Number of test requests in half-open state
 */

import { cacheGet, cacheSet } from '@/lib/cache';

// ============================================
// TYPES
// ============================================

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  openedAt: Date | null;
  halfOpenAttempts: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Failures before opening (default: 3)
  recoveryTimeout: number;       // Ms to wait before half-open (default: 60000 = 1 min)
  halfOpenRequests: number;      // Test requests in half-open (default: 2)
  resetTimeout: number;          // Ms to reset failure count if no failures (default: 300000 = 5 min)
}

export interface CircuitBreakerResult<T> {
  data: T | null;
  source: 'LIVE' | 'CACHE' | 'FALLBACK';
  circuitState: CircuitState;
  fromCircuitBreaker: boolean;
  latencyMs: number;
}

// ============================================
// DEFAULT CONFIG
// ============================================

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  recoveryTimeout: 60 * 1000,      // 1 minute
  halfOpenRequests: 2,
  resetTimeout: 5 * 60 * 1000,     // 5 minutes
};

// ============================================
// CIRCUIT BREAKER CLASS
// ============================================

class CircuitBreaker {
  private circuits: Map<string, CircuitStats> = new Map();
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get or create circuit for an endpoint
   */
  private getCircuit(endpoint: string): CircuitStats {
    if (!this.circuits.has(endpoint)) {
      this.circuits.set(endpoint, {
        state: 'CLOSED',
        failures: 0,
        successes: 0,
        lastFailure: null,
        lastSuccess: null,
        openedAt: null,
        halfOpenAttempts: 0,
      });
    }
    return this.circuits.get(endpoint)!;
  }

  /**
   * Check if circuit should transition from OPEN to HALF_OPEN
   */
  private shouldTryHalfOpen(circuit: CircuitStats): boolean {
    if (circuit.state !== 'OPEN' || !circuit.openedAt) return false;
    
    const elapsed = Date.now() - circuit.openedAt.getTime();
    return elapsed >= this.config.recoveryTimeout;
  }

  /**
   * Check if failures should be reset (no recent failures)
   */
  private shouldResetFailures(circuit: CircuitStats): boolean {
    if (circuit.failures === 0 || !circuit.lastFailure) return false;
    
    const elapsed = Date.now() - circuit.lastFailure.getTime();
    return elapsed >= this.config.resetTimeout;
  }

  /**
   * Record a successful request
   */
  recordSuccess(endpoint: string): void {
    const circuit = this.getCircuit(endpoint);
    
    circuit.successes++;
    circuit.lastSuccess = new Date();

    if (circuit.state === 'HALF_OPEN') {
      circuit.halfOpenAttempts++;
      
      // If we've had enough successful half-open requests, close the circuit
      if (circuit.halfOpenAttempts >= this.config.halfOpenRequests) {
        console.log(`[CircuitBreaker] ${endpoint}: HALF_OPEN → CLOSED (recovered)`);
        circuit.state = 'CLOSED';
        circuit.failures = 0;
        circuit.halfOpenAttempts = 0;
        circuit.openedAt = null;
      }
    } else if (circuit.state === 'CLOSED') {
      // Reset failure count on success in closed state
      circuit.failures = 0;
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(endpoint: string, error?: Error): void {
    const circuit = this.getCircuit(endpoint);
    
    circuit.failures++;
    circuit.lastFailure = new Date();

    console.warn(`[CircuitBreaker] ${endpoint}: Failure #${circuit.failures}`, error?.message);

    if (circuit.state === 'HALF_OPEN') {
      // Any failure in half-open immediately re-opens the circuit
      console.log(`[CircuitBreaker] ${endpoint}: HALF_OPEN → OPEN (still failing)`);
      circuit.state = 'OPEN';
      circuit.openedAt = new Date();
      circuit.halfOpenAttempts = 0;
    } else if (circuit.state === 'CLOSED' && circuit.failures >= this.config.failureThreshold) {
      // Threshold reached, open the circuit
      console.log(`[CircuitBreaker] ${endpoint}: CLOSED → OPEN (threshold reached)`);
      circuit.state = 'OPEN';
      circuit.openedAt = new Date();
    }
  }

  /**
   * Check if requests should be allowed through
   */
  shouldAllowRequest(endpoint: string): { allowed: boolean; reason: string } {
    const circuit = this.getCircuit(endpoint);

    // Reset failures if no recent failures
    if (this.shouldResetFailures(circuit)) {
      circuit.failures = 0;
    }

    // Check for OPEN → HALF_OPEN transition
    if (this.shouldTryHalfOpen(circuit)) {
      console.log(`[CircuitBreaker] ${endpoint}: OPEN → HALF_OPEN (testing recovery)`);
      circuit.state = 'HALF_OPEN';
      circuit.halfOpenAttempts = 0;
    }

    switch (circuit.state) {
      case 'CLOSED':
        return { allowed: true, reason: 'Circuit closed, normal operation' };
      
      case 'HALF_OPEN':
        return { allowed: true, reason: 'Circuit half-open, testing recovery' };
      
      case 'OPEN':
        const remainingMs = this.config.recoveryTimeout - 
          (Date.now() - (circuit.openedAt?.getTime() || 0));
        return { 
          allowed: false, 
          reason: `Circuit open, retry in ${Math.ceil(remainingMs / 1000)}s` 
        };
      
      default:
        return { allowed: true, reason: 'Unknown state, allowing' };
    }
  }

  /**
   * Get current state of a circuit
   */
  getState(endpoint: string): CircuitStats {
    return { ...this.getCircuit(endpoint) };
  }

  /**
   * Get all circuit states (for monitoring)
   */
  getAllStates(): Record<string, CircuitStats> {
    const states: Record<string, CircuitStats> = {};
    this.circuits.forEach((circuit, endpoint) => {
      states[endpoint] = { ...circuit };
    });
    return states;
  }

  /**
   * Force reset a circuit (for admin/recovery)
   */
  reset(endpoint: string): void {
    console.log(`[CircuitBreaker] ${endpoint}: Force reset`);
    this.circuits.delete(endpoint);
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    endpoint: string,
    fetchFn: () => Promise<T>,
    fallbackFn?: () => Promise<T | null>
  ): Promise<CircuitBreakerResult<T>> {
    const startTime = Date.now();
    const { allowed, reason } = this.shouldAllowRequest(endpoint);

    if (!allowed) {
      console.log(`[CircuitBreaker] ${endpoint}: Skipping (${reason})`);
      
      // Try fallback
      if (fallbackFn) {
        try {
          const fallbackData = await fallbackFn();
          return {
            data: fallbackData,
            source: 'FALLBACK',
            circuitState: this.getCircuit(endpoint).state,
            fromCircuitBreaker: true,
            latencyMs: Date.now() - startTime,
          };
        } catch {
          // Fallback also failed
        }
      }

      return {
        data: null,
        source: 'FALLBACK',
        circuitState: 'OPEN',
        fromCircuitBreaker: true,
        latencyMs: Date.now() - startTime,
      };
    }

    try {
      const data = await fetchFn();
      this.recordSuccess(endpoint);
      
      return {
        data,
        source: 'LIVE',
        circuitState: this.getCircuit(endpoint).state,
        fromCircuitBreaker: false,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      this.recordFailure(endpoint, error instanceof Error ? error : undefined);
      
      // Try fallback on failure
      if (fallbackFn) {
        try {
          const fallbackData = await fallbackFn();
          return {
            data: fallbackData,
            source: 'FALLBACK',
            circuitState: this.getCircuit(endpoint).state,
            fromCircuitBreaker: true,
            latencyMs: Date.now() - startTime,
          };
        } catch {
          // Fallback also failed
        }
      }

      return {
        data: null,
        source: 'FALLBACK',
        circuitState: this.getCircuit(endpoint).state,
        fromCircuitBreaker: true,
        latencyMs: Date.now() - startTime,
      };
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

// Global circuit breaker for all API endpoints
export const circuitBreaker = new CircuitBreaker({
  failureThreshold: 3,       // 3 failures to open
  recoveryTimeout: 60000,    // 1 min before testing
  halfOpenRequests: 2,       // 2 successes to close
  resetTimeout: 300000,      // 5 min to reset counter
});

// ============================================
// ENDPOINT-SPECIFIC BREAKERS
// ============================================

// API-Sports specific (more aggressive recovery for paid API)
export const apiSportsBreaker = new CircuitBreaker({
  failureThreshold: 5,       // More tolerant
  recoveryTimeout: 30000,    // 30 sec (faster recovery)
  halfOpenRequests: 1,
  resetTimeout: 180000,      // 3 min
});

// The Odds API (paid, valuable)
export const oddsApiBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 45000,    // 45 sec
  halfOpenRequests: 1,
  resetTimeout: 300000,
});

// OpenAI (expensive, be careful)
export const openAIBreaker = new CircuitBreaker({
  failureThreshold: 2,       // Strict - it's expensive
  recoveryTimeout: 120000,   // 2 min
  halfOpenRequests: 1,
  resetTimeout: 600000,      // 10 min
});

// Perplexity (web search)
export const perplexityBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 60000,
  halfOpenRequests: 2,
  resetTimeout: 300000,
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Execute with circuit breaker and cache fallback
 */
export async function fetchWithCircuitBreaker<T>(
  endpoint: string,
  cacheKey: string,
  fetchFn: () => Promise<T>,
  cacheTTL: number = 300
): Promise<{ data: T | null; source: 'LIVE' | 'CACHE' | 'UNAVAILABLE'; circuitOpen: boolean }> {
  
  const result = await circuitBreaker.execute(
    endpoint,
    fetchFn,
    async () => {
      // Fallback: try cache
      const cached = await cacheGet<T>(cacheKey);
      return cached;
    }
  );

  // If we got live data, cache it
  if (result.source === 'LIVE' && result.data) {
    await cacheSet(cacheKey, result.data, cacheTTL).catch(() => {});
  }

  return {
    data: result.data,
    source: result.data ? (result.source === 'LIVE' ? 'LIVE' : 'CACHE') : 'UNAVAILABLE',
    circuitOpen: result.circuitState === 'OPEN',
  };
}

/**
 * Get health status of all circuits
 */
export function getCircuitHealth(): {
  healthy: boolean;
  circuits: Record<string, { state: CircuitState; failures: number }>;
} {
  const states = circuitBreaker.getAllStates();
  const apiSportsStates = apiSportsBreaker.getAllStates();
  const oddsStates = oddsApiBreaker.getAllStates();
  const openAIStates = openAIBreaker.getAllStates();

  const allCircuits = {
    ...Object.fromEntries(
      Object.entries(states).map(([k, v]) => [`general:${k}`, { state: v.state, failures: v.failures }])
    ),
    ...Object.fromEntries(
      Object.entries(apiSportsStates).map(([k, v]) => [`api-sports:${k}`, { state: v.state, failures: v.failures }])
    ),
    ...Object.fromEntries(
      Object.entries(oddsStates).map(([k, v]) => [`odds-api:${k}`, { state: v.state, failures: v.failures }])
    ),
    ...Object.fromEntries(
      Object.entries(openAIStates).map(([k, v]) => [`openai:${k}`, { state: v.state, failures: v.failures }])
    ),
  };

  const hasOpenCircuit = Object.values(allCircuits).some(c => c.state === 'OPEN');

  return {
    healthy: !hasOpenCircuit,
    circuits: allCircuits,
  };
}
