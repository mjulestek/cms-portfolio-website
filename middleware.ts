import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  if (process.env.ADMIN_AUTH_BYPASS === 'true') {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'ADMIN_AUTH_BYPASS must never be enabled in production' } },
        { status: 403 },
      );
    }
    return NextResponse.next();
  }

  // Admin API routes enforce auth and ADMIN role inside each route via requireAdmin().
  // Letting the request reach the route keeps JSON 401/403 responses consistent.
  if (req.nextUrl.pathname.startsWith('/api/admin')) return NextResponse.next();

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
