/**
 * Translation API endpoint
 * POST /api/translate
 * 
 * Translates AI analysis text from English to Serbian
 */

import { NextRequest, NextResponse } from 'next/server';
import { translateToSerbian } from '@/lib/translate';

export const runtime = 'edge';
export const maxDuration = 30;

interface TranslateRequest {
  text: string;
  context?: 'news' | 'blog' | 'match_preview' | 'analysis';
  preserveHtml?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: TranslateRequest = await request.json();
    const { text, context = 'analysis', preserveHtml = false } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Translate using OpenAI
    const translated = await translateToSerbian(text, {
      context,
      preserveHtml,
    });

    return NextResponse.json({
      success: true,
      original: text,
      translated,
      length: {
        original: text.length,
        translated: translated.length,
      },
    });
  } catch (error) {
    console.error('Translation API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Translation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
