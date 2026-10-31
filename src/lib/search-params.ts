import { formatLocalDate, parseLocalDate } from '@/lib/date-utils';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reduces a Next.js `searchParams` entry to a single string value.
 * Repeated params (?q=a&q=b) keep the first one; absent values become ''.
 */
export function readSearchParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return typeof value === 'string' ? value : '';
}

/**
 * Accepts a 'YYYY-MM-DD' calendar date from the URL and falls back to today
 * when it is absent or not a real date (e.g. 2026-02-31).
 */
export function resolveDateParam(value: string | string[] | undefined): string {
  const candidate = readSearchParam(value);
  if (!ISO_DATE_PATTERN.test(candidate)) return formatLocalDate();
  const roundTrip = formatLocalDate(parseLocalDate(candidate));
  return roundTrip === candidate ? candidate : formatLocalDate();
}

/**
 * Rewrites one query parameter, dropping it when it matches the default value
 * so the URL stays clean (`/recepcion` instead of `/recepcion?date=today`).
 */
export function setSearchParam(
  search: string,
  name: string,
  value: string,
  defaultValue: string
): string {
  const params = new URLSearchParams(search);
  if (value === defaultValue) {
    params.delete(name);
  } else {
    params.set(name, value);
  }
  return params.toString();
}

export function joinUrl(pathname: string, query: string): string {
  return query ? `${pathname}?${query}` : pathname;
}
