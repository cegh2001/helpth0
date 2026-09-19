import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedSession } from '@/lib/auth-guard';
import { prisma } from '@/infrastructure/persistence/prisma/prisma.client';

const PUBLIC_PATHS = new Set(['/login', '/setup']);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/api/auth/') || pathname === '/api/setup' || PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const session = await getAuthorizedSession(request.headers);
  if (session) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { success: false, error: 'Autenticación requerida' },
      { status: 401 }
    );
  }

  const destination = await prisma.user.count() === 0 ? '/setup' : '/login';
  return NextResponse.redirect(new URL(destination, request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};