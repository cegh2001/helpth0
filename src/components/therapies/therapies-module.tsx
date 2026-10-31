'use client';

import React, { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ImportErrorAlert } from '@/components/dashboard/import-error-alert';
import { ImportRowErrors } from '@/components/dashboard/import-row-errors';
import { notifyError, notifySuccess } from '@/components/dashboard/notify';
import { useImportFlow } from '@/components/dashboard/use-import-flow';
import { requestFile } from '@/lib/api-client';
import { resolveExportFileName } from '@/lib/export-file-name';
import { saveBlob } from '@/lib/save-blob';
import { TherapiesTable } from './therapies-table';
import type { TherapySessionItem } from './therapy-session-item';
import {
  TherapiesReviewView,
  TherapyPreviewRow,
  TherapyPreviewSummary,
} from './therapies-review-view';

interface ExportFilters {
  startDate?: string;
  endDate?: string;
  period?: string;
}

export function TherapiesModule({ therapies }: { therapies: TherapySessionItem[] }) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // The list is read on the server: refreshing means asking the route for a new
  // render, not refetching it in the browser.
  const refresh = () => {
    startTransition(() => router.refresh());
  };

  const importFlow = useImportFlow<TherapyPreviewRow, TherapyPreviewSummary>({
    endpoint: '/api/therapies/import',
    collectionKey: 'therapies',
    previewFallback: 'Error al leer el archivo',
    confirmFallback: 'Error al guardar los datos',
    describeSuccess: (result) =>
      `Importación completada: ${result.inserted} sesiones nuevas (${result.skippedDuplicates} duplicadas omitidas).`,
    onImported: refresh,
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await importFlow.preview(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = async (filters?: ExportFilters) => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.set('startDate', filters.startDate);
      if (filters?.endDate) params.set('endDate', filters.endDate);
      if (filters?.period) params.set('period', filters.period);

      const query = params.toString();
      const file = await requestFile(
        `/api/therapies/export${query ? `?${query}` : ''}`,
        'Error al generar Excel'
      );
      const fileName = resolveExportFileName(file.headers, {
        module: 'terapias',
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        extension: 'xlsx',
      });

      saveBlob(file.blob, fileName);
      notifySuccess(`Planilla Excel generada: ${filters?.period || 'Completo'}`, {
        id: 'therapies-export',
      });
    } catch (err) {
      notifyError(err, 'Error al exportar planilla', { id: 'therapies-export' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* The alert lives outside the review branch: during review there is no
          table, and that is exactly where confirm failures used to disappear. */}
      {importFlow.error && (
        <ImportErrorAlert message={importFlow.error} onDismiss={importFlow.dismissError} />
      )}

      <ImportRowErrors errors={importFlow.rowErrors} onDismiss={importFlow.dismissRowErrors} />

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
        id="therapy-file-upload"
      />

      {importFlow.isReviewMode ? (
        <TherapiesReviewView
          fileName={importFlow.selectedFile?.name || 'Planilla'}
          rows={importFlow.rows}
          summary={importFlow.summary}
          onCancel={importFlow.cancel}
          onConfirm={importFlow.confirm}
          isConfirming={importFlow.isConfirming}
        />
      ) : (
        <TherapiesTable
          therapies={therapies}
          isLoading={isRefreshing}
          onRefresh={refresh}
          onExport={handleExport}
          isExporting={isExporting}
          onTriggerUpload={() => fileInputRef.current?.click()}
          isPreviewLoading={importFlow.isPreviewLoading}
        />
      )}
    </div>
  );
}
