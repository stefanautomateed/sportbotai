/**
 * Analyze HIGH edge predictions to find why they're failing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyze() {
  const highEdge = await prisma.prediction.findMany({
    where: { 
      valueBetEdge: { gte: 8 },
      outcome: { not: 'PENDING' }
    },
    select: {
      matchName: true,
      sport: true,
      valueBetEdge: true,
      outcome: true,
      actualResult: true,
      actualScore: true,
    }
  });

  console.log('\n📊 HIGH EDGE ANALYSIS (edge >= 8%)');
  console.log('===================================');
  console.log('Total:', highEdge.length);
  
  const hits = highEdge.filter(p => p.outcome === 'HIT');
  const misses = highEdge.filter(p => p.outcome === 'MISS');
  console.log('Hits:', hits.length, '| Misses:', misses.length);
  console.log('Win Rate:', ((hits.length / highEdge.length) * 100).toFixed(1) + '%');
  
  // Categorize misses
  const wrongWinner = misses.filter(p => p.actualResult === 'Away Win' || p.actualResult === 'Home Win');
  const draws = misses.filter(p => p.actualResult === 'Draw');
  const score00 = misses.filter(p => p.actualScore === '0-0');
  
  console.log('\nMISS BREAKDOWN:');
  console.log('  Wrong winner (Home/Away):', wrongWinner.length);
  console.log('  Draws (game ended draw):', draws.length);
  console.log('  Score 0-0 (no result fetched?):', score00.length);
  
  // Sport breakdown
  console.log('\nBY SPORT:');
  const sports: Record<string, { hits: number; misses: number; score00: number }> = {};
  for (const p of highEdge) {
    const s = p.sport;
    if (!sports[s]) sports[s] = { hits: 0, misses: 0, score00: 0 };
    if (p.outcome === 'HIT') sports[s].hits++;
    else sports[s].misses++;
    if (p.actualScore === '0-0') sports[s].score00++;
  }
  for (const [sport, data] of Object.entries(sports)) {
    console.log(`  ${sport}: ${data.hits}/${data.hits + data.misses} | 0-0 scores: ${data.score00}`);
  }
  
  console.log('\n⚠️ SUSPICIOUS 0-0 SCORES (likely missing results):');
  for (const p of score00) {
    console.log(`  - ${p.matchName} (${p.sport})`);
  }

  // Check if we're predicting underdogs too often
  console.log('\n🎲 EDGE VALUE DISTRIBUTION:');
  const edgeRanges = [
    { min: 8, max: 10, label: '8-10%' },
    { min: 10, max: 15, label: '10-15%' },
    { min: 15, max: 20, label: '15-20%' },
    { min: 20, max: 100, label: '20%+' },
  ];
  for (const range of edgeRanges) {
    const inRange = highEdge.filter(p => 
      (p.valueBetEdge || 0) >= range.min && (p.valueBetEdge || 0) < range.max
    );
    const rangeHits = inRange.filter(p => p.outcome === 'HIT').length;
    console.log(`  ${range.label}: ${rangeHits}/${inRange.length} (${inRange.length > 0 ? ((rangeHits/inRange.length)*100).toFixed(0) : 0}%)`);
  }

  await prisma.$disconnect();
}

analyze();
