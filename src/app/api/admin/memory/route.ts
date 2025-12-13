/**
 * SportBot Memory Admin API
 * 
 * View memory stats, trending topics, and frequent questions.
 * Useful for understanding what users are asking about.
 * 
 * GET /api/admin/memory - Get memory stats
 * GET /api/admin/memory?view=trending - Get trending topics
 * GET /api/admin/memory?view=questions - Get frequent questions
 * GET /api/admin/memory?view=categories - Get top categories
 * GET /api/admin/memory?view=teams - Get most asked about teams
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getMemoryStats,
  getTrendingTopics,
  getFrequentQuestions,
  getTopCategories,
  getTopTeams,
  getAccuracyStats,
} from '@/lib/sportbot-memory';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin (optional - you can remove this for testing)
    const session = await getServerSession(authOptions);
    
    // For now, allow access without auth for testing
    // In production, you'd want: if (!session || session.user?.email !== 'admin@...')
    
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'stats';
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    
    switch (view) {
      case 'trending':
        const trending = await getTrendingTopics(limit);
        return NextResponse.json({
          success: true,
          view: 'trending',
          data: trending,
        });
        
      case 'questions':
        const questions = await getFrequentQuestions(category || undefined, limit);
        return NextResponse.json({
          success: true,
          view: 'questions',
          category: category || 'all',
          data: questions,
        });
        
      case 'categories':
        const categories = await getTopCategories(limit);
        return NextResponse.json({
          success: true,
          view: 'categories',
          data: categories,
        });
        
      case 'teams':
        const teams = await getTopTeams(limit);
        return NextResponse.json({
          success: true,
          view: 'teams',
          data: teams,
        });
        
      case 'accuracy':
        const accuracy = await getAccuracyStats();
        return NextResponse.json({
          success: true,
          view: 'accuracy',
          data: accuracy,
        });
        
      case 'stats':
      default:
        const stats = await getMemoryStats();
        return NextResponse.json({
          success: true,
          view: 'stats',
          data: stats,
          availableViews: ['stats', 'trending', 'questions', 'categories', 'teams', 'accuracy'],
        });
    }
    
  } catch (error) {
    console.error('[Memory API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memory data' },
      { status: 500 }
    );
  }
}
