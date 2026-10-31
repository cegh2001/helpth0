const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function assertValidCalendarDate(value: string): void {
  if (!DATE_PATTERN.test(value)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error('Date must be a valid calendar date');
  }
}

export function getCalendarDayOfWeek(value: string): number {
  assertValidCalendarDate(value);
  return new Date(`${value}T00:00:00.000Z`).getUTCDay();
}

const DAY_NAMES = [
  'DOMINGO',
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
] as const;

export function getCalendarDayName(value: string): string {
  return DAY_NAMES[getCalendarDayOfWeek(value)];
}

export function assertValidCalendarDateRange(startDate: string, endDate: string): void {
  assertValidCalendarDate(startDate);
  assertValidCalendarDate(endDate);

  if (startDate > endDate) {
    throw new Error('Start date cannot be after end date');
  }
}