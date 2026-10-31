'use client';

import { useCallback, useState } from 'react';
import { requestJson } from '@/lib/api-client';
import {
  describeErrorText,
  notifyError,
  notifySuccess,
  notifyWarning,
} from '@/components/dashboard/notify';

export interface ImportRowError {
  rowNumber: number;
  message: string;
}

export interface ImportResult {
  inserted: number;
  skippedDuplicates: number;
  rowErrors: ImportRowError[];
}

interface UseImportFlowOptions {
  /** Import endpoint without the `action` query, e.g. `/api/exams/import`. */
  endpoint: string;
  /** Payload key for the rows: `consultations`, `exams` or `therapies`. */
  collectionKey: string;
  previewFallback: string;
  confirmFallback: string;
  describeSuccess: (result: ImportResult) => string;
  onImported: () => void;
}

type JsonPayload = Record<string, unknown>;

function toRowErrors(payload: JsonPayload): ImportRowError[] {
  if (!Array.isArray(payload.errors)) return [];

  return payload.errors.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null) return [];
    const candidate = entry as { rowNumber?: unknown; message?: unknown };
    return [
      {
        rowNumber: typeof candidate.rowNumber === 'number' ? candidate.rowNumber : 0,
        message: typeof candidate.message === 'string' ? candidate.message : 'Fila no válida',
      },
    ];
  });
}

function toImportResult(payload: JsonPayload): ImportResult {
  return {
    inserted: typeof payload.inserted === 'number' ? payload.inserted : 0,
    skippedDuplicates:
      typeof payload.skippedDuplicates === 'number' ? payload.skippedDuplicates : 0,
    rowErrors: toRowErrors(payload),
  };
}

function fileRequest(file: File | null): RequestInit {
  if (!file) throw new Error('Volvé a seleccionar el archivo para importar.');
  const formData = new FormData();
  formData.append('file', file);
  return { method: 'POST', body: formData };
}

function rowsRequest(collectionKey: string, rows: unknown[]): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [collectionKey]: rows }),
  };
}

function pluralizeRows(count: number): string {
  return count === 1 ? '1 fila no se pudo procesar' : `${count} filas no se pudieron procesar`;
}

/**
 * Owns the whole import lifecycle: file, preview, editable review and confirm.
 *
 * The three modules (consultations, exams, therapies) share this flow, so it
 * lives here instead of being copied three times. Every failure sets `error`
 * (rendered inline, next to the action) AND raises a toast, because the inline
 * slot is invisible when the user is scrolled to the bottom of a long review
 * table. The previous code kept the message in a branch that was unmounted
 * during review, which is why failures only ever reached the console.
 */
export function useImportFlow<TRow, TSummary>({
  endpoint,
  collectionKey,
  previewFallback,
  confirmFallback,
  describeSuccess,
  onImported,
}: UseImportFlowOptions) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [rows, setRows] = useState<TRow[]>([]);
  const [summary, setSummary] = useState<TSummary | null>(null);
  const [rowErrors, setRowErrors] = useState<ImportRowError[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const dismissError = useCallback(() => setError(null), []);
  const dismissRowErrors = useCallback(() => setRowErrors([]), []);

  const preview = useCallback(
    async (file: File) => {
      setSelectedFile(file);
      setIsPreviewLoading(true);
      setError(null);
      setRowErrors([]);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const payload = await requestJson<JsonPayload>(
          `${endpoint}?action=preview`,
          { method: 'POST', body: formData },
          previewFallback
        );

        const parsedRows = Array.isArray(payload[collectionKey])
          ? (payload[collectionKey] as TRow[])
          : [];
        const parseIssues = toRowErrors(payload);

        setRows(parsedRows);
        setSummary((payload.summary as TSummary | undefined) ?? null);
        setRowErrors(parseIssues);
        setIsReviewMode(true);

        if (parseIssues.length > 0) {
          notifyWarning(pluralizeRows(parseIssues.length), {
            id: 'import-preview-issues',
            description: 'Revisá el detalle antes de confirmar la importación.',
          });
        }
      } catch (err) {
        setSelectedFile(null);
        setError(describeErrorText(err, previewFallback));
        notifyError(err, previewFallback, { id: 'import-preview' });
      } finally {
        setIsPreviewLoading(false);
      }
    },
    [collectionKey, endpoint, previewFallback]
  );

  const confirm = useCallback(
    async (editedRows?: TRow[]) => {
      setIsConfirming(true);
      setError(null);

      try {
        const request =
          editedRows && editedRows.length > 0
            ? rowsRequest(collectionKey, editedRows)
            : fileRequest(selectedFile);

        const payload = await requestJson<JsonPayload>(
          `${endpoint}?action=confirm`,
          request,
          confirmFallback
        );
        const result = toImportResult(payload);

        setRowErrors(result.rowErrors);
        setIsReviewMode(false);
        setSelectedFile(null);
        setRows([]);
        setSummary(null);

        notifySuccess(describeSuccess(result), {
          id: 'import-confirm',
          description:
            result.rowErrors.length > 0
              ? `${pluralizeRows(result.rowErrors.length)}. Revisá el detalle en pantalla.`
              : undefined,
        });
        onImported();
      } catch (err) {
        setError(describeErrorText(err, confirmFallback));
        notifyError(err, confirmFallback, { id: 'import-confirm' });
      } finally {
        setIsConfirming(false);
      }
    },
    [collectionKey, confirmFallback, describeSuccess, endpoint, onImported, selectedFile]
  );

  const cancel = useCallback(() => {
    setIsReviewMode(false);
    setSelectedFile(null);
    setRows([]);
    setSummary(null);
    setRowErrors([]);
    setError(null);
  }, []);

  return {
    selectedFile,
    rows,
    summary,
    rowErrors,
    error,
    isReviewMode,
    isPreviewLoading,
    isConfirming,
    preview,
    confirm,
    cancel,
    dismissError,
    dismissRowErrors,
  };
}
