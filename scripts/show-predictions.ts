import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const predictions = await prisma.predictionOutcome.findMany({
    where: { result: 'PENDING' },
    select: { id: true, homeTeam: true, awayTeam: true, matchDate: true, league: true, predictedScenario: true }
  });
  
  console.log('Your pending predictions:');
  for (const p of predictions) {
    console.log('- ' + p.homeTeam + ' vs ' + p.awayTeam + ' (' + p.league + ')');
    console.log('  Date: ' + p.matchDate.toISOString());
    console.log('  Prediction: ' + p.predictedScenario);
  }
}

main().catch(console.error).finally(() => prisma.\());
