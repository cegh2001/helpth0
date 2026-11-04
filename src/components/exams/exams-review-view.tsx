'use client';

import React, { useState, useMemo } from 'react';
import { FileSpreadsheet, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExamReviewMetricsCards } from './review-metrics-cards';
import { ExamReviewTableRow } from './exam-review-table-row';
import { formatDisplayDate } from '@/lib/date-utils';

export interface ExamPreviewRow {
  date: string;
  patientName: string;
  patientCedula: string | null;
  patientBirthDate: string | null;
  patientPhone: string | null;
  patientAddress: string | null;
  examName: string | null;
  amountPointBs: number;
  amountMobileBs: number;
  amountCashBs: number;
  bcvRate: number;
  amountUsd: number;
  totalBs: number;
  status: string;
  exonerationPercent: number;
  exoneratedAmountUsd: number;
  observations: string | null;
  isDuplicate: boolean;
}

export interface ExamPreviewSummary {
  totalParsed: number;
  newRowsCount: number;
  duplicateCount: number;
  totalAmountUsd: number;
  totalAmountBs: number;
  totalExoneratedUsd: number;
  exoneratedPatientsCount: number;
  averageBcvRate: number;
  minBcvRate: number;
  maxBcvRate: number;
  dateRange: { min: string; max: string } | null;
}

interface Props {
  fileName: string;
  rows: ExamPreviewRow[];
  summary: ExamPreviewSummary | null;
  onCancel: () => void;
  onConfirm: (editedRows: ExamPreviewRow[]) => void;
  isConfirming: boolean;
}

export function ExamsReviewView({
  fileName,
  rows,
  onCancel,
  onConfirm,
  isConfirming,
}: Props) {
  const [editableRows, setEditableRows] = useState<ExamPreviewRow[]>(() => rows);
  const [search, setSearch] = useState('');

  const handleRowChange = (index: number, field: keyof ExamPreviewRow, value: unknown) => {
    setEditableRows((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };

      if (
        field === 'amountPointBs' ||
        field === 'amountMobileBs' ||
        field === 'amountCashBs' ||
        field === 'bcvRate' ||
        field === 'amountUsd' ||
        field === 'totalBs' ||
        field === 'exonerationPercent'
      ) {
        const point = Number(item.amountPointBs) || 0;
        const mobile = Number(item.amountMobileBs) || 0;
        const cash = Number(item.amountCashBs) || 0;
        const rate = Number(item.bcvRate) || 0;
        let usd = Number(item.amountUsd) || 0;
        let bs = Number(item.totalBs) || 0;
        const paidBs = point + mobile + cash;

        if (paidBs > 0) {
          bs = paidBs;
          if (
            field !== 'amountUsd' &&
            (usd <= 0 ||
              field === 'bcvRate' ||
              field === 'amountPointBs' ||
              field === 'amountMobileBs' ||
              field === 'amountCashBs')
          ) {
            if (rate > 0) usd = Number((paidBs / rate).toFixed(2));
          }
        } else if (usd > 0 && rate > 0) {
          if (field === 'amountUsd' || field === 'bcvRate' || bs <= 0) {
            bs = Number((usd * rate).toFixed(2));
          }
        }

        item.totalBs = bs;
        item.amountUsd = usd;

        const percent = Math.min(100, Math.max(0, Number(item.exonerationPercent) || 0));
        item.exonerationPercent = percent;
        item.exoneratedAmountUsd = Number(((usd * percent) / 100).toFixed(2));
        item.status =
          percent === 100 ? 'EXONERADO 100%' : percent > 0 ? `EXONERADO ${percent}%` : 'COMPLETO';
      }

      copy[index] = item;
      return copy;
    });
  };

  const filteredRows = useMemo(() => {
    if (!search.trim()) {
      return editableRows.map((row, index) => ({ row, index }));
    }
    const q = search.toLowerCase().trim();
    return editableRows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) =>
        row.patientName.toLowerCase().includes(q) ||
        (row.patientCedula && row.patientCedula.toLowerCase().includes(q)) ||
        (row.examName && row.examName.toLowerCase().includes(q)) ||
        row.status.toLowerCase().includes(q) ||
        (row.observations && row.observations.toLowerCase().includes(q)) ||
        row.date.includes(q) ||
        formatDisplayDate(row.date).includes(q)
      );
  }, [editableRows, search]);

  const computedMetrics = useMemo(() => {
    const totalParsed = editableRows.length;
    const newRowsCount = editableRows.filter((r) => !r.isDuplicate).length;
    const duplicateCount = totalParsed - newRowsCount;
    const totalAmountUsd = editableRows.reduce((s, r) => s + r.amountUsd, 0);
    const totalAmountBs = editableRows.reduce((s, r) => s + (r.totalBs || 0), 0);
    const totalExoneratedUsd = editableRows.reduce((s, r) => s + (r.exoneratedAmountUsd || 0), 0);
    const exoneratedPatientsCount = editableRows.filter((r) => r.exonerationPercent > 0).length;

    const rates = editableRows.map((r) => r.bcvRate).filter((r) => r > 0);
    const minRate = rates.length > 0 ? Math.min(...rates) : 0;
    const maxRate = rates.length > 0 ? Math.max(...rates) : 0;
    const avgRate = rates.length > 0 ? rates.reduce((s, r) => s + r, 0) / rates.length : 0;

    return {
      totalParsed,
      newRowsCount,
      duplicateCount,
      totalAmountUsd,
      totalAmountBs,
      totalExoneratedUsd,
      exoneratedPatientsCount,
      rateDisplay:
        minRate > 0 && maxRate > minRate
          ? `Bs ${minRate.toFixed(2)} - ${maxRate.toFixed(2)}`
          : avgRate > 0
            ? `Bs ${avgRate.toFixed(2)}`
            : '-',
    };
  }, [editableRows]);

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs -ml-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver al Listado
            </Button>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-semibold text-slate-500 truncate max-w-sm">{fileName}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <span>Revisión y Edición Interactiva de Exámenes</span>
          </h2>
          <p className="text-xs text-slate-500">
            Podés corregir nombres, cédulas, tasas o montos directamente en la tabla antes de guardar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isConfirming}>
            Descartar
          </Button>
          <Button
            size="sm"
            onClick={() => onConfirm(editableRows)}
            disabled={editableRows.length === 0 || isConfirming}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4"
          >
            {isConfirming
              ? 'Guardando en Base de Datos...'
              : computedMetrics.newRowsCount > 0
                ? `Confirmar e Importar (${computedMetrics.newRowsCount} nuevos)`
                : `Actualizar Exámenes (${editableRows.length})`}
          </Button>
        </div>
      </div>

      <ExamReviewMetricsCards metrics={computedMetrics} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por paciente, cédula, estudio, estatus u observación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-xs bg-slate-50 border-slate-200"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Mostrando {filteredRows.length} de {editableRows.length} registros
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[620px] w-full">
          <table className="min-w-[1550px] w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold z-10">
              <tr>
                <th className="p-3 w-12">#</th>
                <th className="p-3 w-24">Estado</th>
                <th className="p-3 w-28">Fecha</th>
                <th className="p-3 w-52">Paciente (editable)</th>
                <th className="p-3 w-32">Cédula</th>
                <th className="p-3 w-32">F. Nacimiento</th>
                <th className="p-3 w-40">Examen / Estudio</th>
                <th className="p-3 w-24 text-center">Tipo Pago</th>
                <th className="p-3 w-28 text-right">Tasa BCV</th>
                <th className="p-3 w-32 text-right">Bs Facturados</th>
                <th className="p-3 w-24 text-right">Divisas ($)</th>
                <th className="p-3 w-44">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    No se encontraron exámenes que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ row, index }) => (
                  <ExamReviewTableRow key={index} row={row} index={index} onChange={handleRowChange} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
