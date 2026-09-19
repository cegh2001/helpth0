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

