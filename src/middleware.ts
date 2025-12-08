import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Protected routes that require authentication.
 */
const protectedRoutes = ['/analyzer'];

/**
 * Auth routes - redirect to analyzer if already logged in.
 */
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the token (session)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if route is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect to analyzer if accessing auth route while logged in
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/analyzer', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected routes
    '/analyzer/:path*',
    // Auth routes
    '/login',
    '/register',
  ],
};
