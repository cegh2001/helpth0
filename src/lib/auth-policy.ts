export function getAllowedUserEmail(): string {
  return (
    process.env.ADMIN_EMAIL?.trim().toLowerCase() ||
    process.env.ALLOWED_USER_EMAIL?.trim().toLowerCase() ||
    'parrq.candelaria.c@gmail.com'
  );
}

export const ALLOWED_USER_EMAIL = getAllowedUserEmail();

export function getTrustedOrigins(): string[] {
  const defaults = ['http://127.0.0.1:3000', 'http://localhost:3000'];
  const origins = new Set<string>(defaults);

  if (process.env.BETTER_AUTH_URL) {
    try {
      origins.add(new URL(process.env.BETTER_AUTH_URL).origin);
    } catch {
      origins.add(process.env.BETTER_AUTH_URL);
    }
  }

  if (process.env.ALLOWED_ORIGINS) {
    for (const origin of process.env.ALLOWED_ORIGINS.split(',')) {
      const trimmed = origin.trim();
      if (trimmed) {
        try {
          origins.add(new URL(trimmed).origin);
        } catch {
          origins.add(trimmed);
        }
      }
    }
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }

  return Array.from(origins);
}

export const TRUSTED_AUTH_ORIGINS = getTrustedOrigins();

export function isAllowedUserEmail(value: unknown): value is string {
  return typeof value === 'string' && value.trim().toLowerCase() === getAllowedUserEmail();
}

export function isTrustedRequest(request: Request, requireOrigin = false): boolean {
  const requestUrl = new URL(request.url);
  const requestOrigin = requestUrl.origin;
  const host = request.headers.get('host');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';

  const trustedOrigins = getTrustedOrigins();
  const isTrusted = (origin: string) => trustedOrigins.includes(origin);

  const directHostOrigin = host ? `${requestUrl.protocol}//${host}` : requestOrigin;
  const forwardedHostOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;

  const isHostTrusted =
    isTrusted(requestOrigin) ||
    isTrusted(directHostOrigin) ||
    (forwardedHostOrigin !== null && isTrusted(forwardedHostOrigin));

  if (!isHostTrusted) {
    return false;
  }

  const origin = request.headers.get('origin');
  if (origin) {
    const matchesHost =
      origin === directHostOrigin ||
      (forwardedHostOrigin !== null && origin === forwardedHostOrigin);

    return isTrusted(origin) && matchesHost;
  }

  if (requireOrigin) {
    return false;
  }

  return request.headers.get('sec-fetch-site') === 'same-origin';
}

export const isTrustedLocalRequest = isTrustedRequest;
