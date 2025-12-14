/**
 * SportBot Call Tracker
 * 
 * Tracks predictions made by SportBot and validates them post-match.
 * Supports "Called it ✅" and "Missed this one 📉" automated posts.
 */

import { getTwitterClient, formatForTwitter } from './twitter-client';
import { getCatchphrase } from './sportbot-brain';

// ============================================
// TYPES
// ============================================

export type PredictionType = 
  | 'MATCH_RESULT'      // Win/Draw/Loss
  | 'OVER_UNDER'        // Goals over/under
  | 'BTTS'              // Both teams to score
  | 'PLAYER_PROP'       // Player performance
  | 'FIRST_SCORER'      // First goalscorer
  | 'CLEAN_SHEET'       // Clean sheet prediction
  | 'CORNER_COUNT'      // Corner predictions
  | 'CARD_COUNT';       // Card predictions

export type PredictionOutcome = 'PENDING' | 'HIT' | 'MISS' | 'PUSH' | 'VOID';

export interface Prediction {
  id: string;
  createdAt: Date;
  matchId: string;
  matchName: string;           // "Arsenal vs Chelsea"
  sport: string;               // "football", "basketball"
  league: string;
  
  // The prediction
  type: PredictionType;
  prediction: string;          // "Arsenal Win", "Over 2.5", "Jokic 25+ pts"
  reasoning: string;           // Brief explanation
  conviction: number;          // 1-5 (🔥 level)
  
  // Tweet tracking
  tweetId?: string;            // Original prediction tweet
  validationTweetId?: string;  // "Called it" tweet
  
  // Outcome
  outcome: PredictionOutcome;
  actualResult?: string;       // "Arsenal 2-1 Chelsea"
  validatedAt?: Date;
  
  // Stats
  odds?: number;               // Market odds at time of prediction
}

export interface CallTrackerStats {
  total: number;
  hits: number;
  misses: number;
  pending: number;
  pushes: number;
  hitRate: number;
  byConviction: Record<number, { hits: number; total: number; rate: number }>;
  byType: Record<PredictionType, { hits: number; total: number; rate: number }>;
  streak: {
    current: number;
    type: 'win' | 'loss' | null;
    best: number;
    worst: number;
  };
}

// ============================================
// IN-MEMORY STORE (Replace with Prisma later)
// ============================================

const predictions: Map<string, Prediction> = new Map();

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Record a new prediction
 */
export function recordPrediction(
  prediction: Omit<Prediction, 'id' | 'createdAt' | 'outcome'>
): Prediction {
  const id = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newPrediction: Prediction = {
    ...prediction,
    id,
    createdAt: new Date(),
    outcome: 'PENDING',
  };
  
  predictions.set(id, newPrediction);
  console.log('[CallTracker] Recorded prediction:', id, prediction.prediction);
  
  return newPrediction;
}

/**
 * Get a prediction by ID
 */
export function getPrediction(id: string): Prediction | null {
  return predictions.get(id) || null;
}

/**
 * Get all predictions for a match
 */
export function getPredictionsForMatch(matchId: string): Prediction[] {
  return Array.from(predictions.values())
    .filter(p => p.matchId === matchId);
}

/**
 * Get pending predictions
 */
export function getPendingPredictions(): Prediction[] {
  return Array.from(predictions.values())
    .filter(p => p.outcome === 'PENDING');
}

/**
 * Validate a prediction (mark as hit/miss)
 */
export function validatePrediction(
  id: string,
  outcome: 'HIT' | 'MISS' | 'PUSH' | 'VOID',
  actualResult: string
): Prediction | null {
  const prediction = predictions.get(id);
  if (!prediction) return null;
  
  prediction.outcome = outcome;
  prediction.actualResult = actualResult;
  prediction.validatedAt = new Date();
  
  console.log('[CallTracker] Validated prediction:', id, outcome);
  return prediction;
}

/**
 * Get tracker statistics
 */
export function getCallStats(): CallTrackerStats {
  const all = Array.from(predictions.values());
  const resolved = all.filter(p => p.outcome !== 'PENDING' && p.outcome !== 'VOID');
  
  const hits = resolved.filter(p => p.outcome === 'HIT').length;
  const misses = resolved.filter(p => p.outcome === 'MISS').length;
  const pushes = resolved.filter(p => p.outcome === 'PUSH').length;
  const pending = all.filter(p => p.outcome === 'PENDING').length;
  
  // By conviction level
  const byConviction: Record<number, { hits: number; total: number; rate: number }> = {};
  for (let i = 1; i <= 5; i++) {
    const atLevel = resolved.filter(p => p.conviction === i);
    const levelHits = atLevel.filter(p => p.outcome === 'HIT').length;
    byConviction[i] = {
      hits: levelHits,
      total: atLevel.length,
      rate: atLevel.length > 0 ? (levelHits / atLevel.length) * 100 : 0,
    };
  }
  
  // By prediction type
  const types: PredictionType[] = [
    'MATCH_RESULT', 'OVER_UNDER', 'BTTS', 'PLAYER_PROP', 
    'FIRST_SCORER', 'CLEAN_SHEET', 'CORNER_COUNT', 'CARD_COUNT'
  ];
  const byType: Record<PredictionType, { hits: number; total: number; rate: number }> = {} as any;
  
  for (const type of types) {
    const ofType = resolved.filter(p => p.type === type);
    const typeHits = ofType.filter(p => p.outcome === 'HIT').length;
    byType[type] = {
      hits: typeHits,
      total: ofType.length,
      rate: ofType.length > 0 ? (typeHits / ofType.length) * 100 : 0,
    };
  }
  
  // Calculate streak
  const sortedResolved = resolved.sort((a, b) => 
    (b.validatedAt?.getTime() || 0) - (a.validatedAt?.getTime() || 0)
  );
  
  let currentStreak = 0;
  let streakType: 'win' | 'loss' | null = null;
  let bestStreak = 0;
  let worstStreak = 0;
  let tempStreak = 0;
  let tempType: 'win' | 'loss' | null = null;
  
  for (const p of sortedResolved) {
    const isHit = p.outcome === 'HIT';
    
    if (tempType === null) {
      tempType = isHit ? 'win' : 'loss';
      tempStreak = 1;
    } else if ((isHit && tempType === 'win') || (!isHit && tempType === 'loss')) {
      tempStreak++;
    } else {
      // Streak broken
      if (tempType === 'win' && tempStreak > bestStreak) bestStreak = tempStreak;
      if (tempType === 'loss' && tempStreak > worstStreak) worstStreak = tempStreak;
      
      if (currentStreak === 0) {
        currentStreak = tempStreak;
        streakType = tempType;
      }
      
      tempType = isHit ? 'win' : 'loss';
      tempStreak = 1;
    }
  }
  
  // Handle final streak
  if (tempStreak > 0) {
    if (currentStreak === 0) {
      currentStreak = tempStreak;
      streakType = tempType;
    }
    if (tempType === 'win' && tempStreak > bestStreak) bestStreak = tempStreak;
    if (tempType === 'loss' && tempStreak > worstStreak) worstStreak = tempStreak;
  }
  
  return {
    total: all.length,
    hits,
    misses,
    pending,
    pushes,
    hitRate: resolved.length > 0 ? (hits / resolved.length) * 100 : 0,
    byConviction,
    byType,
    streak: {
      current: currentStreak,
      type: streakType,
      best: bestStreak,
      worst: worstStreak,
    },
  };
}

// ============================================
// TWITTER INTEGRATION
// ============================================

/**
 * Generate "Called it" or "Missed this one" tweet
 */
export function generateValidationTweet(prediction: Prediction): string {
  const conviction = '🔥'.repeat(prediction.conviction);
  
  if (prediction.outcome === 'HIT') {
    const celebrationPhrases = [
      'Called it ✅',
      'The data doesn\'t lie ✅',
      'Pattern recognized ✅',
      'Numbers don\'t miss ✅',
      'Saw that coming ✅',
    ];
    const phrase = celebrationPhrases[Math.floor(Math.random() * celebrationPhrases.length)];
    
    return formatForTwitter(
      `${phrase}\n\n${prediction.matchName}\nPrediction: ${prediction.prediction}\nResult: ${prediction.actualResult}\n\nConviction was ${conviction}`,
      { hashtags: ['SportBot', 'CalledIt'] }
    );
  } else if (prediction.outcome === 'MISS') {
    const missPhrases = [
      'Missed this one 📉',
      'The data had other plans 📉',
      'Variance strikes 📉',
      'Not this time 📉',
    ];
    const phrase = missPhrases[Math.floor(Math.random() * missPhrases.length)];
    
    return formatForTwitter(
      `${phrase}\n\n${prediction.matchName}\nPrediction: ${prediction.prediction}\nResult: ${prediction.actualResult}\n\nTransparency matters. On to the next.`,
      { hashtags: ['SportBot', 'Accountability'] }
    );
  } else {
    return formatForTwitter(
      `Push on ${prediction.matchName}\n\nPrediction: ${prediction.prediction}\nResult: ${prediction.actualResult}\n\nNo winner, no loser.`,
      { hashtags: ['SportBot'] }
    );
  }
}

/**
 * Post validation tweet
 */
export async function postValidationTweet(predictionId: string): Promise<{
  success: boolean;
  tweetId?: string;
  error?: string;
}> {
  const prediction = predictions.get(predictionId);
  if (!prediction) {
    return { success: false, error: 'Prediction not found' };
  }
  
  if (prediction.outcome === 'PENDING') {
    return { success: false, error: 'Prediction not yet validated' };
  }
  
  const twitter = getTwitterClient();
  if (!twitter.isConfigured()) {
    return { success: false, error: 'Twitter not configured' };
  }
  
  const tweetContent = generateValidationTweet(prediction);
  const result = await twitter.postTweet(tweetContent);
  
  if (result.success && result.tweet) {
    prediction.validationTweetId = result.tweet.id;
    return { success: true, tweetId: result.tweet.id };
  }
  
  return { success: false, error: result.error };
}

/**
 * Generate weekly stats tweet
 */
export function generateStatsThread(): string[] {
  const stats = getCallStats();
  
  const tweets: string[] = [];
  
  // Main stats tweet
  tweets.push(formatForTwitter(
    `📊 SportBot Weekly Stats\n\n` +
    `Total Calls: ${stats.total}\n` +
    `Hit Rate: ${stats.hitRate.toFixed(1)}%\n` +
    `Hits: ${stats.hits} | Misses: ${stats.misses}\n\n` +
    `Current Streak: ${stats.streak.current} ${stats.streak.type === 'win' ? '✅' : '❌'}`,
    { hashtags: ['SportBot', 'Transparency'] }
  ));
  
  // Conviction breakdown
  const convictionLines = Object.entries(stats.byConviction)
    .filter(([_, data]) => data.total > 0)
    .map(([level, data]) => `${'🔥'.repeat(Number(level))}: ${data.rate.toFixed(0)}% (${data.hits}/${data.total})`)
    .join('\n');
  
  if (convictionLines) {
    tweets.push(formatForTwitter(
      `Hit Rate by Conviction:\n\n${convictionLines}`,
      { hashtags: [] }
    ));
  }
  
  return tweets;
}

// ============================================
// EXPORT EVERYTHING
// ============================================

export const CallTracker = {
  record: recordPrediction,
  get: getPrediction,
  getForMatch: getPredictionsForMatch,
  getPending: getPendingPredictions,
  validate: validatePrediction,
  getStats: getCallStats,
  generateValidationTweet,
  postValidation: postValidationTweet,
  generateStatsThread,
};
