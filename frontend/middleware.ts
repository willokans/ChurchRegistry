import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function internalApiRoutesDisabled(): boolean {
  // Safety valve for emergency rollback; keep disabled by default in production.
  return process.env.NODE_ENV === 'production' && process.env.NEXT_ALLOW_INTERNAL_API_ROUTES !== 'true';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/api/')) return NextResponse.next();
  if (pathname === '/api/health') return NextResponse.next();
  if (pathname === '/api/auth/forgot-password' || pathname === '/api/auth/reset-password-by-token') return NextResponse.next();
  if (!internalApiRoutesDisabled()) return NextResponse.next();

  return NextResponse.json(
    { error: 'Route disabled. Use Spring Boot API endpoints via NEXT_PUBLIC_API_URL.' },
    { status: 410 }
  );
}

export const config = {
  matcher: ['/api/:path*'],
};
