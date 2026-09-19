import { describe, it, expect } from 'vitest';
import {
  formatLocalDate,
  parseLocalDate,
  addDaysToDateString,
  isTimeWithinRange,
  getDoctorDutyStatus,
} from '@/lib/date-utils';

describe('Date Utilities (Local Timezone Safe)', () => {
  it('formats a date to YYYY-MM-DD using local components', () => {
    const date = new Date(2026, 8, 18, 23, 30, 0); // Sep 18, 2026 at 23:30 local
    expect(formatLocalDate(date)).toBe('2026-09-18');
  });

  it('parses a YYYY-MM-DD string into a local midnight date', () => {
    const parsed = parseLocalDate('2026-09-18');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(8); // September is month index 8
    expect(parsed.getDate()).toBe(18);
    expect(parsed.getHours()).toBe(0);
  });

  it('adds and subtracts days without timezone drift', () => {
    expect(addDaysToDateString('2026-09-18', 1)).toBe('2026-09-19');
    expect(addDaysToDateString('2026-09-18', -1)).toBe('2026-09-17');
    expect(addDaysToDateString('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDaysToDateString('2026-01-01', -1)).toBe('2025-12-31');
  });

  describe('Shift & Time Range Verification', () => {
    it('accurately identifies whether a time falls within normal day shift', () => {
      expect(isTimeWithinRange('11:26', '08:00', '14:00')).toBe(true);
      expect(isTimeWithinRange('08:00', '08:00', '14:00')).toBe(true);
      expect(isTimeWithinRange('14:00', '08:00', '14:00')).toBe(true);
      expect(isTimeWithinRange('07:59', '08:00', '14:00')).toBe(false);
      expect(isTimeWithinRange('14:01', '08:00', '14:00')).toBe(false);
      expect(isTimeWithinRange('23:26', '08:00', '14:00')).toBe(false); // User example
    });

    it('accurately identifies whether a time falls within overnight shift', () => {
      expect(isTimeWithinRange('23:26', '20:00', '06:00')).toBe(true);
      expect(isTimeWithinRange('02:00', '20:00', '06:00')).toBe(true);
      expect(isTimeWithinRange('12:00', '20:00', '06:00')).toBe(false);
    });

    it('returns correct doctor duty status (on_duty, completed, upcoming, unscheduled)', () => {
      const katerinSchedule = [{ startTime: '08:00', endTime: '14:00' }];

      // At 11:26 AM on today: active
      expect(getDoctorDutyStatus(katerinSchedule, true, '11:26')).toBe('on_duty');

      // At 11:26 PM (23:26) on today: completed (not active!)
      expect(getDoctorDutyStatus(katerinSchedule, true, '23:26')).toBe('completed');

      // At 07:00 AM on today: upcoming
      expect(getDoctorDutyStatus(katerinSchedule, true, '07:00')).toBe('upcoming');

      // Without schedules: unscheduled
      expect(getDoctorDutyStatus([], true, '11:26')).toBe('unscheduled');

      // Not today: upcoming
      expect(getDoctorDutyStatus(katerinSchedule, false, '11:26')).toBe('upcoming');
    });
  });
});
