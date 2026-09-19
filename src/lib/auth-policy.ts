export const ALLOWED_USER_EMAIL = 'parrq.candelaria.c@gmail.com';

export const TRUSTED_AUTH_ORIGINS = [
  'http://127.0.0.1:3000',
  'http://localhost:3000',
] as const;

export function isAllowedUserEmail(value: unknown): value is string {
  return typeof value === 'string' && value.trim().toLowerCase() === ALLOWED_USER_EMAIL;
}

export function isTrustedLocalRequest(request: Request, requireOrigin = false): boolean {
  const requestUrl = new URL(request.url);
  const requestOrigin = requestUrl.origin;
  const host = request.headers.get('host');
  const hostOrigin = host ? `${requestUrl.protocol}//${host}` : requestOrigin;
  const isTrustedOrigin = (origin: string) =>
    TRUSTED_AUTH_ORIGINS.includes(origin as (typeof TRUSTED_AUTH_ORIGINS)[number]);

  if (!isTrustedOrigin(requestOrigin) || !isTrustedOrigin(hostOrigin)) {
    return false;
  }

  const origin = request.headers.get('origin');
  if (origin) {
    return isTrustedOrigin(origin) && origin === hostOrigin;
  }

  if (requireOrigin) {
    return false;
  }

  return request.headers.get('sec-fetch-site') === 'same-origin';
}