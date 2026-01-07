/**
 * Fix Tool Review Featured Images
 * 
 * Updates blog posts that are using fallback /sports/football.jpg
 * with actual screenshots of the tool websites.
 * 
 * Run: npx ts-node scripts/fix-tool-review-images.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';

const prisma = new PrismaClient();

async function captureScreenshot(url: string, toolName: string): Promise<string> {
  const apiKey = process.env.SCREENSHOTONE_API_KEY;
  
  if (!apiKey) {
    throw new Error('SCREENSHOTONE_API_KEY is not configured');
  }
  
  console.log(`[Screenshot] Capturing ${url}...`);
  
  const hideSelectors = [
    '[class*="cookie"]',
    '[class*="consent"]',
    '[class*="gdpr"]',
    '[id*="cookie"]',
    '[id*="consent"]',
    '.osano-cm-dialog',
    '.qc-cmp2-container',
  ].join(',');

  const params = new URLSearchParams({
    access_key: apiKey,
    url: url,
    format: 'png',
    viewport_width: '1920',
    viewport_height: '1080',
    block_cookie_banners: 'true',
    block_banners_by_heuristics: 'true',
    block_ads: 'true',
    block_chats: 'true',
    hide_selectors: hideSelectors,
    delay: '3',
    timeout: '30',
  });
  
  const apiUrl = `https://api.screenshotone.com/take?${params.toString()}`;
  
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Screenshotone API error: ${response.status} - ${errorText}`);
  }
  
  const imageBuffer = Buffer.from(await response.arrayBuffer());
  
  const cleanName = toolName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const filename = `tool-screenshots/${cleanName}-${Date.now()}.png`;
  
  console.log('[Screenshot] Uploading to Vercel Blob...');
  const blob = await put(filename, imageBuffer, {
    access: 'public',
    contentType: 'image/png',
  });
  
  console.log(`[Screenshot] ✅ Uploaded: ${blob.url}`);
  return blob.url;
}

async function main() {
  console.log('🔧 Fixing Tool Review Featured Images\n');
  
  // Find tool review posts using fallback image
  const postsToFix = await prisma.blogPost.findMany({
    where: {
      category: 'Tools & Resources',
      featuredImage: '/sports/football.jpg',
    },
    select: { id: true, title: true, slug: true },
  });
  
  console.log(`Found ${postsToFix.length} posts with fallback images\n`);
  
  for (const post of postsToFix) {
    console.log(`\n--- ${post.title.substring(0, 50)}... ---`);
    
    // Find the associated tool review
    const toolReview = await prisma.toolReview.findFirst({
      where: { blogSlug: post.slug },
      select: { toolName: true, toolUrl: true },
    });
    
    if (!toolReview) {
      console.log('⚠️ No associated toolReview found, skipping');
      continue;
    }
    
    console.log(`Tool: ${toolReview.toolName} (${toolReview.toolUrl})`);
    
    try {
      const screenshotUrl = await captureScreenshot(toolReview.toolUrl, toolReview.toolName);
      
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { featuredImage: screenshotUrl },
      });
      
      console.log(`✅ Updated featuredImage to: ${screenshotUrl.substring(0, 60)}...`);
    } catch (error) {
      console.error(`❌ Failed: ${error instanceof Error ? error.message : error}`);
    }
  }
  
  console.log('\n🎉 Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
