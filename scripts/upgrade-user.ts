/**
 * Quick script to upgrade a user to PREMIUM
 * Run with: npx ts-node scripts/upgrade-user.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // List all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      plan: true,
      analysisCount: true,
    },
  });

  console.log('Current users:');
  console.table(users);

  // Upgrade ALL users to PREMIUM for testing
  const result = await prisma.user.updateMany({
    data: {
      plan: 'PREMIUM',
      analysisCount: 0, // Reset count
    },
  });

  console.log(`\nUpgraded ${result.count} user(s) to PREMIUM`);

  // Show updated users
  const updatedUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      plan: true,
      analysisCount: true,
    },
  });

  console.log('\nUpdated users:');
  console.table(updatedUsers);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
