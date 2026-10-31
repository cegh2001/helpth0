'use client';

import React, { useState, useMemo } from 'react';
import { FileSpreadsheet, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReviewMetricsCards } from './review-metrics-cards';
import { ReviewTableRow } from './review-table-row';

export interface PreviewRow {
  date: string;
  patientName: string;
  patientCedula: string | null;
  doctorName: string;
  specialty: string;
  amountPointBs: number;
  amountMobileBs: number;
  amountCashBs: number;
  bcvRate: number;
  amountUsd: number;
  totalBs: number;
  status: string;
  exonerationPercent: number;
  exoneratedAmountUsd: number;
  isDuplicate: boolean;
}

export interface PreviewSummary {
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
  uniqueDoctors: string[];
  uniqueSpecialties: string[];
}

interface Props {
  fileName: string;
  rows: PreviewRow[];
  summary: PreviewSummary | null;
  onCancel: () => void;
  onConfirm: (editedRows: PreviewRow[]) => void;
  isConfirming: boolean;
}

export function ConsultationsReviewView({
  fileName,
  rows,
  onCancel,
  onConfirm,
  isConfirming,
}: Props) {
  const [editableRows, setEditableRows] = useState<PreviewRow[]>(() => rows);

  const handleRowChange = (index: number, field: keyof PreviewRow, value: unknown) => {
    setEditableRows((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };

      if (field === 'exonerationPercent' || field === 'amountUsd' || field === 'bcvRate') {
        const percent = Math.min(100, Math.max(0, Number(item.exonerationPercent) || 0));
        item.exonerationPercent = percent;
        item.exoneratedAmountUsd = Number(((item.amountUsd * percent) / 100).toFixed(2));
        item.status = percent === 100 ? 'EXONERADO 100%' : percent > 0 ? `EXONERADO ${percent}%` : 'COMPLETO';
      }

      copy[index] = item;
      return copy;
    });
  };

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
      {/* Encabezado y Acciones */}
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
            <span>Revisión y Edición Interactiva de Consultas</span>
          </h2>
          <p className="text-xs text-slate-500">
            Podés corregir nombres, cédulas, tasas o porcentajes directamente en la tabla antes de guardar.
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
                ? `Confirmar e Importar (${computedMetrics.newRowsCount} nuevas)`
                : `Actualizar Consultas (${editableRows.length})`}
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI Reactivas */}
      <ReviewMetricsCards metrics={computedMetrics} />

      {/* Tabla Ancha con Inputs Editables y Scroll Horizontal */}
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
                <th className="p-3 w-48">Médico</th>
                <th className="p-3 w-40">Especialidad</th>
                <th className="p-3 w-24 text-center">Tipo Pago</th>
                <th className="p-3 w-28 text-right">Tasa BCV</th>
                <th className="p-3 w-32 text-right">Bs Facturados</th>
                <th className="p-3 w-24 text-right">Divisas ($)</th>
                <th className="p-3 w-28 text-center">% Exon.</th>
                <th className="p-3 w-24 text-right">Exon. ($)</th>
                <th className="p-3 w-32">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {editableRows.map((row, idx) => (
                <ReviewTableRow key={idx} row={row} index={idx} onChange={handleRowChange} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
