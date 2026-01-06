import { NextRequest, NextResponse } from 'next/server';
import { sendToolReviewOutreach } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint to verify email sending works
 * GET /api/test-email?to=your@email.com
 * 
 * Requires x-vercel-cron: 1 header for security
 */
export async function GET(request: NextRequest) {
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  
  if (!isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const to = request.nextUrl.searchParams.get('to');
  
  if (!to) {
    return NextResponse.json({ error: 'Missing ?to=email parameter' }, { status: 400 });
  }

  // Check if Brevo API key exists
  const hasBrevoKey = !!process.env.BREVO_API_KEY;
  
  if (!hasBrevoKey) {
    return NextResponse.json({ 
      success: false, 
      error: 'BREVO_API_KEY not configured in environment variables',
      hasBrevoKey: false
    });
  }

  try {
    // Send a test outreach email
    const result = await sendToolReviewOutreach(
      to,
      'Test Tool (Demo)',
      'https://www.sportbotai.com/blog/test-review'
    );

    return NextResponse.json({
      success: result,
      sentTo: to,
      hasBrevoKey: true,
      message: result ? 'Email sent successfully! Check your inbox.' : 'Email send failed - check Brevo dashboard for errors'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasBrevoKey: true
    });
  }
}
