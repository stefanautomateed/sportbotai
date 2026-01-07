import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const reviews = await prisma.blogPost.findMany({
    where: { category: 'Tools & Resources' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { title: true, featuredImage: true, createdAt: true }
  });
  
  console.log('Recent Tool Reviews:');
  for (const r of reviews) {
    console.log('---');
    console.log('Title:', r.title.substring(0, 60));
    console.log('Image:', r.featuredImage);
    console.log('Created:', r.createdAt);
  }
  
  // Check SCREENSHOTONE_API_KEY
  console.log('\n---');
  console.log('SCREENSHOTONE_API_KEY configured:', !!process.env.SCREENSHOTONE_API_KEY);
  
  // Get URLs for failed tools
  console.log('\n--- FAILED TOOLS ---');
  const failedTools = await prisma.toolReview.findMany({
    where: {
      OR: [
        { toolName: { contains: 'Pickswise', mode: 'insensitive' } },
        { toolName: { contains: 'Killer', mode: 'insensitive' } }
      ]
    },
    select: { toolName: true, toolUrl: true }
  });
  for (const t of failedTools) {
    console.log(`${t.toolName}: ${t.toolUrl}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
