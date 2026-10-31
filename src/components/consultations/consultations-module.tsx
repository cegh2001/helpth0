'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { ConsultationsTable, ConsultationItem } from './consultations-table';
import {
  ConsultationsReviewView,
  PreviewRow,
  PreviewSummary,
} from './consultations-review-view';

export function ConsultationsModule() {
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [previewSummary, setPreviewSummary] = useState<PreviewSummary | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = useCallback((type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  }, []);

  const fetchConsultations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/consultations');
      const data = await res.json();
      if (data.success) {
        setConsultations(data.data);
      } else {
        showFeedback('error', data.error || 'Error al obtener consultas');
      }
    } catch {
      showFeedback('error', 'Error de red al consultar registros');
    } finally {
      setIsLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      try {
        const res = await fetch('/api/consultations');
        const data = await res.json();
        if (ignore) return;
        if (data.success) {
          setConsultations(data.data);
        } else {
          showFeedback('error', data.error || 'Error al obtener consultas');
        }
      } catch {
        if (!ignore) showFeedback('error', 'Error de red al consultar registros');
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

      const res = await fetch('/api/consultations/import?action=preview', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al procesar archivo');
      }

      setPreviewRows(data.consultations || []);
      setPreviewSummary(data.summary || null);
      setIsReviewMode(true);
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'Error al leer el archivo');
      setSelectedFile(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleConfirmImport = async (editedRows?: PreviewRow[]) => {
    if (!selectedFile && (!editedRows || editedRows.length === 0)) return;
    setIsConfirming(true);

    try {
      const res = editedRows && editedRows.length > 0
        ? await fetch('/api/consultations/import?action=confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consultations: editedRows }),
          })
        : await fetch('/api/consultations/import?action=confirm', {
            method: 'POST',
            body: (() => {
              const fd = new FormData();
              if (selectedFile) fd.append('file', selectedFile);
              return fd;
            })(),
          });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al importar consultas');
      }

      showFeedback(
        'success',
        `Importación completada: ${data.inserted} nuevas consultas ingresadas (${data.skippedDuplicates} duplicadas omitidas).`
      );
      setIsReviewMode(false);
      setSelectedFile(null);
      fetchConsultations();
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
      const res = await fetch(`/api/consultations/export${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('Error al generar Excel');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = (filters?.period || 'consultas')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      a.download = `Consultas_${slug}_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
      <ConsultationsReviewView
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
      {/* Alerta de Feedback */}
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
        id="excel-file-upload"
      />

      {/* Tabla de Consultas con Barra de Herramientas Unificada */}
      <ConsultationsTable
        consultations={consultations}
        isLoading={isLoading}
        onRefresh={fetchConsultations}
        onExport={handleExport}
        isExporting={isExporting}
        onTriggerUpload={() => fileInputRef.current?.click()}
        isPreviewLoading={isPreviewLoading}
      />
    </div>
  );
}
