import { NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_TTL_SECONDS, adminConfigured, checkPassword, createSession } from '@/admin/session';

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD is not set on this deployment' }, { status: 503 });
  }
  const body = (await request.json().catch(() => ({}))) as { password?: unknown };
  if (typeof body.password !== 'string' || !(await checkPassword(body.password))) {
    // A flat delay makes guessing slow without needing somewhere to count attempts.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
