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
 * Formats a calendar date ('YYYY-MM-DD') into Latin American / Venezuelan display format ('DD/MM/YYYY').
 * If the input is already in 'DD/MM/YYYY', it is returned unchanged.
 * If input is null, undefined, or empty, returns an empty string.
 */
export function formatDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}/${month}/${year}`;
  }
  return trimmed;
}

/**
 * Normalizes any incoming date value (ISO string 'YYYY-MM-DD', 'DD/MM/YYYY', 'DD-MM-YYYY', or Date object)
 * into a canonical 'YYYY-MM-DD' calendar date string.
 * Returns empty string if invalid or empty.
 */
export function normalizeToIsoDate(val: unknown): string {
  if (!val) return '';
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? '' : val.toISOString().slice(0, 10);
  }
  const str = String(val).trim();
  // Match YYYY-MM-DD or YYYY/MM/DD (allowing 1 or 2 digits, with optional trailing text/time)
  const ymdMatch = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/.exec(str);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  // Match DD/MM/YYYY or DD-MM-YYYY (allowing 1 or 2 digits, with optional trailing text/time)
  const dmyMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(str);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  return '';
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

/**
 * Returns current local time as 'HH:mm'.
 */
export function getCurrentTimeString(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Converts 'HH:mm' to minutes from midnight (0..1439).
 */
export function timeToMinutes(t: string): number {
  if (!t) return 0;
  const parts = t.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

/**
 * Determines whether a given time is within a shift [startTime, endTime].
 * Handles standard shifts (e.g. 08:00 - 14:00) and overnight shifts (e.g. 22:00 - 06:00).
 */
export function isTimeWithinRange(
  timeStr: string,
  startTime: string,
  endTime: string
): boolean {
  const current = timeToMinutes(timeStr);
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (start <= end) {
    return current >= start && current <= end;
  }
  // Overnight shift
  return current >= start || current <= end;
}

export type ShiftDutyStatus = 'on_duty' | 'completed' | 'upcoming' | 'unscheduled';

/**
 * Evaluates the real-time duty status for a doctor based on their schedules and current time.
 */
export function getDoctorDutyStatus(
  schedules: { startTime: string; endTime: string }[],
  isToday: boolean,
  currentTimeStr: string = getCurrentTimeString()
): ShiftDutyStatus {
  if (!schedules || schedules.length === 0) {
    return 'unscheduled';
  }
  if (!isToday) {
    return 'upcoming';
  }

  // 1. Check if currently inside any shift
  const isCurrentlyInShift = schedules.some((s) =>
    isTimeWithinRange(currentTimeStr, s.startTime, s.endTime)
  );
  if (isCurrentlyInShift) {
    return 'on_duty';
  }

  // 2. Not in shift right now. Check if all shifts are in the past or in the future
  const nowMins = timeToMinutes(currentTimeStr);
  let allCompleted = true;
  let allUpcoming = true;

  for (const s of schedules) {
    const startM = timeToMinutes(s.startTime);
    const endM = timeToMinutes(s.endTime);

    if (startM <= endM) {
      if (nowMins <= endM) allCompleted = false;
      if (nowMins >= startM) allUpcoming = false;
    } else {
      // Overnight shift
      allCompleted = false;
      allUpcoming = false;
    }
  }

  if (allCompleted) return 'completed';
  if (allUpcoming) return 'upcoming';
  return 'completed';
}

