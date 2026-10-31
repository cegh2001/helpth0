import { describe, expect, it } from 'vitest';
import {
  buildPageRange,
  clampPage,
  pageRowRange,
} from '@/components/ui/pagination-range';

describe('clampPage', () => {
  it('keeps a page inside the available window', () => {
    expect(clampPage(3, 5)).toBe(3);
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(-4, 5)).toBe(1);
    expect(clampPage(9, 5)).toBe(5);
  });

  it('falls back to page 1 when there is nothing to paginate', () => {
    expect(clampPage(4, 0)).toBe(1);
  });
});

describe('pageRowRange', () => {
  it('reports the visible 1-based rows of a middle page', () => {
    expect(pageRowRange(3, 50, 320)).toStrictEqual({ firstRow: 101, lastRow: 150 });
  });

  it('cuts the last page at the total row count', () => {
    expect(pageRowRange(7, 50, 320)).toStrictEqual({ firstRow: 301, lastRow: 320 });
  });

  it('reports zero rows for an empty result set', () => {
    expect(pageRowRange(1, 50, 0)).toStrictEqual({ firstRow: 0, lastRow: 0 });
  });

  it('clamps an out-of-range page instead of reporting impossible rows', () => {
    expect(pageRowRange(99, 50, 80)).toStrictEqual({ firstRow: 51, lastRow: 80 });
  });
});

describe('buildPageRange', () => {
  it('lists every page when the whole range fits', () => {
    expect(buildPageRange(1, 7)).toStrictEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(buildPageRange(5, 7)).toStrictEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('collapses both gaps around a middle page', () => {
    expect(buildPageRange(10, 20)).toStrictEqual([1, 'start-gap', 9, 10, 11, 'end-gap', 20]);
  });

  it('drops the start gap on the first page and the end gap on the last one', () => {
    expect(buildPageRange(1, 20)).toStrictEqual([1, 2, 'end-gap', 20]);
    expect(buildPageRange(20, 20)).toStrictEqual([1, 'start-gap', 19, 20]);
  });

  it('keeps the active page visible and never exceeds the slot budget', () => {
    for (const page of [1, 2, 3, 10, 18, 19, 20]) {
      const slots = buildPageRange(page, 20);
      expect(slots).toContain(page);
      expect(slots.length).toBeLessThanOrEqual(7);
    }
  });

  it('clamps the requested page before building the range', () => {
    expect(buildPageRange(99, 20)).toStrictEqual([1, 'start-gap', 19, 20]);
  });

  it('returns nothing when there are no pages', () => {
    expect(buildPageRange(1, 0)).toStrictEqual([]);
  });
});
