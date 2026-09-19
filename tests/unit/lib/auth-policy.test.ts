import { describe, expect, it } from 'vitest';
import {
  ALLOWED_USER_EMAIL,
  isAllowedUserEmail,
  isTrustedLocalRequest,
} from '@/lib/auth-policy';

describe('authentication policy', () => {
  it('allows only the configured single-user email', () => {
    expect(isAllowedUserEmail(ALLOWED_USER_EMAIL)).toBe(true);
    expect(isAllowedUserEmail(` ${ALLOWED_USER_EMAIL.toUpperCase()} `)).toBe(true);
    expect(isAllowedUserEmail('another@example.com')).toBe(false);
  });

  it('accepts a same-origin local mutation', () => {
    const request = new Request('http://127.0.0.1:3000/api/setup', {
      method: 'POST',
      headers: {
        host: '127.0.0.1:3000',
        origin: 'http://127.0.0.1:3000',
      },
    });

    expect(isTrustedLocalRequest(request, true)).toBe(true);
  });

  it('uses the actual host when Next.js normalizes the request URL hostname', () => {
    const request = new Request('http://localhost:3000/api/setup', {
      method: 'POST',
      headers: {
        host: '127.0.0.1:3000',
        origin: 'http://127.0.0.1:3000',
      },
    });

    expect(isTrustedLocalRequest(request, true)).toBe(true);
  });

  it('rejects missing or mismatched origins for mutations', () => {
    expect(isTrustedLocalRequest(
      new Request('http://127.0.0.1:3000/api/setup', { method: 'POST' }),
      true
    )).toBe(false);
    expect(isTrustedLocalRequest(
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

  it('rejects non-local request hosts', () => {
    const request = new Request('http://clinic.example/api/setup', {
      headers: { 'sec-fetch-site': 'same-origin' },
    });

    expect(isTrustedLocalRequest(request)).toBe(false);
  });
});