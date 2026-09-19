import { NextResponse } from 'next/server';

const SAFE_ERRORS = new Map<string, { status: number; message: string }>([
  ['Doctor not found', { status: 404, message: 'Médico no encontrado' }],
  ['Schedule not found', { status: 404, message: 'Turno no encontrado' }],
  ['Schedule does not belong to doctor', { status: 409, message: 'El turno no pertenece al médico' }],
  ['Schedule does not match date', { status: 409, message: 'El turno no corresponde al día indicado' }],
  ['Doctor ID cannot be empty', { status: 400, message: 'El médico es obligatorio' }],
  ['Doctor name cannot be empty', { status: 400, message: 'El nombre del médico es obligatorio' }],
  ['Date must be in YYYY-MM-DD format', { status: 400, message: 'La fecha debe usar el formato YYYY-MM-DD' }],
  ['Date must be a valid calendar date', { status: 400, message: 'La fecha no es válida' }],
  ['Start date cannot be after end date', { status: 400, message: 'La fecha inicial no puede ser posterior a la final' }],
  ['Patient count must be an integer', { status: 400, message: 'La cantidad debe ser un número entero' }],
  ['Patient count cannot be negative', { status: 400, message: 'La cantidad no puede ser negativa' }],
  ['Time must be in HH:mm 24-hour format', { status: 400, message: 'El horario debe usar el formato HH:mm' }],
  ['Start time and end time must be different', { status: 400, message: 'El inicio y el fin del turno deben ser distintos' }],
]);

export function apiErrorResponse(error: unknown, context: string): NextResponse {
  const message = error instanceof Error ? error.message : '';
  const known = message.startsWith('Overlapping schedule detected')
    ? { status: 409, message: 'Los turnos no pueden superponerse' }
    : SAFE_ERRORS.get(message);

  if (known) {
    return NextResponse.json({ success: false, error: known.message }, { status: known.status });
  }

  console.error(`[${context}] request failed`, {
    errorType: error instanceof Error ? error.name : typeof error,
  });
  return NextResponse.json(
    { success: false, error: 'Error interno del servidor' },
    { status: 500 }
  );
}

export function badRequest(error: string): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 400 });
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Autenticación requerida' },
    { status: 401 }
  );
}