import { NextResponse } from 'next/server';
import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/lib/auth';
import { isAllowedUserEmail, isTrustedLocalRequest } from '@/lib/auth-policy';

const handlers = toNextJsHandler(auth);
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

function noStore(response: Response): Response {
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function GET(request: Request) {
  if (!isTrustedLocalRequest(request)) {
    return NextResponse.json(
      { error: 'Solicitud no permitida' },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }
  return noStore(await handlers.GET(request));
}

export async function POST(request: Request) {
  if (!isTrustedLocalRequest(request, true)) {
    return NextResponse.json(
      { error: 'Solicitud no permitida' },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const path = new URL(request.url).pathname;
  if (path.endsWith('/sign-up/email')) {
    return NextResponse.json(
      { error: 'Registro no disponible' },
      { status: 404, headers: NO_STORE_HEADERS }
    );
  }

  if (path.endsWith('/sign-in/email')) {
    const body = await request.clone().json().catch(() => null);
    if (!body || !isAllowedUserEmail(body.email)) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }
  }

  return noStore(await handlers.POST(request));
}