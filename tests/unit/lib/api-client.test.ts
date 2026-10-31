import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, onSessionExpired, requestFile, requestJson } from '@/lib/api-client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function captureError(run: Promise<unknown>): Promise<Error> {
  try {
    await run;
  } catch (error) {
    return error as Error;
  }
  throw new Error('Expected the request to fail, but it completed');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('requestJson', () => {
  it('returns the parsed payload when the response succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ success: true, data: { inserted: 3 } }))
    );

    const payload = await requestJson<{ data: { inserted: number } }>(
      '/api/consultations',
      undefined,
      'Error al obtener consultas'
    );

    expect(payload.data.inserted).toBe(3);
  });

  it('raises the server message when the API rejects the request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: 'El médico es obligatorio' }, 400))
    );

    const failure = await captureError(
      requestJson('/api/doctors', { method: 'POST' }, 'Error al registrar médico')
    );

    expect(failure.name).toBe('ApiError');
    expect(failure.message).toBe('El médico es obligatorio');
    expect((failure as ApiError).status).toBe(400);
  });

  it('keeps the fallback copy when the failure body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('<html>Bad gateway</html>', {
            status: 502,
            headers: { 'Content-Type': 'text/html' },
          })
      )
    );

    const failure = await captureError(
      requestJson('/api/exams', undefined, 'Error al obtener exámenes')
    );

    expect(failure.name).toBe('ApiError');
    expect(failure.message).toBe('Error al obtener exámenes');
    expect((failure as ApiError).status).toBe(502);
  });

  it('announces the expired session exactly once on 401', async () => {
    const browser = new EventTarget();
    vi.stubGlobal('window', browser);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: 'Autenticación requerida' }, 401))
    );

    const listener = vi.fn();
    const unsubscribe = onSessionExpired(listener);

    const failure = await captureError(
      requestJson('/api/consultations', undefined, 'Error al obtener consultas')
    );

    unsubscribe();

    expect(failure.message).toBe('Tu sesión expiró. Volvé a iniciar sesión.');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('treats a 200 with success false as a failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ success: false, error: 'Los turnos no pueden superponerse' }))
    );

    const failure = await captureError(
      requestJson('/api/schedules', { method: 'POST' }, 'Error al guardar horarios')
    );

    expect(failure.message).toBe('Los turnos no pueden superponerse');
  });
});

describe('requestFile', () => {
  it('surfaces the export error body instead of downloading a broken file', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: 'Rango de fechas inválido' }, 400))
    );

    const failure = await captureError(
      requestFile('/api/consultations/export', 'Error al generar Excel')
    );

    expect(failure.name).toBe('ApiError');
    expect(failure.message).toBe('Rango de fechas inválido');
  });

  it('returns the blob and the headers that carry the file name', async () => {
    const contentDisposition = 'attachment; filename="helpth0_consultas_2026-10-31.xlsx"';
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('spreadsheet-bytes', {
            status: 200,
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'Content-Disposition': contentDisposition,
            },
          })
      )
    );

    const file = await requestFile('/api/consultations/export', 'Error al generar Excel');

    expect(file.headers.get('content-disposition')).toBe(contentDisposition);
    expect(await file.blob.text()).toBe('spreadsheet-bytes');
  });
});
