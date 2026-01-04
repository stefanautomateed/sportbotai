/**
 * API Route: Update User Avatar
 * 
 * POST /api/user/avatar
 * Accepts base64 encoded image data and saves it to the user's profile
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Validate that it's a valid data URL (base64 image)
    if (!image.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    // Check image size (limit to ~500KB base64 which is ~375KB actual)
    if (image.length > 500000) {
      return NextResponse.json({ error: 'Image too large. Please use an image under 500KB.' }, { status: 400 });
    }

    // Update user's image in database
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { image },
      select: { image: true },
    });

    return NextResponse.json({ 
      success: true, 
      image: updatedUser.image 
    });
  } catch (error) {
    console.error('Error updating avatar:', error);
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove user's image
    await prisma.user.update({
      where: { email: session.user.email },
      data: { image: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing avatar:', error);
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
  }
}
