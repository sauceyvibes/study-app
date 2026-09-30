import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/admin/session';

/**
 * The admin deployment's front door.
 *
 * This branch is served on its own (sub)domain and exists only to edit the
 * corpus, so the root sends you to the editor, and everything under /admin and
 * /api/admin needs a valid session except the login page and endpoint.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') return NextResponse.redirect(new URL('/admin', request.url));
  if (pathname === '/admin/login' || pathname === '/api/admin/login') return NextResponse.next();

  if (await verifySession(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  const login = new URL('/admin/login', request.url);
  login.searchParams.set('next', pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/', '/admin/:path*', '/api/admin/:path*'],
};
