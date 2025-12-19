import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering (uses headers/session)
export const dynamic = 'force-dynamic'

// GET /api/favorites/check?teamName=...&sport=...
// Quick check if a specific team is favorited
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ isFavorite: false, authenticated: false })
    }

    const { searchParams } = new URL(request.url)
    const teamName = searchParams.get('teamName')
    const sport = searchParams.get('sport')

    if (!teamName || !sport) {
      return NextResponse.json(
        { error: 'teamName and sport are required' },
        { status: 400 }
      )
    }

    const teamSlug = teamName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const favorite = await prisma.favoriteTeam.findFirst({
      where: {
        userId: session.user.id,
        teamSlug,
        sport
      }
    })

    return NextResponse.json({ 
      isFavorite: !!favorite,
      authenticated: true,
      favoriteId: favorite?.id || null
    })
  } catch (error) {
    console.error('Error checking favorite:', error)
    return NextResponse.json(
      { error: 'Failed to check favorite status' },
      { status: 500 }
    )
  }
}
