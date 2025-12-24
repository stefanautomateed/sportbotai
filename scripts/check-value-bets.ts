import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check predictions with valueBetSide set
  const withValueBet = await prisma.prediction.count({
    where: { valueBetSide: { not: null } }
  });
  
  // Check predictions with valueBetOutcome set
  const withValueBetOutcome = await prisma.prediction.count({
    where: { valueBetOutcome: { not: null } }
  });
  
  // Get sample predictions with valueBetSide
  const samples = await prisma.prediction.findMany({
    where: { valueBetSide: { not: null } },
    take: 5,
    select: {
      matchName: true,
      valueBetSide: true,
      valueBetOdds: true,
      valueBetEdge: true,
      valueBetOutcome: true,
      valueBetProfit: true,
      outcome: true,
    }
  });
  
  console.log(`\n=== VALUE BET STATUS ===`);
  console.log(`Predictions with valueBetSide: ${withValueBet}`);
  console.log(`Predictions with valueBetOutcome: ${withValueBetOutcome}`);
  console.log(`\nSample predictions with valueBetSide:`);
  samples.forEach(s => {
    console.log(`  ${s.matchName}`);
    console.log(`    Side: ${s.valueBetSide}, Odds: ${s.valueBetOdds}, Edge: ${s.valueBetEdge}%`);
    console.log(`    Value Outcome: ${s.valueBetOutcome || 'NOT SET'}, Profit: ${s.valueBetProfit}`);
    console.log(`    Main Outcome: ${s.outcome}`);
  });
  
  await prisma.$disconnect();
}

main();
