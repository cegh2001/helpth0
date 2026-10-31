/**
 * Single HTTP entry point for the browser.
 *
 * The dashboard used to call `fetch` directly and read `.json()` with no
 * guard, so an HTML error page or an empty 502 body surfaced as a SyntaxError
 * instead of the real status. Every response now goes through one place that:
 *
 * - never throws on a non-JSON body,
 * - raises a typed `ApiError` carrying the status and the server message,
 * - announces an expired session once, so the shell can redirect and toast.
 */

export interface ApiErrorOptions {
  status: number;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, options: ApiErrorOptions) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

const SESSION_EXPIRED_EVENT = 'helpth0:session-expired';

type JsonPayload = Record<string, unknown>;

export function onSessionExpired(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(SESSION_EXPIRED_EVENT, listener);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
}

function emitSessionExpired(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

async function readJsonPayload(response: Response): Promise<JsonPayload> {
  const text = await response.text().catch(() => '');
  if (!text) return {};
  try {
    const parsed: unknown = JSON.parse(text);
    return typeof parsed === 'object' && parsed !== null ? (parsed as JsonPayload) : {};
  } catch {
    return {};
  }
}

function payloadMessage(payload: JsonPayload, fallback: string): string {
  return typeof payload.error === 'string' && payload.error.trim() ? payload.error : fallback;
}

function throwForResponse(response: Response, payload: JsonPayload, fallback: string): never {
  if (response.status === 401) {
    emitSessionExpired();
    throw new ApiError('Tu sesión expiró. Volvé a iniciar sesión.', {
      status: 401,
      code: 'unauthorized',
    });
  }

  throw new ApiError(payloadMessage(payload, fallback), {
    status: response.status,
    code: typeof payload.code === 'string' ? payload.code : undefined,
    details: payload,
  });
}

export async function requestJson<T>(
  url: string,
  init: RequestInit | undefined,
  fallback: string
): Promise<T> {
  const response = await fetch(url, init);
  const payload = await readJsonPayload(response);

  if (!response.ok || payload.success === false) {
    throwForResponse(response, payload, fallback);
  }

  return payload as unknown as T;
}

export interface ApiFile {
  blob: Blob;
  headers: Headers;
}

/**
 * Downloads an attachment. A failed export answers with JSON, so the error body
 * is read before the blob: the user gets the real reason instead of a corrupt
 * file silently saved to disk.
 */
export async function requestFile(url: string, fallback: string): Promise<ApiFile> {
  const response = await fetch(url);

  if (!response.ok) {
    const payload = await readJsonPayload(response);
    throwForResponse(response, payload, fallback);
  }

  return { blob: await response.blob(), headers: response.headers };
}
