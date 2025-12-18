const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const predictions = await prisma.predictionOutcome.findMany({
    where: { wasAccurate: null },
    orderBy: { matchDate: 'desc' }
  });
  
  console.log('Pending predictions (' + predictions.length + '):');
  console.log('');
  
  for (const p of predictions) {
    console.log('Match: ' + p.matchRef);
    console.log('  League: ' + p.league);
    console.log('  Date: ' + p.matchDate.toISOString());
    console.log('  Prediction: ' + p.predictedScenario);
    console.log('');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
