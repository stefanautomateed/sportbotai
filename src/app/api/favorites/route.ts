import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering (uses headers/session)
export const dynamic = 'force-dynamic'

// GET /api/favorites - Get user's favorite teams
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to view your teams' },
        { status: 401 }
      )
    }

    const favorites = await prisma.favoriteTeam.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json(
      { error: 'Failed to fetch favorite teams' },
      { status: 500 }
    )
  }
}

// POST /api/favorites - Add a team to favorites
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to save teams' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { teamName, sport, league, sportKey, teamLogo, country } = body

    if (!teamName || !sport) {
      return NextResponse.json(
        { error: 'Team name and sport are required' },
        { status: 400 }
      )
    }

    // Generate slug for matching
    const teamSlug = generateTeamSlug(teamName)

    // Check if already favorited
    const existing = await prisma.favoriteTeam.findFirst({
      where: {
        userId: session.user.id,
        teamSlug,
        sport
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Team already in favorites', favorite: existing },
        { status: 409 }
      )
    }

    // Check user's plan limits (free users get 3 teams)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true }
    })

    const count = await prisma.favoriteTeam.count({
      where: { userId: session.user.id }
    })

    const maxTeams = user?.plan === 'FREE' ? 3 : 20
    
    if (count >= maxTeams) {
      return NextResponse.json(
        { 
          error: `Free plan allows ${maxTeams} favorite teams. Upgrade for more!`,
          limit: true
        },
        { status: 403 }
      )
    }

    const favorite = await prisma.favoriteTeam.create({
      data: {
        userId: session.user.id,
        teamName,
        teamSlug,
        sport,
        league: league || null,
        sportKey: sportKey || null,
        teamLogo: teamLogo || null,
        country: country || null
      }
    })

    return NextResponse.json({ favorite }, { status: 201 })
  } catch (error) {
    console.error('Error adding favorite:', error)
    return NextResponse.json(
      { error: 'Failed to add team to favorites' },
      { status: 500 }
    )
  }
}

// DELETE /api/favorites - Remove a team from favorites
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const teamName = searchParams.get('teamName')
    const sport = searchParams.get('sport')

    // Delete by ID or by teamName+sport
    if (id) {
      await prisma.favoriteTeam.delete({
        where: { 
          id,
          userId: session.user.id // Ensure user owns this favorite
        }
      })
    } else if (teamName && sport) {
      const teamSlug = generateTeamSlug(teamName)
      await prisma.favoriteTeam.deleteMany({
        where: {
          userId: session.user.id,
          teamSlug,
          sport
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Provide either id or teamName+sport' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json(
      { error: 'Failed to remove team from favorites' },
      { status: 500 }
    )
  }
}

// Helper: Generate consistent slug from team name
function generateTeamSlug(teamName: string): string {
  return teamName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
