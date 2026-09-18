import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    const token =
      request.cookies.get('kyquy_token')?.value ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Giữ backward compatibility cho middleware
export const middleware = proxy;

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};

