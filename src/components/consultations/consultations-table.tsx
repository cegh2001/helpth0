'use client';

import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, HeartHandshake } from 'lucide-react';
import {
  ConsultationsFilterBar,
  FilterState,
} from './consultations-filter-bar';
import { ExportConsultationsDialog } from './export-consultations-dialog';
import { DataPagination } from '@/components/ui/data-pagination';
import { clampPage, DEFAULT_PAGE_SIZE } from '@/components/ui/pagination-range';
import { formatDisplayDate } from '@/lib/date-utils';
import type { ConsultationItem } from './consultation-item';

interface Props {
  consultations: ConsultationItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onExport: (filters: { startDate?: string; endDate?: string; period: string }) => void;
  isExporting: boolean;
  onTriggerUpload: () => void;
  isPreviewLoading: boolean;
}

function renderPaymentMethod(item: ConsultationItem) {
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

export function ConsultationsTable({
  consultations,
  isLoading,
  onRefresh,
  onExport,
  isExporting,
  onTriggerUpload,
  isPreviewLoading,
}: Props) {
  const [filter, setFilter] = useState<FilterState>(() => ({
    search: '',
    startDate: '',
    endDate: '',
    periodLabel: 'Todo el Histórico',
  }));

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = DEFAULT_PAGE_SIZE;

  const filtered = useMemo(() => {
    return consultations.filter((c) => {
      if (filter.startDate && c.date < filter.startDate) return false;
      if (filter.endDate && c.date > filter.endDate) return false;

      if (!filter.search.trim()) return true;
      const q = filter.search.toLowerCase().trim();
      return (
        c.patientName.toLowerCase().includes(q) ||
        (c.patientCedula && c.patientCedula.includes(q)) ||
        c.doctorName.toLowerCase().includes(q) ||
        c.specialty.toLowerCase().includes(q) ||
        c.date.includes(q) ||
        formatDisplayDate(c.date).includes(q)
      );
    });
  }, [consultations, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = clampPage(currentPage, pageCount);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const totalUsd = filtered.reduce((s, c) => s + c.amountUsd, 0);
  const totalBs = filtered.reduce((s, c) => s + c.totalBs, 0);
  const totalExoneratedUsd = filtered.reduce((s, c) => s + (c.exoneratedAmountUsd || 0), 0);
  const exoneratedCount = filtered.filter((c) => (c.exonerationPercent || 0) > 0).length;

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

  return (
    <div className="space-y-4">
      {/* Barra de Filtros Unificada con DatePickers y Botones de Acción */}
      <ConsultationsFilterBar
        filter={filter}
        onChange={setFilter}
        onRefresh={onRefresh}
        onOpenExportDialog={() => setIsExportDialogOpen(true)}
        onTriggerUpload={onTriggerUpload}
        isLoading={isLoading}
        isPreviewLoading={isPreviewLoading}
        totalFiltered={filtered.length}
        totalAll={consultations.length}
      />

      {/* Diálogo Modal para Descargar Excel con Rango y DatePickers */}
      <ExportConsultationsDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        consultations={consultations}
        defaultStartDate={filter.startDate}
        defaultEndDate={filter.endDate}
        defaultPeriod={filter.periodLabel}
        onConfirmExport={onExport}
        isExporting={isExporting}
      />

      {/* Métricas Resumidas Reactivas al Filtro */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500">Total Consultas</span>
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
            <HeartHandshake className="w-3 h-3" />
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
        <div className="table-scroll overflow-auto max-h-[600px] w-full">
          <table className="min-w-[1350px] w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold z-10">
              <tr>
                <th className="p-3 w-12">#</th>
                <th className="p-3 w-28">Fecha</th>
                <th className="p-3">Paciente</th>
                <th className="p-3 w-28">Cédula</th>
                <th className="p-3">Médico</th>
                <th className="p-3">Especialidad</th>
                <th className="p-3 w-28 text-center">Tipo de Pago</th>
                <th className="p-3 w-28 text-right">Tasa BCV</th>
                <th className="p-3 w-32 text-right">Bs Facturados</th>
                <th className="p-3 w-24 text-right">Divisas ($)</th>
                <th className="p-3 w-32 text-center">Exoneración</th>
                <th className="p-3 w-28">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    {isLoading ? 'Cargando datos...' : 'No se encontraron consultas para el filtro seleccionado.'}
                  </td>
                </tr>
              ) : (
                paginated.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 text-slate-400 font-mono">
                      {(safePage - 1) * pageSize + index + 1}
                    </td>
                    <td className="p-3 whitespace-nowrap font-medium text-slate-700">{formatDisplayDate(item.date)}</td>
                    <td className="p-3 font-semibold text-slate-900">{item.patientName}</td>
                    <td className="p-3 text-slate-600 font-mono">{item.patientCedula || 'Sin Cédula'}</td>
                    <td className="p-3 text-slate-700 whitespace-nowrap">{item.doctorName}</td>
                    <td className="p-3 text-slate-600 whitespace-nowrap">{item.specialty}</td>
                    <td className="p-3 text-center whitespace-nowrap">{renderPaymentMethod(item)}</td>
                    <td className="p-3 text-right font-mono text-slate-700">
                      {item.bcvRate > 0 ? `Bs ${item.bcvRate.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-800">
                      {item.totalBs > 0 ? item.totalBs.toFixed(2) : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-blue-700">
                      ${item.amountUsd}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {item.exonerationPercent > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                          {item.exonerationPercent}% (${item.exoneratedAmountUsd})
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DataPagination
          page={safePage}
          pageCount={pageCount}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="consultas"
        />
      </div>
    </div>
  );
}
