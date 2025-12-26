/**
 * Fix Blog Colors Script
 * 
 * Updates all existing blog posts to use the correct accent green (#2AF6A0)
 * instead of the old emerald (#10b981)
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

const DRY_RUN = !process.argv.includes('--fix');

async function fixBlogColors() {
  console.log('🎨 Fix Blog Colors Script');
  console.log('='.repeat(50));
  console.log(DRY_RUN ? '🔍 DRY RUN MODE (use --fix to apply changes)\n' : '🔧 APPLYING FIXES\n');

  // Get all blog posts
  const posts = await prisma.blogPost.findMany({
    select: {
      id: true,
      slug: true,
      content: true,
    },
  });

  console.log(`Found ${posts.length} blog posts\n`);

  let fixedCount = 0;
  let skippedCount = 0;

  for (const post of posts) {
    // Check if post contains old color
    const has10b981 = post.content.includes('#10b981');
    const hasRgba10b981 = post.content.includes('rgba(16, 185, 129'); // rgba version
    
    if (!has10b981 && !hasRgba10b981) {
      skippedCount++;
      continue;
    }

    // Count occurrences
    const count10b981 = (post.content.match(/#10b981/gi) || []).length;
    
    console.log(`📝 ${post.slug}`);
    console.log(`   Found ${count10b981} occurrences of #10b981`);

    if (!DRY_RUN) {
      // Replace all #10b981 with #2AF6A0
      let newContent = post.content;
      
      // Replace hex color (case insensitive)
      newContent = newContent.replace(/#10b981/gi, '#2AF6A0');
      
      // Replace rgba versions too
      // rgba(16, 185, 129, ...) -> rgba(42, 246, 160, ...)
      newContent = newContent.replace(/rgba\s*\(\s*16\s*,\s*185\s*,\s*129/gi, 'rgba(42, 246, 160');

      await prisma.blogPost.update({
        where: { id: post.id },
        data: { content: newContent },
      });
      
      console.log(`   ✅ Fixed!`);
    }

    fixedCount++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   Posts needing fix: ${fixedCount}`);
  console.log(`   Posts already correct: ${skippedCount}`);
  
  if (DRY_RUN && fixedCount > 0) {
    console.log(`\n💡 Run with --fix to apply changes to ${fixedCount} posts`);
  } else if (!DRY_RUN && fixedCount > 0) {
    console.log(`\n✅ Fixed ${fixedCount} posts!`);
    console.log(`\n🔄 Don't forget to revalidate cache:`);
    console.log(`   curl -X POST "https://www.sportbotai.com/api/blog/revalidate" -H "x-revalidate-token: YOUR_TOKEN"`);
  }

  await prisma.$disconnect();
}

fixBlogColors().catch(console.error);
