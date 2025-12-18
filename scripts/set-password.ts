/**
 * Set password for a user
 * Useful for OAuth-only accounts that want to also use email/password login
 * 
 * Usage: npx ts-node scripts/set-password.ts email@example.com newpassword
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  
  if (!email || !newPassword) {
    console.error('Usage: npx ts-node scripts/set-password.ts email@example.com newpassword');
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.error('Password must be at least 6 characters');
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
  });

  if (!user) {
    console.error(`❌ User not found: ${email}`);
    process.exit(1);
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update user
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  console.log(`✅ Password set for ${user.email}`);
  console.log(`   They can now login with email/password OR their OAuth provider`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
