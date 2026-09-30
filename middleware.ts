import { NextResponse, type NextRequest } from 'next/server';
import { accessConfig, verifyAccessToken } from '@/admin/cloudflare-access';

/**
 * The admin deployment's front door.
 *
 * This branch is served on its own subdomain and exists only to edit the corpus,
 * so the root sends you to the editor. Signing in is Cloudflare Zero Trust's job;
 * here we only confirm the request actually came through it (see
 * `cloudflare-access.ts`), so the `*.vercel.app` address cannot be used to get
 * around it. Until CF_ACCESS_TEAM_DOMAIN and CF_ACCESS_AUD are set, nothing is
 * checked, which is what local development wants.
 */
export async function middleware(request: NextRequest) {
  const config = accessConfig();
  if (config) {
    const token = request.headers.get('cf-access-jwt-assertion') ?? request.cookies.get('CF_Authorization')?.value;
    if (!(await verifyAccessToken(token, config).catch(() => false))) {
      return new NextResponse('Forbidden: open this site through its Cloudflare Access address.', { status: 403 });
    }
  }
  if (request.nextUrl.pathname === '/') return NextResponse.redirect(new URL('/admin', request.url));
  return NextResponse.next();
}

export const config = {
  // Everything but Next's own static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
