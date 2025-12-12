/**
 * Pre-Match Insights Generator
 * 
 * Generates viral, shareable statistics from match data.
 * This is the brain behind the "Match Headlines" feature.
 * 
 * Takes raw form data, H2H, injuries, etc. and produces:
 * - Auto-generated headlines
 * - Streak detection
 * - Goals timing patterns
 * - Home/Away splits
 * - Key absences summary
 */

import {
  PreMatchInsights,
  MatchHeadline,
  TeamStreak,
  GoalsTimingPattern,
  VenueSplit,
  H2HInsights,
  FormMatch,
  HeadToHeadMatch,
  TeamStats,
  InjuryContext,
  PlayerImportance,
} from '@/types';

interface GenerateInsightsParams {
  homeTeam: string;
  awayTeam: string;
  homeForm?: FormMatch[];
  awayForm?: FormMatch[];
  h2h?: HeadToHeadMatch[];
  homeStats?: TeamStats;
  awayStats?: TeamStats;
  injuryContext?: InjuryContext | null;
  homeMomentumScore?: number | null;
  awayMomentumScore?: number | null;
}

/**
 * Main generator function
 */
export function generatePreMatchInsights(params: GenerateInsightsParams): PreMatchInsights {
  const {
    homeTeam,
    awayTeam,
    homeForm = [],
    awayForm = [],
    h2h = [],
    homeStats,
    awayStats,
    injuryContext,
    homeMomentumScore,
    awayMomentumScore,
  } = params;

  // Generate all components
  const homeStreaks = detectStreaks(homeForm, 'all');
  const awayStreaks = detectStreaks(awayForm, 'all');
  
  const h2hInsights = h2h.length > 0 ? generateH2HInsights(h2h, homeTeam, awayTeam) : null;
  
  const keyAbsences = extractKeyAbsences(injuryContext, homeTeam, awayTeam);
  
  // Generate headlines from all available data
  const headlines = generateHeadlines({
    homeTeam,
    awayTeam,
    homeForm,
    awayForm,
    homeStreaks,
    awayStreaks,
    h2hInsights,
    h2h,
    keyAbsences,
    homeStats,
    awayStats,
    homeMomentumScore,
    awayMomentumScore,
  });

  return {
    headlines,
    streaks: {
      home: homeStreaks,
      away: awayStreaks,
    },
    goalsPattern: {
      home: null, // Would need more detailed match data
      away: null,
    },
    venueSplits: {
      home: calculateVenueSplit(homeForm),
      away: calculateVenueSplit(awayForm),
    },
    h2hInsights,
    keyAbsences,
    motivation: {
      home: null, // Would need league position/context
      away: null,
    },
    quickStats: generateQuickStats(homeForm, awayForm, h2h),
  };
}

/**
 * Detect streaks from form data
 */
export function detectStreaks(form: FormMatch[], context: TeamStreak['context']): TeamStreak[] {
  if (!form || form.length === 0) return [];

  const streaks: TeamStreak[] = [];

  // Win streak
  const winStreak = countStreak(form, 'W');
  if (winStreak >= 3) {
    streaks.push({
      type: 'win',
      count: winStreak,
      context,
      description: `Won last ${winStreak} matches`,
      isActive: form[0]?.result === 'W',
    });
  }

  // Unbeaten streak (W or D)
  const unbeatenStreak = countStreakMultiple(form, ['W', 'D']);
  if (unbeatenStreak >= 4 && unbeatenStreak > winStreak) {
    streaks.push({
      type: 'unbeaten',
      count: unbeatenStreak,
      context,
      description: `${unbeatenStreak} games without defeat`,
      isActive: form[0]?.result !== 'L',
    });
  }

  // Loss streak
  const lossStreak = countStreak(form, 'L');
  if (lossStreak >= 3) {
    streaks.push({
      type: 'loss',
      count: lossStreak,
      context,
      description: `Lost last ${lossStreak} matches`,
      isActive: form[0]?.result === 'L',
    });
  }

  // Winless streak
  const winlessStreak = countStreakMultiple(form, ['D', 'L']);
  if (winlessStreak >= 4 && winlessStreak > lossStreak) {
    streaks.push({
      type: 'winless',
      count: winlessStreak,
      context,
      description: `${winlessStreak} games without a win`,
      isActive: form[0]?.result !== 'W',
    });
  }

  // Clean sheet streak (need score data)
  const cleanSheetStreak = countCleanSheets(form);
  if (cleanSheetStreak >= 3) {
    streaks.push({
      type: 'cleanSheet',
      count: cleanSheetStreak,
      context,
      description: `${cleanSheetStreak} consecutive clean sheets`,
      isActive: true,
    });
  }

  // Scoring streak
  const scoringStreak = countScoringGames(form);
  if (scoringStreak >= 5) {
    streaks.push({
      type: 'scored',
      count: scoringStreak,
      context,
      description: `Scored in ${scoringStreak} straight games`,
      isActive: true,
    });
  }

  // BTTS streak
  const bttsStreak = countBTTSGames(form);
  if (bttsStreak >= 4) {
    streaks.push({
      type: 'btts',
      count: bttsStreak,
      context,
      description: `BTTS in ${bttsStreak} consecutive games`,
      isActive: true,
    });
  }

  // Over 2.5 streak
  const over25Streak = countOver25Games(form);
  if (over25Streak >= 4) {
    streaks.push({
      type: 'over25',
      count: over25Streak,
      context,
      description: `Over 2.5 goals in ${over25Streak} straight games`,
      isActive: true,
    });
  }

  return streaks.sort((a, b) => b.count - a.count);
}

function countStreak(form: FormMatch[], result: 'W' | 'D' | 'L'): number {
  let count = 0;
  for (const match of form) {
    if (match.result === result) count++;
    else break;
  }
  return count;
}

function countStreakMultiple(form: FormMatch[], results: Array<'W' | 'D' | 'L'>): number {
  let count = 0;
  for (const match of form) {
    if (results.includes(match.result)) count++;
    else break;
  }
  return count;
}

function countCleanSheets(form: FormMatch[]): number {
  let count = 0;
  for (const match of form) {
    if (match.score) {
      const parts = match.score.split('-').map(s => parseInt(s.trim()));
      // Assuming score format "X - Y" where team is home/away
      const conceded = match.home ? parts[1] : parts[0];
      if (conceded === 0) count++;
      else break;
    } else {
      break;
    }
  }
  return count;
}

function countScoringGames(form: FormMatch[]): number {
  let count = 0;
  for (const match of form) {
    if (match.score) {
      const parts = match.score.split('-').map(s => parseInt(s.trim()));
      const scored = match.home ? parts[0] : parts[1];
      if (scored > 0) count++;
      else break;
    } else {
      // If no score, assume they scored if W or D
      if (match.result !== 'L') count++;
      else break;
    }
  }
  return count;
}

function countBTTSGames(form: FormMatch[]): number {
  let count = 0;
  for (const match of form) {
    if (match.score) {
      const parts = match.score.split('-').map(s => parseInt(s.trim()));
      if (parts[0] > 0 && parts[1] > 0) count++;
      else break;
    } else {
      break;
    }
  }
  return count;
}

function countOver25Games(form: FormMatch[]): number {
  let count = 0;
  for (const match of form) {
    if (match.score) {
      const parts = match.score.split('-').map(s => parseInt(s.trim()));
      const totalGoals = parts[0] + parts[1];
      if (totalGoals > 2) count++;
      else break;
    } else {
      break;
    }
  }
  return count;
}

/**
 * Generate H2H insights
 */
function generateH2HInsights(
  h2h: HeadToHeadMatch[],
  homeTeam: string,
  awayTeam: string
): H2HInsights {
  const totalGoals = h2h.reduce((sum, m) => sum + m.homeScore + m.awayScore, 0);
  const avgGoals = h2h.length > 0 ? totalGoals / h2h.length : 0;

  const bttsGames = h2h.filter(m => m.homeScore > 0 && m.awayScore > 0).length;
  const bttsPercentage = h2h.length > 0 ? (bttsGames / h2h.length) * 100 : 0;

  const over25Games = h2h.filter(m => m.homeScore + m.awayScore > 2).length;
  const over25Percentage = h2h.length > 0 ? (over25Games / h2h.length) * 100 : 0;

  // Count wins for each team (considering they might swap home/away)
  let homeTeamWins = 0;
  let awayTeamWins = 0;
  let draws = 0;

  h2h.forEach(match => {
    if (match.homeScore > match.awayScore) {
      if (match.homeTeam === homeTeam) homeTeamWins++;
      else awayTeamWins++;
    } else if (match.awayScore > match.homeScore) {
      if (match.awayTeam === homeTeam) homeTeamWins++;
      else awayTeamWins++;
    } else {
      draws++;
    }
  });

  // Last match winner
  const lastMatch = h2h[0];
  let lastWinner: 'home' | 'away' | 'draw' | undefined;
  if (lastMatch) {
    if (lastMatch.homeScore > lastMatch.awayScore) {
      lastWinner = lastMatch.homeTeam === homeTeam ? 'home' : 'away';
    } else if (lastMatch.awayScore > lastMatch.homeScore) {
      lastWinner = lastMatch.awayTeam === homeTeam ? 'home' : 'away';
    } else {
      lastWinner = 'draw';
    }
  }

  // Dominant team
  let dominantTeam: 'home' | 'away' | 'even' = 'even';
  if (homeTeamWins > awayTeamWins * 1.5) dominantTeam = 'home';
  else if (awayTeamWins > homeTeamWins * 1.5) dominantTeam = 'away';

  // Recent trend
  let recentTrend: string | undefined;
  const recent3 = h2h.slice(0, 3);
  if (recent3.length >= 3) {
    const recentHomeWins = recent3.filter(m => 
      (m.homeTeam === homeTeam && m.homeScore > m.awayScore) ||
      (m.awayTeam === homeTeam && m.awayScore > m.homeScore)
    ).length;
    const recentAwayWins = recent3.filter(m => 
      (m.homeTeam === awayTeam && m.homeScore > m.awayScore) ||
      (m.awayTeam === awayTeam && m.awayScore > m.homeScore)
    ).length;

    if (recentHomeWins === 3) recentTrend = `${homeTeam} won last 3 meetings`;
    else if (recentAwayWins === 3) recentTrend = `${awayTeam} won last 3 meetings`;
    else if (recentHomeWins === 0 && recent3.length === 3) {
      recentTrend = `${homeTeam} haven't won in last 3 H2H`;
    } else if (recentAwayWins === 0 && recent3.length === 3) {
      recentTrend = `${awayTeam} haven't won in last 3 H2H`;
    }
  }

  return {
    avgGoalsPerMatch: Math.round(avgGoals * 10) / 10,
    bttsPercentage: Math.round(bttsPercentage),
    over25Percentage: Math.round(over25Percentage),
    lastWinner,
    dominantTeam,
    recentTrend,
  };
}

/**
 * Extract key absences from injury context
 */
function extractKeyAbsences(
  injuryContext: InjuryContext | null | undefined,
  homeTeam: string,
  awayTeam: string
): PreMatchInsights['keyAbsences'] {
  const result: PreMatchInsights['keyAbsences'] = {
    home: [],
    away: [],
  };

  if (!injuryContext) return result;

  if (injuryContext.homeTeam?.players) {
    result.home = injuryContext.homeTeam.players
      .filter(p => p.importance === 'KEY' || p.importance === 'STARTER')
      .map(p => ({
        name: p.name,
        position: p.position,
        importance: p.importance || 'STARTER',
      }));
  }

  if (injuryContext.awayTeam?.players) {
    result.away = injuryContext.awayTeam.players
      .filter(p => p.importance === 'KEY' || p.importance === 'STARTER')
      .map(p => ({
        name: p.name,
        position: p.position,
        importance: p.importance || 'STARTER',
      }));
  }

  // Generate impact statement
  const homeKey = result.home.filter(p => p.importance === 'KEY').length;
  const awayKey = result.away.filter(p => p.importance === 'KEY').length;

  if (homeKey > 0 && awayKey > 0) {
    result.impactStatement = 'Both teams missing key players';
  } else if (homeKey > awayKey) {
    result.impactStatement = `${homeTeam} more affected by absences`;
  } else if (awayKey > homeKey) {
    result.impactStatement = `${awayTeam} more affected by absences`;
  }

  return result;
}

/**
 * Calculate venue split from form data
 */
function calculateVenueSplit(form: FormMatch[]): VenueSplit | null {
  if (!form || form.length === 0) return null;

  const homeGames = form.filter(m => m.home === true);
  const awayGames = form.filter(m => m.home === false);

  const calculateStats = (games: FormMatch[]) => {
    const wins = games.filter(m => m.result === 'W').length;
    const draws = games.filter(m => m.result === 'D').length;
    const losses = games.filter(m => m.result === 'L').length;

    let goalsFor = 0, goalsAgainst = 0, cleanSheets = 0;
    games.forEach(m => {
      if (m.score) {
        const parts = m.score.split('-').map(s => parseInt(s.trim()));
        if (m.home) {
          goalsFor += parts[0] || 0;
          goalsAgainst += parts[1] || 0;
          if (parts[1] === 0) cleanSheets++;
        } else {
          goalsFor += parts[1] || 0;
          goalsAgainst += parts[0] || 0;
          if (parts[0] === 0) cleanSheets++;
        }
      }
    });

    return {
      played: games.length,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      cleanSheets,
      avgGoals: games.length > 0 ? goalsFor / games.length : 0,
    };
  };

  const homeStats = calculateStats(homeGames);
  const awayStats = calculateStats(awayGames);

  // Generate insight
  let insight: string | undefined;
  const homeWinRate = homeStats.played > 0 ? (homeStats.wins / homeStats.played) * 100 : 0;
  const awayWinRate = awayStats.played > 0 ? (awayStats.wins / awayStats.played) * 100 : 0;
  const diff = homeWinRate - awayWinRate;

  if (diff > 25) insight = 'Much stronger at home';
  else if (diff < -25) insight = 'Better away from home';
  else if (homeWinRate > 60 && homeStats.played >= 3) insight = 'Dominant home form';
  else if (awayWinRate < 20 && awayStats.played >= 3) insight = 'Struggles on the road';

  return {
    home: homeStats,
    away: awayStats,
    insight,
  };
}

/**
 * Generate quick stats
 */
function generateQuickStats(
  homeForm: FormMatch[],
  awayForm: FormMatch[],
  h2h: HeadToHeadMatch[]
): PreMatchInsights['quickStats'] {
  // H2H average goals
  const fixtureGoalsAvg = h2h.length > 0
    ? h2h.reduce((sum, m) => sum + m.homeScore + m.awayScore, 0) / h2h.length
    : null;

  // Combined recent form goals
  const recentGoals = (form: FormMatch[]) => {
    const recent = form.slice(0, 5);
    let total = 0;
    recent.forEach(m => {
      if (m.score) {
        const parts = m.score.split('-').map(s => parseInt(s.trim()));
        total += parts[0] + parts[1];
      }
    });
    return recent.length > 0 ? total / recent.length : 0;
  };

  const homeAvg = recentGoals(homeForm);
  const awayAvg = recentGoals(awayForm);
  const combinedFormGoalsAvg = (homeAvg + awayAvg) / 2 || null;

  // Clean sheet probability (rough estimate)
  const homeCleanSheets = homeForm.slice(0, 5).filter(m => {
    if (m.score) {
      const parts = m.score.split('-').map(s => parseInt(s.trim()));
      return m.home ? parts[1] === 0 : parts[0] === 0;
    }
    return false;
  }).length;
  const awayCleanSheets = awayForm.slice(0, 5).filter(m => {
    if (m.score) {
      const parts = m.score.split('-').map(s => parseInt(s.trim()));
      return m.home ? parts[1] === 0 : parts[0] === 0;
    }
    return false;
  }).length;
  const cleanSheetProbability = ((homeCleanSheets + awayCleanSheets) / 10) * 100 || null;

  // BTTS likelihood
  const homeBTTS = homeForm.slice(0, 5).filter(m => {
    if (m.score) {
      const parts = m.score.split('-').map(s => parseInt(s.trim()));
      return parts[0] > 0 && parts[1] > 0;
    }
    return false;
  }).length;
  const awayBTTS = awayForm.slice(0, 5).filter(m => {
    if (m.score) {
      const parts = m.score.split('-').map(s => parseInt(s.trim()));
      return parts[0] > 0 && parts[1] > 0;
    }
    return false;
  }).length;
  const bttsRate = (homeBTTS + awayBTTS) / 10;
  const bttsLikelihood: 'low' | 'medium' | 'high' | null = 
    bttsRate >= 0.7 ? 'high' : bttsRate >= 0.4 ? 'medium' : bttsRate > 0 ? 'low' : null;

  return {
    fixtureGoalsAvg: fixtureGoalsAvg ? Math.round(fixtureGoalsAvg * 10) / 10 : null,
    combinedFormGoalsAvg: combinedFormGoalsAvg ? Math.round(combinedFormGoalsAvg * 10) / 10 : null,
    cleanSheetProbability: cleanSheetProbability ? Math.round(cleanSheetProbability) : null,
    bttsLikelihood,
  };
}

/**
 * Generate shareable headlines from all available data
 */
function generateHeadlines(params: {
  homeTeam: string;
  awayTeam: string;
  homeForm: FormMatch[];
  awayForm: FormMatch[];
  homeStreaks: TeamStreak[];
  awayStreaks: TeamStreak[];
  h2hInsights: H2HInsights | null;
  h2h: HeadToHeadMatch[];
  keyAbsences: PreMatchInsights['keyAbsences'];
  homeStats?: TeamStats;
  awayStats?: TeamStats;
  homeMomentumScore?: number | null;
  awayMomentumScore?: number | null;
}): MatchHeadline[] {
  const headlines: MatchHeadline[] = [];
  const {
    homeTeam, awayTeam, homeStreaks, awayStreaks, h2hInsights, h2h,
    keyAbsences, homeStats, awayStats, homeMomentumScore, awayMomentumScore,
  } = params;

  // High impact streaks
  const allStreaks = [
    ...homeStreaks.map(s => ({ ...s, team: homeTeam })),
    ...awayStreaks.map(s => ({ ...s, team: awayTeam })),
  ];

  // Add top win/unbeaten streaks
  const winStreaks = allStreaks.filter(s => s.type === 'win' && s.count >= 3);
  winStreaks.forEach(s => {
    headlines.push({
      icon: '🔥',
      text: `${s.team}: ${s.count} wins in a row`,
      category: 'streak',
      impactLevel: s.count >= 5 ? 'high' : 'medium',
      team: s.team === homeTeam ? 'home' : 'away',
    });
  });

  // Add losing streaks (important!)
  const lossStreaks = allStreaks.filter(s => s.type === 'loss' && s.count >= 3);
  lossStreaks.forEach(s => {
    headlines.push({
      icon: '💀',
      text: `${s.team}: ${s.count} defeats in a row`,
      category: 'streak',
      impactLevel: s.count >= 4 ? 'high' : 'medium',
      team: s.team === homeTeam ? 'home' : 'away',
    });
  });

  // H2H headlines
  if (h2hInsights) {
    if (h2hInsights.recentTrend) {
      headlines.push({
        icon: '⚔️',
        text: h2hInsights.recentTrend,
        category: 'h2h',
        impactLevel: 'high',
        team: 'both',
      });
    }

    if (h2h.length >= 5 && h2hInsights.avgGoalsPerMatch >= 3) {
      headlines.push({
        icon: '⚽',
        text: `This fixture averages ${h2hInsights.avgGoalsPerMatch} goals per match`,
        category: 'goals',
        impactLevel: 'medium',
        team: 'both',
      });
    }

    if (h2hInsights.over25Percentage >= 70 && h2h.length >= 5) {
      headlines.push({
        icon: '📊',
        text: `Over 2.5 goals in ${h2hInsights.over25Percentage}% of H2H matches`,
        category: 'goals',
        impactLevel: 'medium',
        team: 'both',
      });
    }
  }

  // Key absences
  const homeKeyOut = keyAbsences.home.filter(p => p.importance === 'KEY');
  const awayKeyOut = keyAbsences.away.filter(p => p.importance === 'KEY');

  if (homeKeyOut.length > 0) {
    headlines.push({
      icon: '🚨',
      text: `${homeTeam} without ${homeKeyOut.map(p => p.name).join(', ')}`,
      category: 'absence',
      impactLevel: 'high',
      team: 'home',
    });
  }

  if (awayKeyOut.length > 0) {
    headlines.push({
      icon: '🚨',
      text: `${awayTeam} without ${awayKeyOut.map(p => p.name).join(', ')}`,
      category: 'absence',
      impactLevel: 'high',
      team: 'away',
    });
  }

  // Momentum headlines
  if (homeMomentumScore !== null && awayMomentumScore !== null) {
    const diff = (homeMomentumScore || 0) - (awayMomentumScore || 0);
    if (Math.abs(diff) >= 30) {
      const better = diff > 0 ? homeTeam : awayTeam;
      headlines.push({
        icon: '📈',
        text: `${better} in significantly better form`,
        category: 'form',
        impactLevel: 'medium',
        team: diff > 0 ? 'home' : 'away',
      });
    }
  }

  // Scoring/defensive streaks
  const scoringStreaks = allStreaks.filter(s => s.type === 'scored' && s.count >= 6);
  scoringStreaks.forEach(s => {
    headlines.push({
      icon: '⚽',
      text: `${s.team}: Scored in ${s.count} consecutive games`,
      category: 'goals',
      impactLevel: 'medium',
      team: s.team === homeTeam ? 'home' : 'away',
    });
  });

  const cleanSheetStreaks = allStreaks.filter(s => s.type === 'cleanSheet' && s.count >= 3);
  cleanSheetStreaks.forEach(s => {
    headlines.push({
      icon: '🧤',
      text: `${s.team}: ${s.count} clean sheets in a row`,
      category: 'defense',
      impactLevel: 'medium',
      team: s.team === homeTeam ? 'home' : 'away',
    });
  });

  // Sort by impact level
  const order = { high: 0, medium: 1, low: 2 };
  return headlines.sort((a, b) => order[a.impactLevel] - order[b.impactLevel]).slice(0, 8);
}

export default generatePreMatchInsights;
