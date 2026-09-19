import { describe, it, expect } from 'vitest';
import {
  formatLocalDate,
  parseLocalDate,
  addDaysToDateString,
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
});
