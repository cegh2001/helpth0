import { formatLocalDate, parseLocalDate } from '@/lib/date-utils';

/**
 * Single source of truth for downloaded report file names.
 *
 * Format: `helpth0_<module>_<anchor>.<extension>`
 *
 * The anchor is the date range covered by the export, or the generation date
 * when the export is not date scoped. Because it is ISO (`YYYY-MM-DD`), sorting
 * the Downloads folder by name groups every export of a module together and
 * orders them chronologically.
 *
 * Browsers never let a page choose a folder: they keep only the file name and
 * drop any path separator. This naming scheme is the portable way to keep files
 * organized, and it works on every browser.
 */
export const EXPORT_FILE_PREFIX = 'helpth0';

export type ExportModuleName = 'terapias' | 'consultas' | 'examenes' | 'reporte';

export type ExportFileExtension = 'xlsx' | 'pdf';

export interface ExportFileNameParams {
  module: ExportModuleName;
  startDate?: string;
  endDate?: string;
  extension: ExportFileExtension;
  /** Injectable clock so the generated date is deterministic in tests. */
  now?: Date;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const CONTENT_DISPOSITION_FILENAME = /filename="([^"]+)"/;

function isIsoDate(value: string | undefined): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  // Round trip rejects impossible calendar dates such as 2026-13-01 or 2026-02-30
  // and anything that would smuggle characters into the Content-Disposition header.
  return formatLocalDate(parseLocalDate(value)) === value;
}

function resolveAnchor(start: string | undefined, end: string | undefined, now: Date): string {
  if (start && end) {
    return start === end ? start : `${start}_a_${end}`;
  }
  return start ?? end ?? formatLocalDate(now);
}

export function buildExportFileName({
  module,
  startDate,
  endDate,
  extension,
  now = new Date(),
}: ExportFileNameParams): string {
  const start = isIsoDate(startDate) ? startDate : undefined;
  const end = isIsoDate(endDate) ? endDate : undefined;
  const anchor = resolveAnchor(start, end, now);
  return `${EXPORT_FILE_PREFIX}_${module}_${anchor}.${extension}`;
}

export function readContentDispositionFileName(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;
  const match = CONTENT_DISPOSITION_FILENAME.exec(contentDisposition);
  return match?.[1] ?? null;
}

interface ResponseHeaders {
  get(name: string): string | null;
}

/**
 * The server owns the file name; the client reuses it so the name can never
 * drift between the HTTP header and the blob download.
 */
export function resolveExportFileName(
  headers: ResponseHeaders,
  params: ExportFileNameParams
): string {
  return (
    readContentDispositionFileName(headers.get('content-disposition')) ??
    buildExportFileName(params)
  );
}
