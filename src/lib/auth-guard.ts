import 'server-only';
import { auth } from '@/lib/auth';
import { isAllowedUserEmail } from '@/lib/auth-policy';
import { unauthorizedResponse } from '@/lib/http-response';

export async function getAuthorizedSession(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  return session && isAllowedUserEmail(session.user.email) ? session : null;
}

export async function requireApiSession(request: Request) {
  const session = await getAuthorizedSession(request.headers);
  return session ? null : unauthorizedResponse();
}