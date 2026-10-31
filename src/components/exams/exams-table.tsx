'use client';

import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, HeartHandshake } from 'lucide-react';
import {
  ExamsFilterBar,
  ExamFilterState,
} from './exams-filter-bar';
import { ExportExamsDialog } from './export-exams-dialog';

export interface MedicalExamItem {
  id: string;
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
}

interface Props {
  exams: MedicalExamItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onExport: (filters: { startDate?: string; endDate?: string; period: string }) => void;
  isExporting: boolean;
  onTriggerUpload: () => void;
  isPreviewLoading: boolean;
}

function renderPaymentMethod(item: MedicalExamItem) {
  if (item.exonerationPercent === 100) {
    return (
      <Badge variant="outline" className="text-slate-500 bg-slate-50 border-slate-200 text-[10px]">
        Exonerado
      </Badge>
    );
  }

  const parts: string[] = [];
  if (item.amountPointBs > 0) parts.push('Punto');
  if (item.amountMobileBs > 0) parts.push('P. Móvil');
  if (item.amountCashBs > 0) parts.push('Efectivo');

  if (parts.length === 0) {
    if (item.amountUsd > 0) {
      return (
        <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-[10px]">
          Divisas ($)
        </Badge>
      );
    }
    return <span className="text-slate-400">-</span>;
  }

  if (parts.length === 1) {
    const p = parts[0];
    if (p === 'Punto') {
      return (
        <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-[10px]">
          Punto
        </Badge>
      );
    }
    if (p === 'P. Móvil') {
      return (
        <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px]">
          Pago Móvil
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-[10px]">
        Efectivo
      </Badge>
    );
  }

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200"
      title={parts.join(' + ')}
    >
      Mixto ({parts.join('+')})
    </span>
  );
}

export function ExamsTable({
  exams,
  isLoading,
  onRefresh,
  onExport,
  isExporting,
  onTriggerUpload,
  isPreviewLoading,
}: Props) {
  const [filter, setFilter] = useState<ExamFilterState>({
    search: '',
    startDate: '',
    endDate: '',
    periodLabel: 'Todo el Histórico',
  });

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const filtered = useMemo(() => {
    return exams.filter((c) => {
      if (filter.startDate && c.date < filter.startDate) return false;
      if (filter.endDate && c.date > filter.endDate) return false;

      if (filter.search.trim()) {
        const q = filter.search.toLowerCase().trim();
        const matchesName = c.patientName.toLowerCase().includes(q);
        const matchesCedula = c.patientCedula ? c.patientCedula.includes(q) : false;
        const matchesExam = c.examName ? c.examName.toLowerCase().includes(q) : false;
        const matchesObs = c.observations ? c.observations.toLowerCase().includes(q) : false;
        const matchesStatus = c.status.toLowerCase().includes(q);

        if (!matchesName && !matchesCedula && !matchesExam && !matchesObs && !matchesStatus) {
          return false;
        }
      }

      return true;
    });
  }, [exams, filter]);

  const totalBs = filtered.reduce((acc, c) => acc + (c.totalBs || 0), 0);
  const totalUsd = filtered.reduce((acc, c) => acc + (c.amountUsd || 0), 0);
  const totalExoneratedUsd = filtered.reduce((acc, c) => acc + (c.exoneratedAmountUsd || 0), 0);
  const exoneratedCount = filtered.filter((c) => c.exonerationPercent > 0).length;

  const validRates = filtered.map((c) => c.bcvRate).filter((r) => r > 0);
  const minRate = validRates.length > 0 ? Math.min(...validRates) : 0;
  const maxRate = validRates.length > 0 ? Math.max(...validRates) : 0;
  const avgRate =
    validRates.length > 0 ? validRates.reduce((s, r) => s + r, 0) / validRates.length : 0;

  const rateDisplay =
    minRate > 0 && maxRate > minRate
      ? `Bs ${minRate.toFixed(2)} - ${maxRate.toFixed(2)}`
      : avgRate > 0
        ? `Bs ${avgRate.toFixed(2)}`
        : '-';

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedExams = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros Unificada con DatePickers y Botones de Acción */}
      <ExamsFilterBar
        filter={filter}
        onChange={setFilter}
        onRefresh={onRefresh}
        onOpenExportDialog={() => setIsExportDialogOpen(true)}
        onTriggerUpload={onTriggerUpload}
        isLoading={isLoading}
        isPreviewLoading={isPreviewLoading}
        totalFiltered={filtered.length}
        totalAll={exams.length}
      />

      {/* Diálogo Modal para Descargar Excel con Rango y DatePickers */}
      <ExportExamsDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        exams={filtered}
        defaultStartDate={filter.startDate}
        defaultEndDate={filter.endDate}
        defaultPeriod={filter.periodLabel}
        onConfirmExport={onExport}
        isExporting={isExporting}
      />

      {/* Métricas Resumidas Reactivas al Filtro */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500">Total Exámenes</span>
          <p className="text-base font-bold text-slate-800">{filtered.length}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-blue-600" />
            Tasa BCV Ref.
          </span>
          <p className="text-sm font-bold text-slate-800 mt-0.5 truncate" title={rateDisplay}>
            {rateDisplay}
          </p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500">Monto Facturado ($)</span>
          <p className="text-base font-bold text-blue-600">${totalUsd.toFixed(2)}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-purple-200 bg-purple-50/20 text-xs">
          <span className="text-purple-700 font-medium flex items-center gap-1">
            <HeartHandshake className="w-3 h-3 text-purple-600" />
            Exonerado ($)
          </span>
          <p className="text-base font-bold text-purple-800">
            ${totalExoneratedUsd.toFixed(2)}
            <span className="text-[10px] text-purple-600 ml-1 font-normal">({exoneratedCount} pac.)</span>
          </p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs col-span-2 sm:col-span-1">
          <span className="text-slate-500">Total en Bolívares (Bs)</span>
          <p className="text-base font-bold text-emerald-600">
            Bs {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Tabla Principal con Scroll Horizontal */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[600px] w-full">
          <table className="min-w-[1350px] w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold z-10">
              <tr>
                <th className="p-3 w-12">#</th>
                <th className="p-3 w-28">Fecha</th>
                <th className="p-3">Paciente</th>
                <th className="p-3 w-28">Cédula</th>
                <th className="p-3 w-28">F. Nacimiento</th>
                <th className="p-3 w-32">Teléfono</th>
                <th className="p-3">Estudio / Examen</th>
                <th className="p-3 w-28 text-center">Tipo de Pago</th>
                <th className="p-3 w-28 text-right">Tasa BCV</th>
                <th className="p-3 w-32 text-right">Bs Facturados</th>
                <th className="p-3 w-24 text-right">Divisas ($)</th>
                <th className="p-3 w-32 text-center">Exoneración</th>
                <th className="p-3 w-32">Estatus / Obs.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-slate-400">
                    Cargando datos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-slate-400">
                    No se encontraron exámenes para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                paginatedExams.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 text-slate-400 font-mono">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="p-3 whitespace-nowrap font-medium text-slate-700">
                      {item.date}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{item.patientName}</td>
                    <td className="p-3 font-mono text-slate-600">
                      {item.patientCedula ? `V-${item.patientCedula}` : '-'}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {item.patientBirthDate || '-'}
                    </td>
                    <td className="p-3 text-slate-600">{item.patientPhone || '-'}</td>
                    <td className="p-3 text-slate-700 font-medium">
                      {item.examName || <span className="text-slate-400 italic">No especificado</span>}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {renderPaymentMethod(item)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {item.bcvRate > 0 ? item.bcvRate.toFixed(2) : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-emerald-700">
                      {item.totalBs > 0
                        ? `Bs ${item.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                        : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-blue-700">
                      {item.amountUsd > 0 ? `$${item.amountUsd.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-3 text-center">
                      {item.exonerationPercent > 0 ? (
                        <span className="text-purple-700 font-semibold bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-[10px]">
                          {item.exonerationPercent}% (${item.exoneratedAmountUsd.toFixed(2)})
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-700">
                      <span className="text-[11px]">{item.observations || item.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/60">
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white disabled:opacity-50 cursor-pointer"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white disabled:opacity-50 cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
