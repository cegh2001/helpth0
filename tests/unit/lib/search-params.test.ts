import { describe, expect, it } from 'vitest';
import { formatLocalDate } from '@/lib/date-utils';
import {
  joinUrl,
  readSearchParam,
  resolveDateParam,
  setSearchParam,
} from '@/lib/search-params';

describe('readSearchParam', () => {
  it('returns the single string value', () => {
    expect(readSearchParam('gomez')).toBe('gomez');
  });

  it('keeps the first value when the parameter repeats', () => {
    expect(readSearchParam(['gomez', 'perez'])).toBe('gomez');
  });

  it('returns an empty string when the parameter is absent', () => {
    expect(readSearchParam(undefined)).toBe('');
    expect(readSearchParam([])).toBe('');
  });
});

describe('resolveDateParam', () => {
  it('keeps a real calendar date', () => {
    expect(resolveDateParam('2026-10-30')).toBe('2026-10-30');
  });

  it('falls back to today for a malformed value', () => {
    expect(resolveDateParam('30/10/2026')).toBe(formatLocalDate());
    expect(resolveDateParam('2026-1-5')).toBe(formatLocalDate());
  });

  it('falls back to today for a date that does not exist', () => {
    expect(resolveDateParam('2026-02-31')).toBe(formatLocalDate());
    expect(resolveDateParam('2026-13-01')).toBe(formatLocalDate());
  });

  it('resolves the date even when the parameter repeats', () => {
    expect(resolveDateParam(['2026-10-30', '2026-11-01'])).toBe('2026-10-30');
  });
});

describe('setSearchParam', () => {
  it('writes the value into the query string', () => {
    expect(setSearchParam('', 'q', 'gomez', '')).toBe('q=gomez');
  });

  it('drops the parameter when it matches the default value', () => {
    expect(setSearchParam('q=gomez', 'q', '', '')).toBe('');
    expect(setSearchParam('date=2026-10-30', 'date', '2026-10-31', '2026-10-31')).toBe('');
  });

  it('preserves the sibling parameters', () => {
    expect(setSearchParam('date=2026-10-30', 'q', 'gomez', '')).toBe(
      'date=2026-10-30&q=gomez'
    );
  });

  it('replaces an existing value instead of appending a duplicate', () => {
    expect(setSearchParam('q=perez', 'q', 'gomez', '')).toBe('q=gomez');
  });
});

describe('joinUrl', () => {
  it('appends the query to the pathname', () => {
    expect(joinUrl('/recepcion', 'date=2026-10-30')).toBe('/recepcion?date=2026-10-30');
  });

  it('keeps the bare pathname when there is nothing to append', () => {
    expect(joinUrl('/recepcion', '')).toBe('/recepcion');
  });
});
