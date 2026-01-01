/**
 * Translate Blog Posts to Serbian
 * 
 * Translates all published blog posts and news articles to Serbian.
 * Populates titleSr, excerptSr, contentSr, etc. fields.
 * 
 * Usage: npx tsx scripts/translate-blog-posts.ts [--limit=10] [--dry-run]
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from '../src/lib/prisma';
import { translateToSerbian } from '../src/lib/translate';

interface TranslationStats {
  total: number;
  translated: number;
  skipped: number;
  failed: number;
  cost: number;
}

const COST_PER_1K_TOKENS = 0.00015; // GPT-4o-mini input
const AVG_CHARS_PER_TOKEN = 4;

async function translatePost(postId: string, title: string, excerpt: string, content: string, context: 'blog' | 'match_preview'): Promise<{
  titleSr: string;
  excerptSr: string;
  contentSr: string;
  metaTitleSr: string | null;
  metaDescriptionSr: string | null;
  newsTitleSr: string | null;
  newsContentSr: string | null;
}> {
  console.log(`\n📝 Translating: ${title.substring(0, 60)}...`);
  
  // Translate in parallel for speed
  const [titleSr, excerptSr, contentSr] = await Promise.all([
    translateToSerbian(title, { context, preserveHtml: false }),
    translateToSerbian(excerpt, { context, preserveHtml: false }),
    translateToSerbian(content, { context, preserveHtml: true }),
  ]);
  
  console.log(`   ✅ Title: ${titleSr.substring(0, 50)}...`);
  console.log(`   ✅ Excerpt: ${excerptSr.substring(0, 50)}...`);
  console.log(`   ✅ Content: ${Math.round(contentSr.length / 1000)}k chars`);
  
  // Get existing meta fields
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: {
      metaTitle: true,
      metaDescription: true,
      newsTitle: true,
      newsContent: true,
    },
  });
  
  // Translate meta fields if they exist
  let metaTitleSr: string | null = null;
  let metaDescriptionSr: string | null = null;
  let newsTitleSr: string | null = null;
  let newsContentSr: string | null = null;
  
  if (post?.metaTitle) {
    metaTitleSr = await translateToSerbian(post.metaTitle, { context, preserveHtml: false });
  }
  if (post?.metaDescription) {
    metaDescriptionSr = await translateToSerbian(post.metaDescription, { context, preserveHtml: false });
  }
  if (post?.newsTitle) {
    newsTitleSr = await translateToSerbian(post.newsTitle, { context: 'match_preview', preserveHtml: false });
  }
  if (post?.newsContent) {
    newsContentSr = await translateToSerbian(post.newsContent, { context: 'match_preview', preserveHtml: true });
  }
  
  return {
    titleSr,
    excerptSr,
    contentSr,
    metaTitleSr,
    metaDescriptionSr,
    newsTitleSr,
    newsContentSr,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const limit = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];
  const dryRun = args.includes('--dry-run');
  
  console.log('🌍 Serbian Blog Post Translation Tool');
  console.log('=====================================\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be saved\n');
  }
  
  // Get posts that need translation
  const posts = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      titleSr: null, // Only translate posts that haven't been translated yet
    },
    select: {
      id: true,
      title: true,
      excerpt: true,
      content: true,
      category: true,
      postType: true,
    },
    orderBy: { publishedAt: 'desc' },
    take: limit ? parseInt(limit) : undefined,
  });
  
  console.log(`📊 Found ${posts.length} posts to translate\n`);
  
  if (posts.length === 0) {
    console.log('✨ All posts are already translated!');
    return;
  }
  
  const stats: TranslationStats = {
    total: posts.length,
    translated: 0,
    skipped: 0,
    failed: 0,
    cost: 0,
  };
  
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const context = post.category === 'Match Previews' || post.postType === 'MATCH_PREVIEW' 
      ? 'match_preview' 
      : 'blog';
    
    console.log(`\n[${i + 1}/${posts.length}] Processing: ${post.title}`);
    console.log(`   Category: ${post.category || 'N/A'} | Type: ${post.postType || 'N/A'}`);
    
    try {
      const translations = await translatePost(
        post.id,
        post.title,
        post.excerpt || '',
        post.content,
        context
      );
      
      if (!dryRun) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: translations,
        });
        console.log('   💾 Saved to database');
      } else {
        console.log('   🔍 Would save (dry-run mode)');
      }
      
      // Estimate cost
      const totalChars = post.title.length + (post.excerpt?.length || 0) + post.content.length;
      const tokens = Math.ceil(totalChars / AVG_CHARS_PER_TOKEN);
      const cost = (tokens / 1000) * COST_PER_1K_TOKENS;
      stats.cost += cost;
      
      console.log(`   💰 Estimated cost: $${cost.toFixed(4)}`);
      
      stats.translated++;
      
      // Rate limit: Wait 1 second between posts to avoid overwhelming OpenAI
      if (i < posts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      stats.failed++;
    }
  }
  
  // Final summary
  console.log('\n=====================================');
  console.log('📊 Translation Summary');
  console.log('=====================================');
  console.log(`✅ Successfully translated: ${stats.translated}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`💰 Total estimated cost: $${stats.cost.toFixed(4)}`);
  
  if (dryRun) {
    console.log('\n🔍 This was a dry run - no changes were saved');
    console.log('   Run without --dry-run to actually translate posts');
  } else {
    console.log('\n✨ Translation complete!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
