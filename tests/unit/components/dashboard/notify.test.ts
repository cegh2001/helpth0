import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api-client';
import { describeError, notifyError } from '@/components/dashboard/notify';

const sonner = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
}));

vi.mock('sonner', () => ({ toast: sonner }));

beforeEach(() => {
  sonner.error.mockClear();
});

describe('describeError', () => {
  it('collapses any server failure into a message a person can act on', () => {
    const copy = describeError(
      new ApiError('Error interno del servidor', { status: 500 }),
      'Error al guardar los datos'
    );

    expect(copy).toStrictEqual({
      title: 'Error del servidor',
      description: 'No se pudo completar la operación. Intentá de nuevo en unos segundos.',
    });
  });

  it('keeps the domain message of a 4xx validation failure', () => {
    const copy = describeError(
      new ApiError('El nombre del médico es obligatorio', { status: 400 }),
      'Error al registrar médico'
    );

    expect(copy).toStrictEqual({ title: 'El nombre del médico es obligatorio' });
  });

  it('reports a dropped connection instead of leaking "Failed to fetch"', () => {
    const copy = describeError(new TypeError('Failed to fetch'), 'Error al obtener consultas');

    expect(copy).toStrictEqual({
      title: 'Sin conexión',
      description: 'Revisá tu conexión e intentá de nuevo.',
    });
  });

  it('accepts a plain string as the message of a local validation rule', () => {
    expect(
      describeError('El nombre del médico es obligatorio', 'Error al registrar médico')
    ).toStrictEqual({ title: 'El nombre del médico es obligatorio' });
  });

  it('falls back to the caller copy for values that carry no message', () => {
    expect(describeError(null, 'Error al procesar archivo')).toStrictEqual({
      title: 'Error al procesar archivo',
    });
  });
});

describe('notifyError', () => {
  it('forwards the mapped copy and the caller id to the toast', () => {
    const copy = notifyError(
      new ApiError('Error interno del servidor', { status: 500 }),
      'Error al guardar los datos',
      { id: 'import-confirm' }
    );

    expect(copy.title).toBe('Error del servidor');
    expect(sonner.error).toHaveBeenCalledWith('Error del servidor', {
      id: 'import-confirm',
      description: 'No se pudo completar la operación. Intentá de nuevo en unos segundos.',
      duration: 8000,
      action: undefined,
    });
  });

  it('lets the caller override the description when the operation adds context', () => {
    notifyError(new ApiError('Rango inválido', { status: 400 }), 'Error al exportar planilla', {
      description: 'Revisá las fechas seleccionadas.',
    });

    expect(sonner.error).toHaveBeenCalledWith('Rango inválido', {
      id: undefined,
      description: 'Revisá las fechas seleccionadas.',
      duration: 8000,
      action: undefined,
    });
  });
});
