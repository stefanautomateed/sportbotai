import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { generateToolReview } from '../src/lib/backlink-scout';

const prisma = new PrismaClient();

async function main() {
  const toolName = process.argv[2] || 'Action Network';
  
  const tool = await prisma.toolReview.findFirst({ 
    where: { toolName }
  });
  
  if (!tool) {
    console.log('Tool not found:', toolName);
    await prisma.$disconnect();
    return;
  }
  
  console.log('Generating review for:', tool.toolName);
  
  const review = await generateToolReview(
    tool.toolName,
    tool.toolUrl,
    tool.toolDescription || '',
    tool.contentExtracted || ''
  );
  
  console.log('Title:', review.title);
  console.log('Content length:', review.content.length);
  console.log('Has CTA:', review.content.includes('Visit'));
  
  await prisma.toolReview.update({
    where: { id: tool.id },
    data: {
      reviewTitle: review.title,
      reviewContent: review.content,
      reviewGeneratedAt: new Date(),
      reviewStatus: 'GENERATED'
    }
  });
  
  console.log('Saved!');
  console.log('\n--- Preview ---');
  console.log(review.content.slice(-800));
  
  await prisma.$disconnect();
}

main().catch(console.error);
