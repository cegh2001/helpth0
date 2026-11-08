import { describe, expect, it } from 'vitest';
import {
  buildDatePresets,
  getLatestDate,
  MONTH_NAMES,
  MONTH_SHORT_NAMES,
  resolveMonthWindow,
} from '@/lib/date-window';

describe('date-window', () => {
  describe('resolveMonthWindow', () => {
    it('resolves month window accurately for October 2026 (31 days)', () => {
      const window = resolveMonthWindow('2026-10-15');

      expect(window.year).toBe(2026);
      expect(window.month).toBe(10);
      expect(window.monthName).toBe('Octubre');
      expect(window.monthShort).toBe('Oct');
      expect(window.label).toBe('Octubre 2026');
      expect(window.periodTitle).toBe('OCTUBRE 2026');
      expect(window.start).toBe('2026-10-01');
      expect(window.end).toBe('2026-10-31');
      expect(window.lastDay).toBe(31);
    });

    it('resolves February in a leap year (2024 has 29 days)', () => {
      const window = resolveMonthWindow('2024-02-10');

      expect(window.year).toBe(2024);
      expect(window.month).toBe(2);
      expect(window.monthName).toBe('Febrero');
      expect(window.start).toBe('2024-02-01');
      expect(window.end).toBe('2024-02-29');
      expect(window.lastDay).toBe(29);
    });

    it('resolves February in a non-leap year (2025 has 28 days)', () => {
      const window = resolveMonthWindow('2025-02-01');

      expect(window.year).toBe(2025);
      expect(window.month).toBe(2);
      expect(window.start).toBe('2025-02-01');
      expect(window.end).toBe('2025-02-28');
      expect(window.lastDay).toBe(28);
    });

    it('resolves 30-day month (Noviembre 2026)', () => {
      const window = resolveMonthWindow('2026-11-20');

      expect(window.year).toBe(2026);
      expect(window.month).toBe(11);
      expect(window.monthName).toBe('Noviembre');
      expect(window.monthShort).toBe('Nov');
      expect(window.start).toBe('2026-11-01');
      expect(window.end).toBe('2026-11-30');
      expect(window.lastDay).toBe(30);
    });

    it('falls back to current system date when reference date is undefined or malformed', () => {
      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const currentMonth = now.getUTCMonth() + 1;

      const fromUndefined = resolveMonthWindow(undefined);
      expect(fromUndefined.year).toBe(currentYear);
      expect(fromUndefined.month).toBe(currentMonth);

      const fromInvalid = resolveMonthWindow('invalid-date');
      expect(fromInvalid.year).toBe(currentYear);
      expect(fromInvalid.month).toBe(currentMonth);
    });
  });

  describe('buildDatePresets', () => {
    it('builds coherent presets for a given reference date', () => {
      const { window, presets, getPreset } = buildDatePresets('2026-11-05');

      expect(window.label).toBe('Noviembre 2026');
      expect(presets).toHaveLength(6);

      const monthPreset = getPreset('month');
      expect(monthPreset).toStrictEqual({
        id: 'month',
        buttonLabel: 'Mes Completo (Nov 2026)',
        tableLabel: 'Mes Completo (Noviembre 2026)',
        periodTitle: 'NOVIEMBRE 2026',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
      });

      const sem1 = getPreset('sem1');
      expect(sem1).toStrictEqual({
        id: 'sem1',
        buttonLabel: 'Sem. 1 (1-7)',
        tableLabel: 'Semana 1 (1-7 Nov)',
        periodTitle: 'SEMANA 1 NOVIEMBRE 2026',
        startDate: '2026-11-01',
        endDate: '2026-11-07',
      });

      const sem2 = getPreset('sem2');
      expect(sem2).toStrictEqual({
        id: 'sem2',
        buttonLabel: 'Sem. 2 (8-14)',
        tableLabel: 'Semana 2 (8-14 Nov)',
        periodTitle: 'SEMANA 2 NOVIEMBRE 2026',
        startDate: '2026-11-08',
        endDate: '2026-11-14',
      });

      const sem3 = getPreset('sem3');
      expect(sem3).toStrictEqual({
        id: 'sem3',
        buttonLabel: 'Sem. 3 (15-21)',
        tableLabel: 'Semana 3 (15-21 Nov)',
        periodTitle: 'SEMANA 3 NOVIEMBRE 2026',
        startDate: '2026-11-15',
        endDate: '2026-11-21',
      });

      const sem4 = getPreset('sem4');
      expect(sem4).toStrictEqual({
        id: 'sem4',
        buttonLabel: 'Sem. 4 (22+)',
        tableLabel: 'Semana 4 (22+ Nov)',
        periodTitle: 'SEMANA 4 NOVIEMBRE 2026',
        startDate: '2026-11-22',
        endDate: '2026-11-30',
      });

      const all = getPreset('all');
      expect(all).toStrictEqual({
        id: 'all',
        buttonLabel: 'Todo',
        tableLabel: 'Todo el Histórico',
        periodTitle: 'HISTÓRICO COMPLETO',
        startDate: '',
        endDate: '',
      });
    });
  });

  describe('getLatestDate', () => {
    it('returns undefined for empty array', () => {
      expect(getLatestDate([])).toBe(undefined);
    });

    it('returns the maximum date from an unordered list of objects', () => {
      const records = [
        { date: '2026-10-05' },
        { date: '2026-11-12' },
        { date: '2026-10-31' },
        { date: '2026-09-15' },
      ];

      expect(getLatestDate(records)).toBe('2026-11-12');
    });

    it('handles raw strings, nulls and malformed date values gracefully', () => {
      const mixed = [
        null,
        undefined,
        '2026-08-01',
        { date: 'not-a-date' },
        '2026-12-25',
        { date: '2026-05-10' },
      ];

      expect(getLatestDate(mixed)).toBe('2026-12-25');
    });
  });

  describe('month constants', () => {
    it('has exactly 12 months with matching short labels', () => {
      expect(MONTH_NAMES).toHaveLength(12);
      expect(MONTH_SHORT_NAMES).toHaveLength(12);
      expect(MONTH_NAMES[0]).toBe('Enero');
      expect(MONTH_SHORT_NAMES[0]).toBe('Ene');
      expect(MONTH_NAMES[11]).toBe('Diciembre');
      expect(MONTH_SHORT_NAMES[11]).toBe('Dic');
    });
  });
});
