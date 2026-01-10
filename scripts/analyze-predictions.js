const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get sample of recent predictions
  const predictions = await prisma.prediction.findMany({
    where: { modelVersion: 'v2' },
    orderBy: { kickoff: 'desc' },
    take: 30,
    select: {
      matchName: true,
      sport: true,
      kickoff: true,
      selection: true,
      prediction: true,
      modelProbability: true,
      marketProbabilityFair: true,
      marketProbabilityRaw: true,
      marketOddsAtPrediction: true,
      edgeValue: true,
      edgeBucket: true,
      binaryOutcome: true,
      outcome: true,
      clvValue: true,
      closingOdds: true,
      conviction: true,
      valueBetSide: true,
      valueBetOdds: true,
      valueBetEdge: true,
      odds: true,
    }
  });
  
  console.log('=== SAMPLE PREDICTIONS (30 most recent) ===\n');
  
  let issues = {
    missingModelProb: 0,
    missingMarketFair: 0,
    missingMarketRaw: 0,
    missingEdgeValue: 0,
    missingEdgeBucket: 0,
    missingSelection: 0,
    missingOdds: 0,
    missingBinaryOutcome: 0,
    usingLegacyFields: 0,
  };
  
  for (const p of predictions) {
    console.log('---');
    console.log('Match:', p.matchName);
    console.log('Sport:', p.sport, '| Kickoff:', p.kickoff.toISOString().slice(0,16));
    console.log('Selection:', p.selection || '[MISSING]', '| Prediction:', p.prediction);
    console.log('Model Prob:', p.modelProbability !== null ? p.modelProbability : '[MISSING]', 
                '| Market Fair:', p.marketProbabilityFair !== null ? p.marketProbabilityFair : '[MISSING]', 
                '| Market Raw:', p.marketProbabilityRaw !== null ? p.marketProbabilityRaw : '[MISSING]');
    console.log('Edge:', p.edgeValue !== null ? p.edgeValue : '[MISSING]', 
                '| Bucket:', p.edgeBucket || '[MISSING]');
    console.log('Odds (new):', p.marketOddsAtPrediction, '| Odds (legacy):', p.odds);
    console.log('Binary:', p.binaryOutcome !== null ? p.binaryOutcome : '[PENDING]', '| Outcome:', p.outcome);
    console.log('CLV:', p.clvValue !== null ? p.clvValue : '[NOT FETCHED]');
    console.log('Conviction:', p.conviction, '| Value:', p.valueBetSide, '@', p.valueBetOdds, 'edge:', p.valueBetEdge);
    
    // Count issues
    if (p.modelProbability === null) issues.missingModelProb++;
    if (p.marketProbabilityFair === null) issues.missingMarketFair++;
    if (p.marketProbabilityRaw === null) issues.missingMarketRaw++;
    if (p.edgeValue === null) issues.missingEdgeValue++;
    if (!p.edgeBucket) issues.missingEdgeBucket++;
    if (!p.selection) issues.missingSelection++;
    if (p.marketOddsAtPrediction === null && p.odds === null) issues.missingOdds++;
    if (p.binaryOutcome === null && new Date(p.kickoff) < new Date()) issues.missingBinaryOutcome++;
    if (p.valueBetEdge !== null && p.edgeValue === null) issues.usingLegacyFields++;
  }
  
  console.log('\n=== DATA QUALITY ISSUES ===');
  console.log('Missing modelProbability:', issues.missingModelProb, '/', predictions.length);
  console.log('Missing marketProbabilityFair:', issues.missingMarketFair, '/', predictions.length);
  console.log('Missing marketProbabilityRaw:', issues.missingMarketRaw, '/', predictions.length);
  console.log('Missing edgeValue:', issues.missingEdgeValue, '/', predictions.length);
  console.log('Missing edgeBucket:', issues.missingEdgeBucket, '/', predictions.length);
  console.log('Missing selection:', issues.missingSelection, '/', predictions.length);
  console.log('Missing odds:', issues.missingOdds, '/', predictions.length);
  console.log('Missing binaryOutcome (past matches):', issues.missingBinaryOutcome);
  console.log('Using legacy fields only:', issues.usingLegacyFields);

  // Get aggregate stats
  console.log('\n=== AGGREGATE STATS ===');
  const totalV2 = await prisma.prediction.count({ where: { modelVersion: 'v2' } });
  const withModelProb = await prisma.prediction.count({ 
    where: { modelVersion: 'v2', modelProbability: { not: null } } 
  });
  const withMarketFair = await prisma.prediction.count({ 
    where: { modelVersion: 'v2', marketProbabilityFair: { not: null } } 
  });
  const withEdge = await prisma.prediction.count({ 
    where: { modelVersion: 'v2', edgeValue: { not: null } } 
  });
  const withBucket = await prisma.prediction.count({ 
    where: { modelVersion: 'v2', edgeBucket: { not: null } } 
  });
  const withSelection = await prisma.prediction.count({ 
    where: { modelVersion: 'v2', selection: { not: null } } 
  });
  const withBinaryOutcome = await prisma.prediction.count({ 
    where: { modelVersion: 'v2', binaryOutcome: { not: null } } 
  });
  const pastMatches = await prisma.prediction.count({ 
    where: { modelVersion: 'v2', kickoff: { lt: new Date() } } 
  });
  
  console.log('Total v2 predictions:', totalV2);
  console.log('With modelProbability:', withModelProb, `(${Math.round(withModelProb/totalV2*100)}%)`);
  console.log('With marketProbabilityFair:', withMarketFair, `(${Math.round(withMarketFair/totalV2*100)}%)`);
  console.log('With edgeValue:', withEdge, `(${Math.round(withEdge/totalV2*100)}%)`);
  console.log('With edgeBucket:', withBucket, `(${Math.round(withBucket/totalV2*100)}%)`);
  console.log('With selection:', withSelection, `(${Math.round(withSelection/totalV2*100)}%)`);
  console.log('With binaryOutcome:', withBinaryOutcome, '/', pastMatches, 'past matches');
  
  await prisma.$disconnect();
}
main();
