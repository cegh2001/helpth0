export type PageSlot = number | 'start-gap' | 'end-gap';

/** Rows per page shared by every data table so the modules paginate identically. */
export const DEFAULT_PAGE_SIZE = 50;

/** Keeps a page number inside the valid window after the filtered list shrinks. */
export function clampPage(page: number, pageCount: number): number {
  if (pageCount <= 0) return 1;
  return Math.min(Math.max(page, 1), pageCount);
}

/**
 * First and last 1-based row numbers shown on the current page, so the footer
 * can render "Mostrando 51 a 100 de 320 registros" without recomputing slices.
 */
export function pageRowRange(
  page: number,
  pageSize: number,
  totalItems: number
): { firstRow: number; lastRow: number } {
  if (totalItems <= 0) return { firstRow: 0, lastRow: 0 };

  const safePage = clampPage(page, Math.ceil(totalItems / pageSize));
  const firstRow = (safePage - 1) * pageSize + 1;

  return { firstRow, lastRow: Math.min(safePage * pageSize, totalItems) };
}

/**
 * Laravel-style page slots: first, last, current page with its siblings and
 * gaps collapsed into ellipses. Never renders more than `siblings * 2 + 5`.
 */
export function buildPageRange(currentPage: number, pageCount: number, siblings = 1): PageSlot[] {
  if (pageCount <= 0) return [];

  const maxSlots = siblings * 2 + 5;
  if (pageCount <= maxSlots) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const page = clampPage(currentPage, pageCount);
  const firstSibling = Math.max(page - siblings, 1);
  const lastSibling = Math.min(page + siblings, pageCount);

  const slots: PageSlot[] = [1];
  if (firstSibling > 2) slots.push('start-gap');

  const from = Math.max(firstSibling, 2);
  const to = Math.min(lastSibling, pageCount - 1);
  for (let candidate = from; candidate <= to; candidate += 1) slots.push(candidate);

  if (lastSibling < pageCount - 1) slots.push('end-gap');
  slots.push(pageCount);

  return slots;
}
