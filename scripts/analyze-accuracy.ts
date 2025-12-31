import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const preds = await prisma.prediction.findMany({
    where: { outcome: { in: ['HIT', 'MISS'] } },
  });
  
  // Group by sport
  const bySport: Record<string, { hits: number; misses: number; homeHits: number; homeMiss: number; awayHits: number; awayMiss: number }> = {};
  
  for (const p of preds) {
    const sport = p.sport.replace('soccer_', '').replace('basketball_', '').replace('icehockey_', '').replace('americanfootball_', '');
    if (!bySport[sport]) bySport[sport] = { hits: 0, misses: 0, homeHits: 0, homeMiss: 0, awayHits: 0, awayMiss: 0 };
    
    const isHome = p.prediction.toLowerCase().includes('home');
    const isAway = p.prediction.toLowerCase().includes('away');
    
    if (p.outcome === 'HIT') {
      bySport[sport].hits++;
      if (isHome) bySport[sport].homeHits++;
      if (isAway) bySport[sport].awayHits++;
    } else {
      bySport[sport].misses++;
      if (isHome) bySport[sport].homeMiss++;
      if (isAway) bySport[sport].awayMiss++;
    }
  }
  
  console.log('=== PREDICTION ACCURACY BY SPORT ===\n');
  console.log('Sport'.padEnd(25) + 'Total'.padStart(8) + 'Accuracy'.padStart(10) + '  Home Acc'.padStart(10) + '  Away Acc'.padStart(10));
  console.log('-'.repeat(65));
  
  const sorted = Object.entries(bySport).sort((a, b) => (b[1].hits + b[1].misses) - (a[1].hits + a[1].misses));
  
  for (const [sport, data] of sorted) {
    const total = data.hits + data.misses;
    const acc = ((data.hits / total) * 100).toFixed(1) + '%';
    const homeTotal = data.homeHits + data.homeMiss;
    const homeAcc = homeTotal > 0 ? ((data.homeHits / homeTotal) * 100).toFixed(1) + '%' : 'N/A';
    const awayTotal = data.awayHits + data.awayMiss;
    const awayAcc = awayTotal > 0 ? ((data.awayHits / awayTotal) * 100).toFixed(1) + '%' : 'N/A';
    
    const flag = parseFloat(acc) < 50 ? ' ⚠️' : parseFloat(acc) >= 55 ? ' ✅' : '';
    console.log(sport.padEnd(25) + total.toString().padStart(8) + acc.padStart(10) + homeAcc.padStart(12) + awayAcc.padStart(12) + flag);
  }
  
  // Overall
  const totalHits = preds.filter((p: any) => p.outcome === 'HIT').length;
  const totalMisses = preds.filter((p: any) => p.outcome === 'MISS').length;
  console.log('-'.repeat(65));
  console.log('OVERALL'.padEnd(25) + (totalHits + totalMisses).toString().padStart(8) + ((totalHits / (totalHits + totalMisses)) * 100).toFixed(1).padStart(9) + '%');
}

main().finally(() => prisma.$disconnect());
