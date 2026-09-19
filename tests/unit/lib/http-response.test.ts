import { describe, expect, it, vi } from 'vitest';
import { apiErrorResponse } from '@/lib/http-response';

describe('apiErrorResponse', () => {
  it('maps known application failures to a safe status and message', async () => {
    const response = apiErrorResponse(new Error('Doctor not found'), 'test');

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Médico no encontrado',
    });
  });

  it('never exposes unknown internal error messages', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = apiErrorResponse(
      new Error('SQLITE_CONSTRAINT: private internal detail'),
      'test'
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Error interno del servidor',
    });
    expect(errorSpy).toHaveBeenCalled();
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('private internal detail');
    errorSpy.mockRestore();
  });
});