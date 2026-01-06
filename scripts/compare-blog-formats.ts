import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function compare() {
  // Get a regular blog post (Educational Guide)
  const regularPost = await prisma.blogPost.findFirst({ 
    where: { 
      status: 'PUBLISHED',
      category: 'Educational Guides'
    },
    select: { title: true, content: true, featuredImage: true, slug: true }
  });
  
  // Get the tool review
  const toolReview = await prisma.blogPost.findFirst({ 
    where: { slug: 'action-network-review' },
    select: { title: true, content: true, featuredImage: true, slug: true }
  });
  
  console.log('=== REGULAR BLOG POST ===');
  console.log('Title:', regularPost?.title);
  console.log('Image:', regularPost?.featuredImage);
  console.log('\nContent preview (first 1000 chars):');
  console.log(regularPost?.content?.substring(0, 1000));
  
  console.log('\n\n=== TOOL REVIEW ===');
  console.log('Title:', toolReview?.title);
  console.log('Image:', toolReview?.featuredImage);
  console.log('\nContent preview (first 1000 chars):');
  console.log(toolReview?.content?.substring(0, 1000));
  
  await prisma.$disconnect();
}

compare().catch(console.error);
