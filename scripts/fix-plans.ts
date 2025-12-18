/**
 * Fix user plans - downgrade all except aiinstamarketing@gmail.com
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
  // Downgrade all users to FREE except the specified one
  const result = await prisma.user.updateMany({
    where: {
      email: { not: 'aiinstamarketing@gmail.com' }
    },
    data: { plan: 'FREE' }
  });

  console.log(`Downgraded ${result.count} users to FREE`);

  // Show all users
  const users = await prisma.user.findMany({
    select: { email: true, plan: true }
  });

  console.log('\nCurrent user plans:');
  console.table(users);
}

fix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
