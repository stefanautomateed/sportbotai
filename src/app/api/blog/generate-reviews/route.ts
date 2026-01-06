import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { generateToolReviewPosts, getToolsReadyForReview } from '@/lib/blog/tool-review-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * Dedicated endpoint for generating ONLY tool reviews
 * GET /api/blog/generate-reviews?count=5
 * 
 * Use x-vercel-cron: 1 header to bypass auth (for testing)
 */
export async function GET(request: NextRequest) {
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  
  if (!isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const count = parseInt(request.nextUrl.searchParams.get('count') || '5');
  
  console.log(`[Tool Review Cron] Starting generation of ${count} reviews...`);
  
  try {
    const toolsReady = await getToolsReadyForReview();
    const actualCount = Math.min(count, toolsReady);
    
    if (toolsReady === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tools ready for review',
        toolsReady: 0,
        generated: 0
      });
    }
    
    console.log(`[Tool Review Cron] ${toolsReady} tools ready, generating ${actualCount}...`);
    
    const results = await generateToolReviewPosts(actualCount);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    // Revalidate blog pages
    if (successful.length > 0) {
      revalidatePath('/blog');
      console.log('[Tool Review Cron] Revalidated /blog cache');
    }
    
    console.log(`[Tool Review Cron] Complete: ${successful.length} generated, ${failed.length} failed`);
    
    return NextResponse.json({
      success: true,
      toolsReady,
      generated: successful.length,
      failed: failed.length,
      reviews: results.map(r => ({
        tool: r.toolName,
        success: r.success,
        slug: r.slug,
        error: r.error
      }))
    });
  } catch (error) {
    console.error('[Tool Review Cron] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
