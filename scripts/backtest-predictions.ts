/**
 * Backtest Script for AI Predictions
 * 
 * Analyzes historical prediction performance to identify:
 * 1. Which conviction levels perform best
 * 2. Which sports/leagues are most predictable
 * 3. Which prediction types (home/away/draw) are most accurate
 * 4. Edge patterns - when edges correlate with outcomes
 * 5. Time-based patterns (day of week, etc.)
 * 
 * Usage: npx tsx scripts/backtest-predictions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BacktestResult {
  total: number;
  hits: number;
  misses: number;
  accuracy: number;
  avgConviction: number;
  avgOdds: number;
  profitIfFlatBet: number; // If you bet $1 on each
}

interface ConvictionBucket {
  range: string;
  min: number;
  max: number;
  result: BacktestResult;
}

interface LeagueStats {
  league: string;
  sport: string;
  result: BacktestResult;
  homeAccuracy: number;
  awayAccuracy: number;
  drawAccuracy: number;
}

function calcResult(predictions: Array<{ outcome: string; conviction: number; odds: number | null }>): BacktestResult {
  const hits = predictions.filter(p => p.outcome === 'HIT').length;
  const misses = predictions.filter(p => p.outcome === 'MISS').length;
  const total = hits + misses;
  
  let profitIfFlatBet = 0;
  for (const p of predictions) {
    if (p.outcome === 'HIT' && p.odds) {
      profitIfFlatBet += (p.odds - 1); // Win: profit = odds - stake
    } else if (p.outcome === 'MISS') {
      profitIfFlatBet -= 1; // Loss: lose the stake
    }
  }
  
  return {
    total,
    hits,
    misses,
    accuracy: total > 0 ? Math.round((hits / total) * 100) : 0,
    avgConviction: total > 0 ? Math.round(predictions.reduce((sum, p) => sum + p.conviction, 0) / total * 10) / 10 : 0,
    avgOdds: total > 0 ? Math.round(predictions.filter(p => p.odds).reduce((sum, p) => sum + (p.odds || 0), 0) / total * 100) / 100 : 0,
    profitIfFlatBet: Math.round(profitIfFlatBet * 100) / 100,
  };
}

async function main() {
  console.log('🔬 AI Predictions Backtest Analysis\n');
  console.log('=' .repeat(60));
  
  // Fetch all evaluated predictions
  const predictions = await prisma.prediction.findMany({
    where: { outcome: { not: 'PENDING' } },
    select: {
      id: true,
      matchName: true,
      sport: true,
      league: true,
      kickoff: true,
      prediction: true,
      conviction: true,
      odds: true,
      impliedProb: true,
      outcome: true,
      actualResult: true,
      createdAt: true,
    },
    orderBy: { kickoff: 'desc' },
  });
  
  if (predictions.length === 0) {
    console.log('\n❌ No evaluated predictions found.');
    console.log('Run scripts/update-results.ts first to validate predictions.');
    return;
  }
  
  console.log(`\n📊 Total Evaluated Predictions: ${predictions.length}\n`);
  
  // Overall stats
  const overall = calcResult(predictions);
  console.log('📈 OVERALL PERFORMANCE');
  console.log('-'.repeat(40));
  console.log(`  Accuracy: ${overall.accuracy}% (${overall.hits}/${overall.total})`);
  console.log(`  Avg Conviction: ${overall.avgConviction}/10`);
  console.log(`  Avg Odds: ${overall.avgOdds}`);
  console.log(`  Profit if $1 flat bet: $${overall.profitIfFlatBet > 0 ? '+' : ''}${overall.profitIfFlatBet}`);
  
  // By Conviction Level
  console.log('\n\n📊 BY CONVICTION LEVEL');
  console.log('-'.repeat(40));
  
  const convictionBuckets: ConvictionBucket[] = [
    { range: '1-3 (Low)', min: 1, max: 3, result: calcResult([]) },
    { range: '4-6 (Medium)', min: 4, max: 6, result: calcResult([]) },
    { range: '7-8 (High)', min: 7, max: 8, result: calcResult([]) },
    { range: '9-10 (Very High)', min: 9, max: 10, result: calcResult([]) },
  ];
  
  for (const bucket of convictionBuckets) {
    const matching = predictions.filter(p => p.conviction >= bucket.min && p.conviction <= bucket.max);
    bucket.result = calcResult(matching);
  }
  
  for (const bucket of convictionBuckets) {
    if (bucket.result.total === 0) continue;
    const status = bucket.result.accuracy >= 50 ? '✅' : '❌';
    console.log(`  ${bucket.range}: ${bucket.result.accuracy}% (${bucket.result.hits}/${bucket.result.total}) ${status}`);
    console.log(`    Profit: $${bucket.result.profitIfFlatBet > 0 ? '+' : ''}${bucket.result.profitIfFlatBet}`);
  }
  
  // Conviction correlation analysis
  console.log('\n  💡 Insight: Conviction should correlate with accuracy.');
  const lowAccuracy = convictionBuckets[0].result.accuracy;
  const highAccuracy = convictionBuckets[2].result.accuracy;
  if (highAccuracy > lowAccuracy) {
    console.log(`     ✅ High conviction (${highAccuracy}%) > Low conviction (${lowAccuracy}%) - Model calibrated!`);
  } else {
    console.log(`     ⚠️ High conviction (${highAccuracy}%) <= Low conviction (${lowAccuracy}%) - Recalibration needed!`);
  }
  
  // By Prediction Type (Home/Away/Draw)
  console.log('\n\n🎯 BY PREDICTION TYPE');
  console.log('-'.repeat(40));
  
  const homePredict = predictions.filter(p => p.prediction.toLowerCase().includes('home'));
  const awayPredict = predictions.filter(p => p.prediction.toLowerCase().includes('away'));
  const drawPredict = predictions.filter(p => p.prediction.toLowerCase().includes('draw'));
  
  const homeResult = calcResult(homePredict);
  const awayResult = calcResult(awayPredict);
  const drawResult = calcResult(drawPredict);
  
  console.log(`  Home Win picks: ${homeResult.accuracy}% (${homeResult.hits}/${homeResult.total}) ${homeResult.accuracy >= 50 ? '✅' : '❌'}`);
  console.log(`    Profit: $${homeResult.profitIfFlatBet > 0 ? '+' : ''}${homeResult.profitIfFlatBet}`);
  console.log(`  Away Win picks: ${awayResult.accuracy}% (${awayResult.hits}/${awayResult.total}) ${awayResult.accuracy >= 50 ? '✅' : '❌'}`);
  console.log(`    Profit: $${awayResult.profitIfFlatBet > 0 ? '+' : ''}${awayResult.profitIfFlatBet}`);
  if (drawResult.total > 0) {
    console.log(`  Draw picks: ${drawResult.accuracy}% (${drawResult.hits}/${drawResult.total}) ${drawResult.accuracy >= 50 ? '✅' : '❌'}`);
    console.log(`    Profit: $${drawResult.profitIfFlatBet > 0 ? '+' : ''}${drawResult.profitIfFlatBet}`);
  }
  
  // Home bias detection
  console.log('\n  💡 Home Bias Analysis:');
  if (homePredict.length > awayPredict.length * 1.5) {
    console.log(`     ⚠️ Model picks home ${homePredict.length} vs away ${awayPredict.length} - Possible home bias!`);
  } else {
    console.log(`     ✅ Balanced picks: ${homePredict.length} home vs ${awayPredict.length} away`);
  }
  if (awayResult.accuracy > homeResult.accuracy) {
    console.log(`     💰 Away picks are MORE accurate! Consider weighting away picks higher.`);
  }
  
  // By Sport
  console.log('\n\n🏆 BY SPORT');
  console.log('-'.repeat(40));
  
  const sports = Array.from(new Set(predictions.map(p => p.sport)));
  const sportStats = sports.map(sport => {
    const matching = predictions.filter(p => p.sport === sport);
    return { sport, result: calcResult(matching) };
  }).sort((a, b) => b.result.total - a.result.total);
  
  for (const stat of sportStats) {
    const status = stat.result.accuracy >= 50 ? '✅' : '❌';
    console.log(`  ${stat.sport}: ${stat.result.accuracy}% (${stat.result.hits}/${stat.result.total}) ${status}`);
    console.log(`    Avg odds: ${stat.result.avgOdds} | Profit: $${stat.result.profitIfFlatBet > 0 ? '+' : ''}${stat.result.profitIfFlatBet}`);
  }
  
  // By League
  console.log('\n\n🏟️ BY LEAGUE');
  console.log('-'.repeat(40));
  
  const leagues = Array.from(new Set(predictions.map(p => p.league)));
  const leagueStats: LeagueStats[] = leagues.map(league => {
    const matching = predictions.filter(p => p.league === league);
    const homeMatching = matching.filter(p => p.prediction.toLowerCase().includes('home'));
    const awayMatching = matching.filter(p => p.prediction.toLowerCase().includes('away'));
    const drawMatching = matching.filter(p => p.prediction.toLowerCase().includes('draw'));
    
    return {
      league,
      sport: matching[0]?.sport || '',
      result: calcResult(matching),
      homeAccuracy: calcResult(homeMatching).accuracy,
      awayAccuracy: calcResult(awayMatching).accuracy,
      drawAccuracy: calcResult(drawMatching).accuracy,
    };
  }).sort((a, b) => b.result.total - a.result.total);
  
  for (const stat of leagueStats) {
    if (stat.result.total < 3) continue; // Skip small samples
    const status = stat.result.accuracy >= 50 ? '✅' : '❌';
    console.log(`  ${stat.league}: ${stat.result.accuracy}% (${stat.result.hits}/${stat.result.total}) ${status}`);
    console.log(`    Home: ${stat.homeAccuracy}% | Away: ${stat.awayAccuracy}% | Draw: ${stat.drawAccuracy}%`);
    console.log(`    Profit: $${stat.result.profitIfFlatBet > 0 ? '+' : ''}${stat.result.profitIfFlatBet}`);
  }
  
  // Edge Analysis (predictions with high implied edge)
  console.log('\n\n📈 EDGE ANALYSIS');
  console.log('-'.repeat(40));
  
  // High odds (underdogs) vs Low odds (favorites)
  const favorites = predictions.filter(p => p.odds && p.odds < 2.0);
  const underdogs = predictions.filter(p => p.odds && p.odds >= 2.0 && p.odds < 3.0);
  const longshots = predictions.filter(p => p.odds && p.odds >= 3.0);
  
  const favResult = calcResult(favorites);
  const undResult = calcResult(underdogs);
  const longResult = calcResult(longshots);
  
  console.log(`  Favorites (<2.0 odds): ${favResult.accuracy}% (${favResult.hits}/${favResult.total})`);
  console.log(`    Profit: $${favResult.profitIfFlatBet > 0 ? '+' : ''}${favResult.profitIfFlatBet}`);
  console.log(`  Underdogs (2.0-3.0 odds): ${undResult.accuracy}% (${undResult.hits}/${undResult.total})`);
  console.log(`    Profit: $${undResult.profitIfFlatBet > 0 ? '+' : ''}${undResult.profitIfFlatBet}`);
  console.log(`  Longshots (3.0+ odds): ${longResult.accuracy}% (${longResult.hits}/${longResult.total})`);
  console.log(`    Profit: $${longResult.profitIfFlatBet > 0 ? '+' : ''}${longResult.profitIfFlatBet}`);
  
  // Time-based analysis
  console.log('\n\n📅 TIME ANALYSIS');
  console.log('-'.repeat(40));
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const byDay = new Map<number, typeof predictions>();
  
  for (const p of predictions) {
    const day = new Date(p.kickoff).getUTCDay();
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(p);
  }
  
  for (const [day, preds] of Array.from(byDay.entries())) {
    if (preds.length < 3) continue;
    const result = calcResult(preds);
    console.log(`  ${dayNames[day]}: ${result.accuracy}% (${result.hits}/${result.total})`);
  }
  
  // Recommendations
  console.log('\n\n💡 RECOMMENDATIONS');
  console.log('=' .repeat(60));
  
  // Find best performing configurations
  const bestSport = sportStats.filter(s => s.result.total >= 5).sort((a, b) => b.result.accuracy - a.result.accuracy)[0];
  const worstSport = sportStats.filter(s => s.result.total >= 5).sort((a, b) => a.result.accuracy - b.result.accuracy)[0];
  const bestLeague = leagueStats.filter(l => l.result.total >= 5).sort((a, b) => b.result.accuracy - a.result.accuracy)[0];
  
  if (bestSport && bestSport.result.accuracy >= 50) {
    console.log(`\n✅ Focus on ${bestSport.sport} (${bestSport.result.accuracy}% accuracy)`);
  }
  
  if (worstSport && worstSport.result.accuracy < 45) {
    console.log(`\n⚠️ Consider reducing predictions for ${worstSport.sport} (${worstSport.result.accuracy}% accuracy)`);
  }
  
  if (awayResult.accuracy > homeResult.accuracy + 10) {
    console.log(`\n💰 Away picks significantly outperforming home picks - increase away weighting`);
  }
  
  if (homeResult.accuracy < 35) {
    console.log(`\n🚨 Home picks at ${homeResult.accuracy}% - serious home bias issue!`);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('Backtest complete!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
