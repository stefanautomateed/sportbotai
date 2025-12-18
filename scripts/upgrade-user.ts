/**
 * Upgrade a SPECIFIC user to a plan
 * Run with: npx ts-node scripts/upgrade-user.ts <email> <plan>
 * Example: npx ts-node scripts/upgrade-user.ts user@example.com PREMIUM
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const plan = process.argv[3] || 'PREMIUM';

  if (!email) {
    console.error('❌ ERROR: You must provide an email address!');
    console.log('Usage: npx ts-node scripts/upgrade-user.ts <email> <plan>');
    console.log('Example: npx ts-node scripts/upgrade-user.ts user@example.com PREMIUM');
    process.exit(1);
  }

  // Find the specific user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`❌ User with email "${email}" not found!`);
    
    // List all users for reference
    const allUsers = await prisma.user.findMany({
      select: { email: true, plan: true },
    });
    console.log('\nExisting users:');
    console.table(allUsers);
    process.exit(1);
  }

  console.log(`Found user: ${user.email} (current plan: ${user.plan})`);

  // Upgrade ONLY this specific user
  const updated = await prisma.user.update({
    where: { email },
    data: {
      plan: plan as 'FREE' | 'PRO' | 'PREMIUM',
    },
  });

  console.log(`✅ Successfully upgraded ${updated.email} to ${updated.plan}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
