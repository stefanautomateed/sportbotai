/**
 * SportBot Scheduler
 * 
 * Handles automated content generation:
 * - Morning Briefings (daily fixtures preview)
 * - Match Previews (before kickoff)
 * - Post-Match Validation (after final whistle)
 * - Weekly Stats Roundup
 */

import { getTwitterClient, formatForTwitter, splitIntoThread } from './twitter-client';
import { 
  getBrainPrompt, 
  getCatchphrase,
  getConvictionDisplay,
  getRandomCatchphrase,
  SIGNATURE_CATCHPHRASES,
} from './sportbot-brain';
import { CallTracker } from './call-tracker';

// ============================================
// TYPES
// ============================================

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  kickoff: Date;
  venue?: string;
  
  // Analysis data (if available)
  homeForm?: string;    // "WWDLW"
  awayForm?: string;
  h2hLast5?: string;    // "3-1-1 (Home favored)"
  
  // Odds
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
}

export interface BriefingConfig {
  sport?: 'football' | 'basketball' | 'all';
  leagues?: string[];
  maxMatches?: number;
  includeOdds?: boolean;
}

// ============================================
// CONTENT GENERATORS
// ============================================

/**
 * Generate morning briefing content
 */
export function generateMorningBriefing(matches: Match[], config?: BriefingConfig): string[] {
  const { maxMatches = 5 } = config || {};
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  
  // Select top matches (by league importance or betting interest)
  const topMatches = matches.slice(0, maxMatches);
  
  if (topMatches.length === 0) {
    return [formatForTwitter(
      `☀️ Morning Briefing - ${dateStr}\n\nQuiet day on the fixture list. Sometimes the best play is no play. Back tomorrow.`,
      { hashtags: ['SportBot'] }
    )];
  }
  
  // Build thread
  const tweets: string[] = [];
  
  // Opening tweet
  tweets.push(formatForTwitter(
    `☀️ Morning Briefing - ${dateStr}\n\n${topMatches.length} matches on the radar today. Let's break them down.\n\n🧵 Thread:`,
    { hashtags: ['SportBot', 'MorningBriefing'] }
  ));
  
  // Match previews
  for (const match of topMatches) {
    const kickoffTime = match.kickoff.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    let matchTweet = `⚽ ${match.homeTeam} vs ${match.awayTeam}\n`;
    matchTweet += `🏆 ${match.league} | ⏰ ${kickoffTime}\n\n`;
    
    if (match.homeForm || match.awayForm) {
      matchTweet += `Form: ${match.homeForm || '?'} vs ${match.awayForm || '?'}\n`;
    }
    
    if (match.homeOdds && match.drawOdds && match.awayOdds) {
      matchTweet += `Market: ${match.homeOdds.toFixed(2)} | ${match.drawOdds.toFixed(2)} | ${match.awayOdds.toFixed(2)}`;
    }
    
    tweets.push(matchTweet.trim());
  }
  
  // Closing tweet with catchphrase
  const catchphrase = getRandomCatchphrase();
  tweets.push(formatForTwitter(
    `That's the slate.\n\n${catchphrase}\n\nBreakdowns coming closer to kickoff. Stay sharp.`,
    { hashtags: [] }
  ));
  
  return tweets;
}

/**
 * Generate individual match preview
 */
export function generateMatchPreview(
  match: Match,
  analysis?: {
    keyFactor: string;
    edge: string;
    prediction?: string;
    conviction?: number;
  }
): string {
  const kickoffTime = match.kickoff.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  let content = `🎯 ${match.homeTeam} vs ${match.awayTeam}\n`;
  content += `${match.league} | ${kickoffTime}\n\n`;
  
  if (analysis) {
    content += `Key Factor: ${analysis.keyFactor}\n`;
    content += `The Edge: ${analysis.edge}\n`;
    
    if (analysis.prediction && analysis.conviction) {
      const convictionEmoji = '🔥'.repeat(analysis.conviction);
      content += `\nLean: ${analysis.prediction} ${convictionEmoji}`;
    }
  } else {
    content += `Analysis incoming. The numbers are still loading.`;
  }
  
  return formatForTwitter(content, { 
    hashtags: ['SportBot', match.league.replace(/\s/g, '')] 
  });
}

/**
 * Generate "hot take" style post
 */
export function generateHotTake(
  topic: string,
  take: string,
  conviction: number
): string {
  const convictionScore = getConvictionDisplay(conviction);
  
  return formatForTwitter(
    `🌶️ HOT TAKE\n\n${take}\n\nConviction: ${convictionScore.emoji}\n${convictionScore.descriptor}`,
    { hashtags: ['SportBot', 'HotTake'] }
  );
}

/**
 * Generate post-match summary
 */
export function generatePostMatchSummary(
  match: Match,
  result: {
    homeScore: number;
    awayScore: number;
    keyMoment?: string;
    surprise?: boolean;
  },
  prediction?: {
    prediction: string;
    wasCorrect: boolean;
  }
): string {
  const scoreline = `${match.homeTeam} ${result.homeScore}-${result.awayScore} ${match.awayTeam}`;
  
  let content = `📋 ${scoreline}\n\n`;
  
  if (result.keyMoment) {
    content += `Key: ${result.keyMoment}\n\n`;
  }
  
  if (prediction) {
    if (prediction.wasCorrect) {
      content += `✅ Called it: "${prediction.prediction}"`;
    } else {
      content += `📉 Missed: Predicted "${prediction.prediction}"`;
    }
  }
  
  if (result.surprise) {
    content += `\n\nThis one defied the data. Variance happens.`;
  }
  
  return formatForTwitter(content, { 
    hashtags: ['SportBot', match.league.replace(/\s/g, '')] 
  });
}

/**
 * Generate weekly stats roundup
 */
export function generateWeeklyRoundup(): string[] {
  return CallTracker.generateStatsThread();
}

// ============================================
// POSTING FUNCTIONS
// ============================================

/**
 * Post morning briefing to Twitter
 */
export async function postMorningBriefing(matches: Match[]): Promise<{
  success: boolean;
  tweetIds?: string[];
  error?: string;
}> {
  const twitter = getTwitterClient();
  
  if (!twitter.isConfigured()) {
    console.log('[Scheduler] Twitter not configured, skipping post');
    return { success: false, error: 'Twitter not configured' };
  }
  
  const tweets = generateMorningBriefing(matches);
  
  if (tweets.length === 1) {
    const result = await twitter.postTweet(tweets[0]);
    return {
      success: result.success,
      tweetIds: result.tweet ? [result.tweet.id] : undefined,
      error: result.error,
    };
  }
  
  const result = await twitter.postThread(tweets);
  return {
    success: result.success,
    tweetIds: result.tweets?.map(t => t.id),
    error: result.error,
  };
}

/**
 * Post match preview to Twitter
 */
export async function postMatchPreview(
  match: Match,
  analysis?: Parameters<typeof generateMatchPreview>[1]
): Promise<{
  success: boolean;
  tweetId?: string;
  error?: string;
}> {
  const twitter = getTwitterClient();
  
  if (!twitter.isConfigured()) {
    return { success: false, error: 'Twitter not configured' };
  }
  
  const content = generateMatchPreview(match, analysis);
  const result = await twitter.postTweet(content);
  
  // If we have a prediction, record it
  if (analysis?.prediction && analysis?.conviction) {
    CallTracker.record({
      matchId: match.id,
      matchName: `${match.homeTeam} vs ${match.awayTeam}`,
      sport: match.sport,
      league: match.league,
      type: 'MATCH_RESULT',
      prediction: analysis.prediction,
      reasoning: analysis.edge,
      conviction: analysis.conviction,
      tweetId: result.tweet?.id,
    });
  }
  
  return {
    success: result.success,
    tweetId: result.tweet?.id,
    error: result.error,
  };
}

// ============================================
// SCHEDULE HELPERS
// ============================================

/**
 * Get optimal posting times (in UTC)
 */
export const POSTING_SCHEDULE = {
  MORNING_BRIEFING: { hour: 7, minute: 0 },   // 7:00 AM UTC
  PRE_MATCH: { minutesBefore: 60 },           // 1 hour before kickoff
  POST_MATCH: { minutesAfter: 15 },           // 15 minutes after FT
  WEEKLY_ROUNDUP: { dayOfWeek: 0, hour: 18 }, // Sunday 6 PM UTC
};

/**
 * Check if it's time for morning briefing
 */
export function isMorningBriefingTime(): boolean {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  
  return (
    utcHour === POSTING_SCHEDULE.MORNING_BRIEFING.hour &&
    utcMinute >= POSTING_SCHEDULE.MORNING_BRIEFING.minute &&
    utcMinute < POSTING_SCHEDULE.MORNING_BRIEFING.minute + 5
  );
}

/**
 * Check if it's time to post pre-match preview
 */
export function isPreMatchTime(kickoff: Date): boolean {
  const now = new Date();
  const minutesToKickoff = (kickoff.getTime() - now.getTime()) / (1000 * 60);
  
  return (
    minutesToKickoff > 55 && 
    minutesToKickoff <= 65
  );
}

/**
 * Check if match is finished and ready for post-match
 */
export function isPostMatchTime(kickoff: Date, status: string): boolean {
  if (status !== 'FT' && status !== 'AET') return false;
  
  const now = new Date();
  const minutesSinceKickoff = (now.getTime() - kickoff.getTime()) / (1000 * 60);
  
  // Standard match ~105 mins, post after that
  return minutesSinceKickoff >= 105 && minutesSinceKickoff <= 120;
}

// ============================================
// EXPORTS
// ============================================

export const SportBotScheduler = {
  // Generators
  generateMorningBriefing,
  generateMatchPreview,
  generateHotTake,
  generatePostMatchSummary,
  generateWeeklyRoundup,
  
  // Posters
  postMorningBriefing,
  postMatchPreview,
  
  // Schedule helpers
  POSTING_SCHEDULE,
  isMorningBriefingTime,
  isPreMatchTime,
  isPostMatchTime,
};
