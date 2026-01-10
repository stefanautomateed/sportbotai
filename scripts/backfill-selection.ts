/**
 * Backfill missing selection field from prediction text
 * 
 * Run with: npx tsx scripts/backfill-selection.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function extractSelection(prediction: string, matchName: string): string | null {
  const predLower = prediction.toLowerCase();
  const matchParts = matchName.split(' vs ');
  const homeTeam = matchParts[0]?.trim() || '';
  const awayTeam = matchParts[1]?.trim() || '';
  
  // Check for explicit home/away/draw
  if (predLower.includes('home win') || predLower.includes('home victory')) {
    return 'home';
  }
  if (predLower.includes('away win') || predLower.includes('away victory')) {
    return 'away';
  }
  if (predLower.includes('draw') || predLower.includes('tie')) {
    return 'draw';
  }
  
  // Check if prediction contains team name
  if (homeTeam && predLower.includes(homeTeam.toLowerCase())) {
    return 'home';
  }
  if (awayTeam && predLower.includes(awayTeam.toLowerCase())) {
    return 'away';
  }
  
  // Check for over/under
  if (predLower.includes('over')) {
    return 'over';
  }
  if (predLower.includes('under')) {
    return 'under';
  }
  
  // Check for BTTS
  if (predLower.includes('btts yes') || predLower.includes('both teams to score: yes')) {
    return 'btts_yes';
  }
  if (predLower.includes('btts no') || predLower.includes('both teams to score: no')) {
    return 'btts_no';
  }
  
  return null;
}

async function backfillSelection() {
  console.log('\n========================================');
  console.log('BACKFILL MISSING SELECTION FIELD');
  console.log('========================================\n');

  const missing = await prisma.prediction.findMany({
    where: { selection: null },
    select: {
      id: true,
      matchName: true,
      prediction: true,
    }
  });

  console.log(`Found ${missing.length} predictions with missing selection\n`);

  let fixed = 0;
  let skipped = 0;

  for (const pred of missing) {
    const selection = extractSelection(pred.prediction, pred.matchName);
    
    if (selection) {
      await prisma.prediction.update({
        where: { id: pred.id },
        data: { selection }
      });
      console.log(`✅ ${pred.matchName}: "${pred.prediction}" → selection: ${selection}`);
      fixed++;
    } else {
      console.log(`⏭️  ${pred.matchName}: "${pred.prediction}" → could not extract`);
      skipped++;
    }
  }

  console.log('\n========================================');
  console.log(`SUMMARY: Fixed ${fixed}, Skipped ${skipped}`);
  console.log('========================================\n');

  await prisma.$disconnect();
}

backfillSelection().catch(console.error);
