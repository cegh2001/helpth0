import { NextResponse } from 'next/server';
import { bootstrapAuth } from '@/lib/auth';
import { ALLOWED_USER_EMAIL, isAllowedUserEmail, isTrustedLocalRequest } from '@/lib/auth-policy';
import { prisma } from '@/infrastructure/persistence/prisma/prisma.client';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export async function GET(request: Request) {
  if (!isTrustedLocalRequest(request)) {
    return jsonResponse({ error: 'Solicitud no permitida' }, 403);
  }

  return jsonResponse({ configured: await prisma.user.count() > 0 });
}

export async function POST(request: Request) {
  if (!isTrustedLocalRequest(request, true)) {
    return jsonResponse({ error: 'Solicitud no permitida' }, 403);
  }

  if (await prisma.user.count() > 0) {
    return jsonResponse({ error: 'La configuración inicial ya está cerrada' }, 409);
  }

  const body = await request.json().catch(() => null);
  if (!body || !isAllowedUserEmail(body.email) || typeof body.password !== 'string') {
    return jsonResponse({ error: 'Datos de configuración inválidos' }, 400);
  }
  if (body.password.length < 8 || body.password.length > 128) {
    return jsonResponse({ error: 'La contraseña debe tener entre 8 y 128 caracteres' }, 400);
  }

  try {
    const signUpResponse = await bootstrapAuth.api.signUpEmail({
      headers: request.headers,
      body: {
        name: 'Administrador',
        email: ALLOWED_USER_EMAIL,
        password: body.password,
      },
      asResponse: true,
    });

    if (!signUpResponse.ok) {
      console.error('[setup] bootstrap failed', { status: signUpResponse.status });
      return jsonResponse({ error: 'No se pudo completar la configuración' }, 409);
    }

    const response = jsonResponse({ success: true });
    const cookieHeaders = signUpResponse.headers.getSetCookie?.() ?? [];
    if (cookieHeaders.length > 0) {
      for (const cookieHeader of cookieHeaders) {
        response.headers.append('set-cookie', cookieHeader);
      }
    } else {
      const cookieHeader = signUpResponse.headers.get('set-cookie');
      if (cookieHeader) {
        response.headers.set('set-cookie', cookieHeader);
      }
    }
    return response;
  } catch (error) {
    console.error('[setup] bootstrap failed', {
      errorType: error instanceof Error ? error.name : typeof error,
    });
    return jsonResponse({ error: 'No se pudo completar la configuración' }, 409);
  }
}