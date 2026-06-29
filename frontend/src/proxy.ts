import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Protect internal admin routes
  const isAdminRoute = 
    pathname === '/' || 
    pathname.startsWith('/clients') || 
    pathname.startsWith('/tasks') || 
    pathname.startsWith('/sows') || 
    pathname.startsWith('/reports') || 
    pathname.startsWith('/escalations') ||
    pathname.startsWith('/communications') ||
    pathname.startsWith('/meetings') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/team') ||
    pathname.startsWith('/logs');

  // Protect client portal routes
  const isClientRoute = pathname.startsWith('/client');

  if ((isAdminRoute || isClientRoute) && !token) {
    // If attempting to access an admin route without a token, redirect to internal login
    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // If attempting to access a client route without a token, redirect to portal login
    if (isClientRoute) {
      return NextResponse.redirect(new URL('/portal/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
