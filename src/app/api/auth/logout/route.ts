import { NextRequest, NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  await clearSession();
  const response = NextResponse.json({ success: true });
  response.cookies.set('lotengo_admin_token', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
  });
  return response;
}

export async function GET(req: NextRequest) {
  await clearSession();
  const loginUrl = new URL('/admin/login', req.url);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.set('lotengo_admin_token', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
  });
  return response;
}
