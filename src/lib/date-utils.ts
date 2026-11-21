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

function isValidCalendarParts(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

function formatCalendarIso(year: number, month: number, day: number): string {
  if (!isValidCalendarParts(year, month, day)) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Normalizes any incoming date value (ISO string 'YYYY-MM-DD', 'DD/MM/YYYY', 'DD/MM/YY',
 * 'DD.MM.YYYY', unambiguous 'MM/DD/YYYY', Excel serial numbers, Date objects, or ExcelJS
 * formula/richText cell objects) into a canonical 'YYYY-MM-DD' calendar date string.
 * Returns empty string if invalid or empty.
 */
export function normalizeToIsoDate(val: unknown): string {
  if (val == null || val === '') return '';
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? '' : val.toISOString().slice(0, 10);
  }
  if (typeof val === 'number') {
    if (!Number.isFinite(val) || val < 1000 || val >= 100000) return '';
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }
  if (typeof val === 'object') {
    const record = val as Record<string, unknown>;
    if ('result' in record) return normalizeToIsoDate(record.result);
    if ('richText' in record && Array.isArray(record.richText)) {
      const text = record.richText
        .map((part) =>
          part && typeof part === 'object' && 'text' in part
            ? String((part as Record<string, unknown>).text ?? '')
            : ''
        )
        .join('');
      return normalizeToIsoDate(text);
    }
    if ('text' in record && typeof record.text === 'string') {
      return normalizeToIsoDate(record.text);
    }
    return '';
  }

  const str = String(val).trim();
  const ymdMatch = /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:\b|T|\s|$)/.exec(str);
  if (ymdMatch) {
    return formatCalendarIso(
      parseInt(ymdMatch[1], 10),
      parseInt(ymdMatch[2], 10),
      parseInt(ymdMatch[3], 10)
    );
  }

  const dmyMatch = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})(?:\b|T|\s|$)/.exec(str);
  if (dmyMatch) {
    const first = parseInt(dmyMatch[1], 10);
    const second = parseInt(dmyMatch[2], 10);
    const rawYear = dmyMatch[3];
    const year =
      rawYear.length === 2
        ? parseInt(rawYear, 10) <= 49
          ? 2000 + parseInt(rawYear, 10)
          : 1900 + parseInt(rawYear, 10)
        : parseInt(rawYear, 10);

    // Default to LatAm DD/MM, switching to MM/DD only when the second field exceeds 12.
    const [day, month] =
      first <= 12 && second > 12 && second <= 31 ? [second, first] : [first, second];
    return formatCalendarIso(year, month, day);
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

