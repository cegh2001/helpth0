/**
 * Date utilities to handle local calendar dates ('YYYY-MM-DD')
 * without UTC shift discrepancies (e.g. toISOString converting local evening to tomorrow UTC).
 */

/**
 * Formats a Date object into 'YYYY-MM-DD' using local timezone components.
 */
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a 'YYYY-MM-DD' string into a local Date object set to midnight (00:00:00 local time).
 */
export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = (parts[1] || 1) - 1;
  const day = parts[2] || 1;
  return new Date(year, month, day, 0, 0, 0, 0);
}

/**
 * Shifts a 'YYYY-MM-DD' string by a given number of days in local calendar time.
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}
