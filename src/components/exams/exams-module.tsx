'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { resolveExportFileName } from '@/lib/export-file-name';
import { ExamsTable, MedicalExamItem } from './exams-table';
import {
  ExamsReviewView,
  ExamPreviewRow,
  ExamPreviewSummary,
} from './exams-review-view';

export function ExamsModule() {
  const [exams, setExams] = useState<MedicalExamItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [previewRows, setPreviewRows] = useState<ExamPreviewRow[]>([]);
  const [previewSummary, setPreviewSummary] = useState<ExamPreviewSummary | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = useCallback((type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  }, []);

  const fetchExams = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/exams');
      const data = await res.json();
      if (data.success) {
        setExams(data.data);
      } else {
        showFeedback('error', data.error || 'Error al obtener exámenes');
      }
    } catch {
      showFeedback('error', 'Error de red al consultar exámenes');
    } finally {
      setIsLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      try {
        const res = await fetch('/api/exams');
        const data = await res.json();
        if (ignore) return;
        if (data.success) {
          setExams(data.data);
        } else {
          showFeedback('error', data.error || 'Error al obtener exámenes');
        }
      } catch {
        if (!ignore) showFeedback('error', 'Error de red al consultar exámenes');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadInitial();
    return () => {
      ignore = true;
    };
  }, [showFeedback]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFileForPreview(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFileForPreview = async (file: File) => {
    setSelectedFile(file);
    setIsPreviewLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/exams/import?action=preview', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al procesar archivo');
      }

      setPreviewRows(data.exams || []);
      setPreviewSummary(data.summary || null);
      setIsReviewMode(true);
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'Error al leer el archivo');
      setSelectedFile(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleConfirmImport = async (editedRows?: ExamPreviewRow[]) => {
    if (!selectedFile && (!editedRows || editedRows.length === 0)) return;
    setIsConfirming(true);

    try {
      const res = editedRows && editedRows.length > 0
        ? await fetch('/api/exams/import?action=confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exams: editedRows }),
          })
        : await fetch('/api/exams/import?action=confirm', {
            method: 'POST',
            body: (() => {
              const fd = new FormData();
              if (selectedFile) fd.append('file', selectedFile);
              return fd;
            })(),
          });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al importar exámenes');
      }

      showFeedback(
        'success',
        `Importación completada: ${data.inserted} nuevos exámenes ingresados (${data.skippedDuplicates} duplicados omitidos).`
      );
      setIsReviewMode(false);
      setSelectedFile(null);
      fetchExams();
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'Error al guardar los datos');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleExport = async (filters?: { startDate?: string; endDate?: string; period?: string }) => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.set('startDate', filters.startDate);
      if (filters?.endDate) params.set('endDate', filters.endDate);
      if (filters?.period) params.set('period', filters.period);

      const qs = params.toString();
      const res = await fetch(`/api/exams/export${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('Error al generar Excel');
      const fileName = resolveExportFileName(res.headers, {
        module: 'examenes',
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        extension: 'xlsx',
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showFeedback('success', `Planilla Excel generada: ${filters?.period || 'Completo'}`);
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'Error al exportar planilla');
    } finally {
      setIsExporting(false);
    }
  };

  if (isReviewMode) {
    return (
      <ExamsReviewView
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
        id="exam-file-upload"
      />

      <ExamsTable
        exams={exams}
        isLoading={isLoading}
        onRefresh={fetchExams}
        onExport={handleExport}
        isExporting={isExporting}
        onTriggerUpload={() => fileInputRef.current?.click()}
        isPreviewLoading={isPreviewLoading}
      />
    </div>
  );
}
