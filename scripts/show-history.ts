import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function showHistory() {
  const analyses = await prisma.analysis.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: { homeTeam: true, awayTeam: true, league: true, matchDate: true, bestValueSide: true, createdAt: true }
  });
  
  console.log('Recent analyses:');
  analyses.forEach(x => {
    console.log(`${x.homeTeam} vs ${x.awayTeam} | ${x.league} | favored: ${x.bestValueSide} | matchDate: ${x.matchDate?.toISOString()?.split('T')[0]}`);
  });
  
  await prisma.$disconnect();
}

showHistory();
