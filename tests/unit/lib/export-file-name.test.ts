import { describe, it, expect } from 'vitest';
import {
  buildExportFileName,
  readContentDispositionFileName,
  resolveExportFileName,
} from '@/lib/export-file-name';

/** Oct 31 2026, 15:00 local time: a deterministic clock for every assertion. */
const NOW = new Date(2026, 9, 31, 15, 0, 0);

describe('buildExportFileName', () => {
  it('builds prefix, module and ISO date range', () => {
    expect(
      buildExportFileName({
        module: 'terapias',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        extension: 'xlsx',
        now: NOW,
      })
    ).toBe('helpth0_terapias_2026-10-01_a_2026-10-31.xlsx');
  });

  it('collapses a single-day range into one date', () => {
    expect(
      buildExportFileName({
        module: 'reporte',
        startDate: '2026-10-31',
        endDate: '2026-10-31',
        extension: 'pdf',
        now: NOW,
      })
    ).toBe('helpth0_reporte_2026-10-31.pdf');
  });

  it('falls back to the generation date when the export is not date scoped', () => {
    expect(buildExportFileName({ module: 'terapias', extension: 'xlsx', now: NOW })).toBe(
      'helpth0_terapias_2026-10-31.xlsx'
    );
  });

  it('accepts a one-sided range', () => {
    expect(
      buildExportFileName({ module: 'consultas', startDate: '2026-10-01', extension: 'xlsx', now: NOW })
    ).toBe('helpth0_consultas_2026-10-01.xlsx');

    expect(
      buildExportFileName({ module: 'consultas', endDate: '2026-10-31', extension: 'xlsx', now: NOW })
    ).toBe('helpth0_consultas_2026-10-31.xlsx');
  });

  it('ignores non-ISO, impossible and header-injecting dates', () => {
    const rejected = [
      '31/10/2026',
      '2026-13-01',
      '2026-02-30',
      '2026-10-01"\r\nX-Injected: 1',
      '../../etc/passwd',
      'octubre',
      '',
    ];

    for (const startDate of rejected) {
      expect(
        buildExportFileName({ module: 'terapias', startDate, extension: 'xlsx', now: NOW }),
        `startDate ${JSON.stringify(startDate)} must not reach the file name`
      ).toBe('helpth0_terapias_2026-10-31.xlsx');
    }
  });

  it('keeps exports grouped by module and ordered chronologically when sorted by name', () => {
    const generated = [
      buildExportFileName({
        module: 'terapias',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        extension: 'xlsx',
        now: NOW,
      }),
      buildExportFileName({
        module: 'terapias',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        extension: 'xlsx',
        now: NOW,
      }),
      buildExportFileName({
        module: 'consultas',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        extension: 'xlsx',
        now: NOW,
      }),
    ];

    expect(generated.sort()).toStrictEqual([
      'helpth0_consultas_2026-10-01_a_2026-10-31.xlsx',
      'helpth0_terapias_2026-10-01_a_2026-10-31.xlsx',
      'helpth0_terapias_2026-11-01_a_2026-11-30.xlsx',
    ]);
  });
});

describe('readContentDispositionFileName', () => {
  it('extracts the quoted file name', () => {
    expect(
      readContentDispositionFileName('attachment; filename="helpth0_reporte_2026-10-31.pdf"')
    ).toBe('helpth0_reporte_2026-10-31.pdf');
  });

  it('returns null when there is nothing to extract', () => {
    expect(readContentDispositionFileName(null)).toBeNull();
    expect(readContentDispositionFileName('attachment')).toBeNull();
    expect(readContentDispositionFileName('attachment; filename=sin-comillas.xlsx')).toBeNull();
  });
});

describe('resolveExportFileName', () => {
  const params = {
    module: 'terapias',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    extension: 'xlsx',
    now: NOW,
  } as const;

  it('prefers the server header so header and blob downloads never disagree', () => {
    const headers = new Headers({
      'content-disposition': 'attachment; filename="helpth0_terapias_2026-10-01_a_2026-10-31.xlsx"',
    });

    expect(resolveExportFileName(headers, { ...params, startDate: '2026-09-01' })).toBe(
      'helpth0_terapias_2026-10-01_a_2026-10-31.xlsx'
    );
  });

  it('rebuilds the name when the header is absent', () => {
    expect(resolveExportFileName(new Headers(), params)).toBe(
      'helpth0_terapias_2026-10-01_a_2026-10-31.xlsx'
    );
  });
});
