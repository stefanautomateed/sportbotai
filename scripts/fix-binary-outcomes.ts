/**
 * Script to fix predictions that have outcome (HIT/MISS) but missing binaryOutcome
 * 
 * Run with: npx tsx scripts/fix-binary-outcomes.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBinaryOutcomes() {
  console.log('\n========================================');
  console.log('FIX MISSING BINARY OUTCOMES');
  console.log('========================================\n');

  // Find predictions that have outcome but no binaryOutcome
  const broken = await prisma.prediction.findMany({
    where: {
      outcome: { not: 'PENDING' },
      binaryOutcome: null
    },
    select: {
      id: true,
      matchName: true,
      prediction: true,
      selection: true,
      outcome: true,
      actualResult: true,
      actualScore: true,
    }
  });

  console.log(`Found ${broken.length} predictions to fix\n`);

  let fixed = 0;
  let skipped = 0;

  for (const pred of broken) {
    console.log(`\n📝 ${pred.matchName}`);
    console.log(`   prediction: "${pred.prediction}"`);
    console.log(`   selection: ${pred.selection ?? 'NULL'}`);
    console.log(`   outcome: ${pred.outcome}`);
    console.log(`   actualResult: ${pred.actualResult ?? 'NULL'}`);

    // Determine binaryOutcome based on outcome field (HIT = 1, MISS = 0)
    // This is the most reliable way since outcome was already calculated
    if (pred.outcome === 'HIT' || pred.outcome === 'MISS') {
      const binaryOutcome = pred.outcome === 'HIT' ? 1 : 0;
      
      await prisma.prediction.update({
        where: { id: pred.id },
        data: { binaryOutcome }
      });
      
      console.log(`   ✅ Set binaryOutcome = ${binaryOutcome}`);
      fixed++;
    } else {
      console.log(`   ⏭️  Skipped (outcome = ${pred.outcome})`);
      skipped++;
    }
  }

  console.log('\n========================================');
  console.log(`SUMMARY: Fixed ${fixed}, Skipped ${skipped}`);
  console.log('========================================\n');

  await prisma.$disconnect();
}

fixBinaryOutcomes().catch(console.error);
