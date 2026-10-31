'use client';

import React, { useMemo, useState } from 'react';
import { FileSpreadsheet, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TherapyReviewMetricsCards } from './review-metrics-cards';
import { TherapyReviewTableRow } from './therapy-review-table-row';

export interface TherapyPreviewRow {
  date: string;
  dayOfWeekName: string;
  therapistName: string;
  specialty: string;
  sessionIndex: number;
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

export interface TherapyPreviewSummary {
  totalParsed: number;
  newRowsCount: number;
  duplicateCount: number;
  totalAmountUsd: number;
  totalAmountBs: number;
  totalExoneratedUsd: number;
  exoneratedSessionsCount: number;
  averageBcvRate: number;
  minBcvRate: number;
  maxBcvRate: number;
  dateRange: { min: string; max: string } | null;
}

interface Props {
  fileName: string;
  rows: TherapyPreviewRow[];
  summary: TherapyPreviewSummary | null;
  onCancel: () => void;
  onConfirm: (editedRows: TherapyPreviewRow[]) => void;
  isConfirming: boolean;
}

const NUMERIC_FIELDS: (keyof TherapyPreviewRow)[] = [
  'amountPointBs',
  'amountMobileBs',
  'amountCashBs',
  'bcvRate',
  'amountUsd',
  'totalBs',
  'exonerationPercent',
];

export function TherapiesReviewView({
  fileName,
  rows,
  onCancel,
  onConfirm,
  isConfirming,
}: Props) {
  const [editableRows, setEditableRows] = useState<TherapyPreviewRow[]>(() => rows);
  const [search, setSearch] = useState('');

  const handleRowChange = (index: number, field: keyof TherapyPreviewRow, value: unknown) => {
    setEditableRows((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };

      if (NUMERIC_FIELDS.includes(field)) {
        const point = Number(item.amountPointBs) || 0;
        const mobile = Number(item.amountMobileBs) || 0;
        const cash = Number(item.amountCashBs) || 0;
        const rate = Number(item.bcvRate) || 0;
        const usd = Number(item.amountUsd) || 0;
        const paidBs = point + mobile + cash;

        if (paidBs > 0) {
          item.totalBs = paidBs;
        } else if (usd > 0 && rate > 0) {
          if (field === 'amountUsd' || field === 'bcvRate' || Number(item.totalBs) <= 0) {
            item.totalBs = Number((usd * rate).toFixed(2));
          }
        }

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
    const indexed = editableRows.map((row, index) => ({ row, index }));
    if (!search.trim()) return indexed;

    const query = search.toLowerCase().trim();
    return indexed.filter(
      ({ row }) =>
        row.therapistName.toLowerCase().includes(query) ||
        row.specialty.toLowerCase().includes(query) ||
        row.dayOfWeekName.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query) ||
        (row.observations?.toLowerCase().includes(query) ?? false) ||
        row.date.includes(query)
    );
  }, [editableRows, search]);

  const computedMetrics = useMemo(() => {
    const totalParsed = editableRows.length;
    const newRowsCount = editableRows.filter((row) => !row.isDuplicate).length;
    const rates = editableRows.map((row) => row.bcvRate).filter((rate) => rate > 0);
    const minRate = rates.length > 0 ? Math.min(...rates) : 0;
    const maxRate = rates.length > 0 ? Math.max(...rates) : 0;
    const avgRate = rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;

    return {
      totalParsed,
      newRowsCount,
      duplicateCount: totalParsed - newRowsCount,
      totalAmountUsd: editableRows.reduce((sum, row) => sum + row.amountUsd, 0),
      totalAmountBs: editableRows.reduce((sum, row) => sum + (row.totalBs || 0), 0),
      totalExoneratedUsd: editableRows.reduce(
        (sum, row) => sum + (row.exoneratedAmountUsd || 0),
        0
      ),
      exoneratedSessionsCount: editableRows.filter((row) => row.exonerationPercent > 0).length,
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
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-xs -ml-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver al Listado
            </Button>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-semibold text-slate-500 truncate max-w-sm">{fileName}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-600" />
            <span>Revisión y Edición Interactiva de Terapias</span>
          </h2>
          <p className="text-xs text-slate-500">
            Podés corregir terapeuta, especialidad, tasas o montos antes de guardar. La fecha y el
            número de sesión identifican cada fila y no se editan acá.
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
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4"
          >
            {isConfirming
              ? 'Guardando en Base de Datos...'
              : computedMetrics.newRowsCount > 0
                ? `Confirmar e Importar (${computedMetrics.newRowsCount} nuevas)`
                : `Actualizar Sesiones (${editableRows.length})`}
          </Button>
        </div>
      </div>

      <TherapyReviewMetricsCards metrics={computedMetrics} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por terapeuta, especialidad, estatus u observación..."
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
          <table className="min-w-[1450px] w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold z-10">
              <tr>
                <th className="p-3 w-12">#</th>
                <th className="p-3 w-24">Estado</th>
                <th className="p-3 w-28">Fecha</th>
                <th className="p-3 w-28">Día</th>
                <th className="p-3 w-52">Terapeuta (editable)</th>
                <th className="p-3 w-44">Especialidad (editable)</th>
                <th className="p-3 w-16 text-center">Sesión</th>
                <th className="p-3 w-24 text-center">Tipo Pago</th>
                <th className="p-3 w-28 text-right">Tasa BCV</th>
                <th className="p-3 w-32 text-right">Bs Facturados</th>
                <th className="p-3 w-24 text-right">Divisas ($)</th>
                <th className="p-3 w-48">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    No se encontraron sesiones que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ row, index }) => (
                  <TherapyReviewTableRow
                    key={index}
                    row={row}
                    index={index}
                    onChange={handleRowChange}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
