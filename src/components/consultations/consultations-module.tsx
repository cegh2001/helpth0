'use client';

import React, { useCallback, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FeedbackBanner } from '@/components/dashboard/feedback-banner';
import { ImportRowErrors } from '@/components/dashboard/import-row-errors';
import { notifyError, notifySuccess } from '@/components/dashboard/notify';
import { useImportFlow } from '@/components/dashboard/use-import-flow';
import { requestFile } from '@/lib/api-client';
import { resolveExportFileName } from '@/lib/export-file-name';
import { saveBlob } from '@/lib/save-blob';
import { ConsultationsTable } from './consultations-table';
import type { ConsultationItem } from './consultation-item';
import {
  ConsultationsReviewView,
  PreviewRow,
  PreviewSummary,
} from './consultations-review-view';

interface ExportFilters {
  startDate?: string;
  endDate?: string;
  period?: string;
}

export function ConsultationsModule({ consultations }: { consultations: ConsultationItem[] }) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // The list is read on the server: refreshing means asking the route for a new
  // render, not refetching it in the browser.
  const refreshConsultations = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  const importFlow = useImportFlow<PreviewRow, PreviewSummary>({
    endpoint: '/api/consultations/import',
    collectionKey: 'consultations',
    previewFallback: 'Error al leer el archivo',
    confirmFallback: 'Error al guardar los datos',
    describeSuccess: (result) =>
      `Importación completada: ${result.inserted} nuevas consultas (${result.skippedDuplicates} duplicadas omitidas).`,
    onImported: refreshConsultations,
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
        `/api/consultations/export${query ? `?${query}` : ''}`,
        'Error al generar Excel'
      );
      const fileName = resolveExportFileName(file.headers, {
        module: 'consultas',
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        extension: 'xlsx',
      });

      saveBlob(file.blob, fileName);
      notifySuccess(`Planilla Excel generada: ${filters?.period || 'Completo'}`, {
        id: 'consultations-export',
      });
    } catch (err) {
      notifyError(err, 'Error al exportar planilla', { id: 'consultations-export' });
    } finally {
      setIsExporting(false);
    }
  };

  const dismissAlert = () => {
    importFlow.dismissError();
  };
  const alert = importFlow.error;

  return (
    <div className="space-y-6">
      {/* The alert lives outside the review branch: during review there is no
          table, and that is exactly where confirm failures used to disappear. */}
      {alert && <FeedbackBanner message={{ type: 'error', text: alert }} onDismiss={dismissAlert} />}

      <ImportRowErrors errors={importFlow.rowErrors} onDismiss={importFlow.dismissRowErrors} />

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
        id="excel-file-upload"
      />

      {importFlow.isReviewMode ? (
        <ConsultationsReviewView
          fileName={importFlow.selectedFile?.name || 'Planilla'}
          rows={importFlow.rows}
          summary={importFlow.summary}
          onCancel={importFlow.cancel}
          onConfirm={importFlow.confirm}
          isConfirming={importFlow.isConfirming}
        />
      ) : (
        <ConsultationsTable
          consultations={consultations}
          isLoading={isRefreshing}
          onRefresh={refreshConsultations}
          onExport={handleExport}
          isExporting={isExporting}
          onTriggerUpload={() => fileInputRef.current?.click()}
          isPreviewLoading={importFlow.isPreviewLoading}
        />
      )}
    </div>
  );
}
