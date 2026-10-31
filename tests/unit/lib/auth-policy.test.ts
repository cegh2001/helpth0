import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ALLOWED_USER_EMAIL,
  getAllowedUserEmail,
  getTrustedOrigins,
  isAllowedUserEmail,
  isTrustedRequest,
} from '@/lib/auth-policy';

describe('authentication policy', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('allows only the configured single-user email', () => {
    expect(isAllowedUserEmail(ALLOWED_USER_EMAIL)).toBe(true);
    expect(isAllowedUserEmail(` ${ALLOWED_USER_EMAIL.toUpperCase()} `)).toBe(true);
    expect(isAllowedUserEmail('another@example.com')).toBe(false);
  });

  it('reads admin email from environment variable when provided', () => {
    process.env.ADMIN_EMAIL = 'custom.admin@clinic.com';
    expect(getAllowedUserEmail()).toBe('custom.admin@clinic.com');
    expect(isAllowedUserEmail('custom.admin@clinic.com')).toBe(true);
    expect(isAllowedUserEmail('parrq.candelaria.c@gmail.com')).toBe(false);
  });

  it('accepts a same-origin local mutation', () => {
    const request = new Request('http://127.0.0.1:3000/api/setup', {
      method: 'POST',
      headers: {
        host: '127.0.0.1:3000',
        origin: 'http://127.0.0.1:3000',
      },
    });

    expect(isTrustedRequest(request, true)).toBe(true);
  });

  it('uses the actual host when Next.js normalizes the request URL hostname', () => {
    const request = new Request('http://localhost:3000/api/setup', {
      method: 'POST',
      headers: {
        host: '127.0.0.1:3000',
        origin: 'http://127.0.0.1:3000',
      },
    });

    expect(isTrustedRequest(request, true)).toBe(true);
  });

  it('rejects missing or mismatched origins for mutations', () => {
    expect(isTrustedRequest(
      new Request('http://127.0.0.1:3000/api/setup', { method: 'POST' }),
      true
    )).toBe(false);
    expect(isTrustedRequest(
      new Request('http://127.0.0.1:3000/api/setup', {
        method: 'POST',
        headers: {
          host: '127.0.0.1:3000',
          origin: 'http://localhost:3000',
        },
      }),
      true
    )).toBe(false);
  });

  it('rejects non-trusted request hosts', () => {
    const request = new Request('http://clinic.example/api/setup', {
      headers: { 'sec-fetch-site': 'same-origin' },
    });

    expect(isTrustedRequest(request)).toBe(false);
  });

  it('accepts production host when configured in BETTER_AUTH_URL or VERCEL_URL', () => {
    process.env.BETTER_AUTH_URL = 'https://helpth0.vercel.app';
    const trustedOrigins = getTrustedOrigins();
    expect(trustedOrigins).toContain('https://helpth0.vercel.app');

    const request = new Request('https://helpth0.vercel.app/api/setup', {
      method: 'POST',
      headers: {
        host: 'helpth0.vercel.app',
        origin: 'https://helpth0.vercel.app',
      },
    });

    expect(isTrustedRequest(request, true)).toBe(true);
  });
});
