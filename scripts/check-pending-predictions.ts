/**
 * Diagnose pending predictions that should have results
 * 
 * Run with: npx tsx scripts/check-pending-predictions.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(60));
  console.log('PENDING PREDICTIONS DIAGNOSIS');
  console.log('='.repeat(60));

  // Get pending predictions that are past their kickoff time
  const pendingPredictions = await prisma.prediction.findMany({
    where: {
      outcome: 'PENDING',
      kickoff: {
        lte: new Date(),
        gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Last 2 weeks
      },
    },
    orderBy: { kickoff: 'desc' },
    take: 30,
  });

  console.log(`\n📊 Found ${pendingPredictions.length} pending predictions that are past kickoff:\n`);

  // Group by sport
  const bySport: Record<string, typeof pendingPredictions> = {};
  for (const p of pendingPredictions) {
    const sport = p.sport || 'unknown';
    if (!bySport[sport]) bySport[sport] = [];
    bySport[sport].push(p);
  }

  for (const [sport, preds] of Object.entries(bySport)) {
    console.log(`\n🏆 ${sport.toUpperCase()} (${preds.length} pending):`);
    for (const p of preds.slice(0, 5)) {
      const hoursAgo = Math.round((Date.now() - new Date(p.kickoff).getTime()) / (1000 * 60 * 60));
      console.log(`  - ${p.matchName}`);
      console.log(`    Kickoff: ${p.kickoff} (${hoursAgo}h ago)`);
      console.log(`    Prediction: ${p.prediction}`);
      console.log(`    League: ${p.league}`);
      console.log(`    Source: ${p.source}`);
      console.log('');
    }
  }

  // Check if the cron is running
  console.log('\n🔍 Possible Issues:');
  console.log('');

  // Issue 1: Check if we have API key
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    console.log('❌ API_FOOTBALL_KEY is not set - cannot fetch results!');
  } else {
    console.log('✅ API_FOOTBALL_KEY is configured');
  }

  // Issue 2: Check team name matching
  console.log('\n📝 Sample team name parsing:');
  for (const p of pendingPredictions.slice(0, 3)) {
    const parts = p.matchName.split(' vs ');
    console.log(`  "${p.matchName}" → home: "${parts[0]}", away: "${parts[1]}"`);
  }

  // Issue 3: Check if any predictions were validated recently
  const recentlyValidated = await prisma.prediction.findMany({
    where: {
      outcome: { in: ['HIT', 'MISS'] },
      validatedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { validatedAt: 'desc' },
    take: 10,
  });

  console.log(`\n✅ Recently validated (last 7 days): ${recentlyValidated.length}`);
  for (const v of recentlyValidated.slice(0, 5)) {
    console.log(`  - ${v.matchName}: ${v.outcome} (${v.actualScore}) - validated ${v.validatedAt}`);
  }

  // Issue 4: Statistics
  const stats = await prisma.prediction.groupBy({
    by: ['outcome'],
    _count: true,
  });

  console.log('\n📊 Overall Stats:');
  for (const s of stats) {
    console.log(`  ${s.outcome}: ${s._count}`);
  }

  console.log('\n' + '='.repeat(60));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
