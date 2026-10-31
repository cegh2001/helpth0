import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/class-names';
import { buildPageRange, pageRowRange } from './pagination-range';

interface Props {
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Plural noun rendered in the summary, e.g. "consultas". */
  itemLabel?: string;
  className?: string;
}

const NAV_BUTTON =
  'inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-2 text-xs font-medium transition disabled:pointer-events-none disabled:opacity-40 cursor-pointer';

export function DataPagination({
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'registros',
  className,
}: Props) {
  const { firstRow, lastRow } = pageRowRange(page, pageSize, totalItems);
  const slots = buildPageRange(page, pageCount);

  return (
    <div
      className={cn(
        'flex flex-col gap-2 border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <p className="text-slate-500">
        Mostrando <span className="font-semibold text-slate-700">{firstRow}</span> a{' '}
        <span className="font-semibold text-slate-700">{lastRow}</span> de{' '}
        <span className="font-semibold text-slate-700">{totalItems}</span> {itemLabel}
      </p>

      {pageCount > 1 && (
        <nav aria-label="Paginación" className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
            className={cn(NAV_BUTTON, 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100')}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {slots.map((slot) =>
            typeof slot === 'number' ? (
              <button
                key={slot}
                type="button"
                onClick={() => onPageChange(slot)}
                aria-label={`Página ${slot}`}
                aria-current={slot === page ? 'page' : undefined}
                className={cn(
                  NAV_BUTTON,
                  slot === page
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                )}
              >
                {slot}
              </button>
            ) : (
              <span
                key={slot}
                aria-hidden="true"
                className="inline-flex h-7 min-w-7 items-center justify-center px-1 text-slate-400"
              >
                &hellip;
              </span>
            )
          )}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            aria-label="Página siguiente"
            className={cn(NAV_BUTTON, 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100')}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </nav>
      )}
    </div>
  );
}
