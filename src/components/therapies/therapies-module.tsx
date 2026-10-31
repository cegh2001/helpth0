'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { TherapiesTable, TherapySessionItem } from './therapies-table';
import { TherapiesReviewView, TherapyPreviewRow, TherapyPreviewSummary } from './therapies-review-view';

export function TherapiesModule() {
  const [therapies, setTherapies] = useState<TherapySessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [previewRows, setPreviewRows] = useState<TherapyPreviewRow[]>([]);
  const [previewSummary, setPreviewSummary] = useState<TherapyPreviewSummary | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = useCallback((type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 6000);
  }, []);

  const fetchTherapies = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/therapies');
      const data = await res.json();
      if (data.success) {
        setTherapies(data.data);
      } else {
        showFeedback('error', data.error || 'Error al obtener terapias');
      }
    } catch {
      showFeedback('error', 'Error de red al consultar terapias');
    } finally {
      setIsLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    let ignore = false;

    async function loadInitial() {
      try {
        const res = await fetch('/api/therapies');
        const data = await res.json();
        if (ignore) return;
        if (data.success) {
          setTherapies(data.data);
        } else {
          showFeedback('error', data.error || 'Error al obtener terapias');
        }
      } catch {
        if (!ignore) showFeedback('error', 'Error de red al consultar terapias');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadInitial();
    return () => {
      ignore = true;
    };
  }, [showFeedback]);

  const processFileForPreview = async (file: File) => {
    setSelectedFile(file);
    setIsPreviewLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/therapies/import?action=preview', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al procesar archivo');
      }

      setPreviewRows(data.therapies || []);
      setPreviewSummary(data.summary || null);
      setIsReviewMode(true);
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'Error al leer el archivo');
      setSelectedFile(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFileForPreview(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async (editedRows?: TherapyPreviewRow[]) => {
    if (!selectedFile && (!editedRows || editedRows.length === 0)) return;
    setIsConfirming(true);

    try {
      const res =
        editedRows && editedRows.length > 0
          ? await fetch('/api/therapies/import?action=confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ therapies: editedRows }),
            })
          : await fetch('/api/therapies/import?action=confirm', {
              method: 'POST',
              body: (() => {
                const formData = new FormData();
                if (selectedFile) formData.append('file', selectedFile);
                return formData;
              })(),
            });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al importar terapias');
      }

      showFeedback(
        'success',
        `Importación completada: ${data.inserted} sesiones nuevas (${data.skippedDuplicates} duplicadas omitidas).`
      );
      setIsReviewMode(false);
      setSelectedFile(null);
      fetchTherapies();
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'Error al guardar los datos');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleExport = async (filters?: {
    startDate?: string;
    endDate?: string;
    period?: string;
  }) => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.set('startDate', filters.startDate);
      if (filters?.endDate) params.set('endDate', filters.endDate);
      if (filters?.period) params.set('period', filters.period);

      const queryString = params.toString();
      const res = await fetch(`/api/therapies/export${queryString ? `?${queryString}` : ''}`);
      if (!res.ok) throw new Error('Error al generar Excel');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const slug = (filters?.period || 'terapias')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      anchor.download = `Terapias_${slug}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
      showFeedback('success', `Planilla Excel generada: ${filters?.period || 'Completo'}`);
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'Error al exportar planilla');
    } finally {
      setIsExporting(false);
    }
  };

  if (isReviewMode) {
    return (
      <TherapiesReviewView
        fileName={selectedFile?.name || 'Planilla'}
        rows={previewRows}
        summary={previewSummary}
        onCancel={() => setIsReviewMode(false)}
        onConfirm={handleConfirmImport}
        isConfirming={isConfirming}
      />
    );
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-xl flex items-center space-x-3 text-xs font-medium transition ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
        id="therapy-file-upload"
      />

      <TherapiesTable
        therapies={therapies}
        isLoading={isLoading}
        onRefresh={fetchTherapies}
        onExport={handleExport}
        isExporting={isExporting}
        onTriggerUpload={() => fileInputRef.current?.click()}
        isPreviewLoading={isPreviewLoading}
      />
    </div>
  );
}
