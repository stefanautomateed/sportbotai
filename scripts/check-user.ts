/**
 * Check user details
 * Usage: npx ts-node scripts/check-user.ts email@example.com
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Usage: npx ts-node scripts/check-user.ts email@example.com');
    process.exit(1);
  }

  // Case-insensitive search
  const user = await prisma.user.findFirst({
    where: { 
      email: { 
        equals: email.toLowerCase(),
        mode: 'insensitive' 
      } 
    },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      password: true,
      createdAt: true,
      accounts: {
        select: {
          provider: true,
        }
      }
    }
  });

  if (!user) {
    console.log(`❌ User not found: ${email}`);
    process.exit(1);
  }

  console.log(`\n✅ User found:`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.name || 'Not set'}`);
  console.log(`   Plan: ${user.plan}`);
  console.log(`   Has password: ${user.password ? 'Yes' : 'No (OAuth only)'}`);
  console.log(`   OAuth providers: ${user.accounts.map(a => a.provider).join(', ') || 'None'}`);
  console.log(`   Created: ${user.createdAt.toISOString()}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
