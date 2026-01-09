/**
 * Generate tool reviews and send outreach emails
 * Run: npx tsx scripts/generate-reviews.ts
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { generateToolReviewPosts, getToolsReadyForReview } = require('../src/lib/blog/tool-review-generator');

async function main() {
  const count = parseInt(process.argv[2] || '6');
  
  console.log('🔍 Checking tools ready for review...');
  const ready = await getToolsReadyForReview();
  console.log(`Found ${ready} tools ready\n`);
  
  if (ready === 0) {
    console.log('No tools ready for review.');
    return;
  }
  
  const toGenerate = Math.min(count, ready);
  console.log(`🚀 Generating ${toGenerate} tool reviews with outreach emails...\n`);
  
  const results = await generateToolReviewPosts(toGenerate);
  
  console.log('\n' + '='.repeat(60));
  console.log('RESULTS');
  console.log('='.repeat(60));
  
  const successful = results.filter((r: any) => r.success);
  const failed = results.filter((r: any) => !r.success);
  
  results.forEach((r: any) => {
    if (r.success) {
      console.log(`✅ ${r.toolName}`);
      console.log(`   Blog: /blog/${r.slug}`);
    } else {
      console.log(`❌ ${r.toolName}: ${r.error}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Generated: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
