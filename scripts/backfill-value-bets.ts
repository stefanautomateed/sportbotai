/**
 * Backfill value bet outcomes for predictions that have main outcomes
 * but are missing valueBetOutcome/valueBetProfit
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillValueBetOutcomes() {
  console.log('Finding predictions with valueBetSide but missing valueBetOutcome...\n');
  
  // Find predictions that have valueBetSide set and outcome is HIT/MISS, but valueBetOutcome is PENDING or null
  const predictions = await prisma.prediction.findMany({
    where: {
      valueBetSide: { not: null },
      outcome: { in: ['HIT', 'MISS'] },
      actualResult: { not: null },
      OR: [
        { valueBetOutcome: 'PENDING' },
        { valueBetOutcome: null },
        { valueBetProfit: null },
      ],
    },
    select: {
      id: true,
      matchName: true,
      actualResult: true,
      valueBetSide: true,
      valueBetOdds: true,
      valueBetOutcome: true,
      valueBetProfit: true,
    },
  });
  
  console.log(`Found ${predictions.length} predictions to backfill\n`);
  
  let updated = 0;
  
  for (const pred of predictions) {
    // Determine actual winner from actualResult
    let actualWinner: 'HOME' | 'AWAY' | 'DRAW';
    const result = pred.actualResult?.toLowerCase() || '';
    
    if (result.includes('home')) {
      actualWinner = 'HOME';
    } else if (result.includes('away')) {
      actualWinner = 'AWAY';
    } else if (result.includes('draw')) {
      actualWinner = 'DRAW';
    } else {
      console.log(`  ⚠️ Skipping ${pred.matchName} - unknown actualResult: ${pred.actualResult}`);
      continue;
    }
    
    // Evaluate value bet
    const valueBetWon = pred.valueBetSide === actualWinner;
    const valueBetOutcome = valueBetWon ? 'HIT' : 'MISS';
    const valueBetProfit = valueBetWon ? ((pred.valueBetOdds || 2) - 1) : -1;
    
    await prisma.prediction.update({
      where: { id: pred.id },
      data: {
        valueBetOutcome,
        valueBetProfit,
      },
    });
    
    console.log(`  ✅ ${pred.matchName}`);
    console.log(`     Value bet: ${pred.valueBetSide} @ ${pred.valueBetOdds?.toFixed(2)} -> ${valueBetOutcome} (${valueBetProfit > 0 ? '+' : ''}${valueBetProfit.toFixed(2)} units)`);
    updated++;
  }
  
  console.log(`\n📊 Summary: Backfilled ${updated} value bet outcomes`);
  
  // Show updated stats
  const stats = await prisma.prediction.findMany({
    where: {
      valueBetOutcome: { in: ['HIT', 'MISS'] },
      valueBetProfit: { not: null },
    },
    select: {
      valueBetOutcome: true,
      valueBetProfit: true,
    },
  });
  
  const hits = stats.filter(s => s.valueBetOutcome === 'HIT').length;
  const misses = stats.filter(s => s.valueBetOutcome === 'MISS').length;
  const totalProfit = stats.reduce((sum, s) => sum + (s.valueBetProfit || 0), 0);
  const roi = stats.length > 0 ? (totalProfit / stats.length) * 100 : 0;
  
  console.log(`\n=== VALUE BET ROI STATS ===`);
  console.log(`Total bets: ${stats.length}`);
  console.log(`Hits: ${hits} (${stats.length > 0 ? ((hits / stats.length) * 100).toFixed(1) : 0}%)`);
  console.log(`Misses: ${misses}`);
  console.log(`Total profit: ${totalProfit > 0 ? '+' : ''}${totalProfit.toFixed(2)} units`);
  console.log(`ROI: ${roi > 0 ? '+' : ''}${roi.toFixed(1)}%`);
  
  await prisma.$disconnect();
}

backfillValueBetOutcomes().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
