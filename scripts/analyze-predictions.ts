import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzePredictions() {
  console.log('\n========================================');
  console.log('PREDICTION DATA QUALITY ANALYSIS');
  console.log('========================================\n');

  // 1. Total counts
  const total = await prisma.prediction.count();
  const pending = await prisma.prediction.count({ where: { outcome: 'PENDING' } });
  const evaluated = await prisma.prediction.count({ where: { outcome: { not: 'PENDING' } } });
  
  console.log('📊 OVERALL COUNTS:');
  console.log(`   Total predictions: ${total}`);
  console.log(`   Pending: ${pending}`);
  console.log(`   Evaluated: ${evaluated}`);
  console.log('');

  // 2. Field completeness analysis
  console.log('🔍 FIELD COMPLETENESS (what % have data):');
  
  const withModelProb = await prisma.prediction.count({ where: { modelProbability: { not: null } } });
  const withMarketProbFair = await prisma.prediction.count({ where: { marketProbabilityFair: { not: null } } });
  const withMarketOdds = await prisma.prediction.count({ where: { marketOddsAtPrediction: { not: null } } });
  const withEdgeValue = await prisma.prediction.count({ where: { edgeValue: { not: null } } });
  const withEdgeBucket = await prisma.prediction.count({ where: { edgeBucket: { not: null } } });
  const withSelection = await prisma.prediction.count({ where: { selection: { not: null } } });
  const withBinaryOutcome = await prisma.prediction.count({ where: { binaryOutcome: { not: null } } });
  const withClosingOdds = await prisma.prediction.count({ where: { closingOdds: { not: null } } });
  const withCLV = await prisma.prediction.count({ where: { clvValue: { not: null } } });
  const withMarketType = await prisma.prediction.count({ where: { marketType: { not: null } } });
  
  const pct = (n: number) => total > 0 ? ((n / total) * 100).toFixed(1) : '0';
  
  console.log(`   modelProbability:      ${withModelProb}/${total} (${pct(withModelProb)}%)`);
  console.log(`   marketProbabilityFair: ${withMarketProbFair}/${total} (${pct(withMarketProbFair)}%)`);
  console.log(`   marketOddsAtPrediction: ${withMarketOdds}/${total} (${pct(withMarketOdds)}%)`);
  console.log(`   edgeValue:             ${withEdgeValue}/${total} (${pct(withEdgeValue)}%)`);
  console.log(`   edgeBucket:            ${withEdgeBucket}/${total} (${pct(withEdgeBucket)}%)`);
  console.log(`   selection:             ${withSelection}/${total} (${pct(withSelection)}%)`);
  console.log(`   binaryOutcome:         ${withBinaryOutcome}/${total} (${pct(withBinaryOutcome)}%) [of evaluated: ${evaluated}]`);
  console.log(`   closingOdds:           ${withClosingOdds}/${total} (${pct(withClosingOdds)}%)`);
  console.log(`   clvValue:              ${withCLV}/${total} (${pct(withCLV)}%)`);
  console.log(`   marketType:            ${withMarketType}/${total} (${pct(withMarketType)}%)`);
  console.log('');

  // 3. Identify problematic predictions (evaluated but missing binary outcome)
  const evaluatedNoBinary = await prisma.prediction.count({
    where: {
      outcome: { not: 'PENDING' },
      binaryOutcome: null
    }
  });
  console.log('⚠️  PROBLEMS:');
  console.log(`   Evaluated but NO binaryOutcome: ${evaluatedNoBinary}`);
  
  // 4. Predictions with edge data but no bucket assigned
  const edgeNoBucket = await prisma.prediction.count({
    where: {
      edgeValue: { not: null },
      edgeBucket: null
    }
  });
  console.log(`   Has edgeValue but NO edgeBucket: ${edgeNoBucket}`);
  
  // 5. Has model prob but no edge calculated
  const modelNoEdge = await prisma.prediction.count({
    where: {
      modelProbability: { not: null },
      marketProbabilityFair: { not: null },
      edgeValue: null
    }
  });
  console.log(`   Has modelProb + marketProb but NO edgeValue: ${modelNoEdge}`);
  console.log('');

  // 6. Sample of recent predictions to see actual data
  console.log('📝 SAMPLE OF RECENT 10 PREDICTIONS:');
  const recent = await prisma.prediction.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      matchName: true,
      prediction: true,
      selection: true,
      modelProbability: true,
      marketProbabilityFair: true,
      edgeValue: true,
      edgeBucket: true,
      marketOddsAtPrediction: true,
      outcome: true,
      binaryOutcome: true,
      conviction: true,
    }
  });
  
  recent.forEach((p, i) => {
    console.log(`\n   ${i+1}. ${p.matchName}`);
    console.log(`      prediction: "${p.prediction}" | selection: ${p.selection ?? 'NULL'}`);
    console.log(`      modelProb: ${p.modelProbability ?? 'NULL'}% | marketProb: ${p.marketProbabilityFair ?? 'NULL'}%`);
    console.log(`      edge: ${p.edgeValue ?? 'NULL'}% | bucket: ${p.edgeBucket ?? 'NULL'} | odds: ${p.marketOddsAtPrediction ?? 'NULL'}`);
    console.log(`      outcome: ${p.outcome} | binary: ${p.binaryOutcome ?? 'NULL'} | conviction: ${p.conviction}`);
  });

  // 7. Outcome distribution
  console.log('\n\n📈 OUTCOME DISTRIBUTION:');
  const outcomes = await prisma.prediction.groupBy({
    by: ['outcome'],
    _count: { outcome: true }
  });
  outcomes.forEach(o => {
    console.log(`   ${o.outcome}: ${o._count.outcome}`);
  });

  // 8. Edge bucket distribution
  console.log('\n📊 EDGE BUCKET DISTRIBUTION:');
  const buckets = await prisma.prediction.groupBy({
    by: ['edgeBucket'],
    _count: { edgeBucket: true },
    where: { edgeBucket: { not: null } }
  });
  if (buckets.length === 0) {
    console.log('   No edge buckets assigned!');
  } else {
    buckets.forEach(b => {
      console.log(`   ${b.edgeBucket}: ${b._count.edgeBucket}`);
    });
  }

  // 9. Binary outcome analysis (key for win rate)
  console.log('\n🎯 BINARY OUTCOME ANALYSIS (for evaluated predictions):');
  const wins = await prisma.prediction.count({ where: { binaryOutcome: 1 } });
  const losses = await prisma.prediction.count({ where: { binaryOutcome: 0 } });
  const winRate = (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : 'N/A';
  console.log(`   Wins (binaryOutcome=1): ${wins}`);
  console.log(`   Losses (binaryOutcome=0): ${losses}`);
  console.log(`   Win Rate: ${winRate}%`);

  // 10. Check source distribution
  console.log('\n📦 SOURCE DISTRIBUTION:');
  const sources = await prisma.prediction.groupBy({
    by: ['source'],
    _count: { source: true }
  });
  sources.forEach(s => {
    console.log(`   ${s.source}: ${s._count.source}`);
  });

  // 11. Date range
  const oldest = await prisma.prediction.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } });
  const newest = await prisma.prediction.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } });
  console.log('\n📅 DATE RANGE:');
  console.log(`   Oldest: ${oldest?.createdAt?.toISOString() ?? 'N/A'}`);
  console.log(`   Newest: ${newest?.createdAt?.toISOString() ?? 'N/A'}`);

  // 12. CONCLUSIONS
  console.log('\n\n========================================');
  console.log('🧠 CONCLUSIONS & ISSUES TO ADDRESS:');
  console.log('========================================');
  
  const issues: string[] = [];
  
  if (withModelProb < total * 0.5) {
    issues.push(`❌ modelProbability is missing for ${total - withModelProb} predictions (${(100 - parseFloat(pct(withModelProb))).toFixed(1)}%) - Edge tracking won't work without this`);
  }
  
  if (withMarketProbFair < total * 0.5) {
    issues.push(`❌ marketProbabilityFair is missing for ${total - withMarketProbFair} predictions - Need this for edge calculation`);
  }
  
  if (withSelection < total * 0.5) {
    issues.push(`❌ selection is missing for ${total - withSelection} predictions - Can't determine what side was picked`);
  }
  
  if (evaluatedNoBinary > 0) {
    issues.push(`❌ ${evaluatedNoBinary} evaluated predictions have NO binaryOutcome - Win rate calculation is broken`);
  }
  
  if (edgeNoBucket > 0) {
    issues.push(`⚠️  ${edgeNoBucket} predictions have edgeValue but no edgeBucket - Aggregation is incomplete`);
  }
  
  if (modelNoEdge > 0) {
    issues.push(`⚠️  ${modelNoEdge} predictions have both probs but edgeValue wasn't calculated`);
  }
  
  if (withCLV === 0) {
    issues.push(`⚠️  NO CLV data collected - Need closing odds fetcher or manual entry`);
  }
  
  if (issues.length === 0) {
    console.log('✅ No major issues detected!');
  } else {
    issues.forEach(issue => console.log(`\n${issue}`));
  }

  console.log('\n');
  await prisma.$disconnect();
}

analyzePredictions().catch(console.error);
