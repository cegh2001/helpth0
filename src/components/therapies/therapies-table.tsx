'use client';

import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, HeartHandshake } from 'lucide-react';
import { TherapiesFilterBar, TherapyFilterState } from './therapies-filter-bar';
import { ExportTherapiesDialog } from './export-therapies-dialog';
import type { TherapySessionItem } from './therapy-session-item';

interface Props {
  therapies: TherapySessionItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onExport: (filters: { startDate?: string; endDate?: string; period: string }) => void;
  isExporting: boolean;
  onTriggerUpload: () => void;
  isPreviewLoading: boolean;
}

function renderPaymentMethod(item: TherapySessionItem) {
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
    return (
      <Badge variant="outline" className="text-teal-700 bg-teal-50 border-teal-200 text-[10px]">
        {parts[0]}
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

export function TherapiesTable({
  therapies,
  isLoading,
  onRefresh,
  onExport,
  isExporting,
  onTriggerUpload,
  isPreviewLoading,
}: Props) {
  const [filter, setFilter] = useState<TherapyFilterState>({
    search: '',
    startDate: '',
    endDate: '',
    periodLabel: 'Todo el Histórico',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const pageSize = 50;

  const latestDate = useMemo(() => {
    if (therapies.length === 0) return undefined;
    return therapies.reduce((max, item) => (item.date > max ? item.date : max), '');
  }, [therapies]);

  const filtered = useMemo(() => {
    const query = filter.search.toLowerCase().trim();

    return therapies.filter((item) => {
      if (filter.startDate && item.date < filter.startDate) return false;
      if (filter.endDate && item.date > filter.endDate) return false;
      if (!query) return true;

      return (
        item.therapistName.toLowerCase().includes(query) ||
        item.specialty.toLowerCase().includes(query) ||
        item.dayOfWeekName.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query) ||
        (item.observations?.toLowerCase().includes(query) ?? false) ||
        item.date.includes(query)
      );
    });
  }, [therapies, filter]);

  const metrics = useMemo(() => {
    const totalUsd = filtered.reduce((sum, item) => sum + item.amountUsd, 0);
    const totalBs = filtered.reduce((sum, item) => sum + item.totalBs, 0);
    const totalExoneratedUsd = filtered.reduce((sum, item) => sum + item.exoneratedAmountUsd, 0);
    const exoneratedCount = filtered.filter((item) => item.exonerationPercent > 0).length;
    const rates = filtered.map((item) => item.bcvRate).filter((rate) => rate > 0);
    const minRate = rates.length > 0 ? Math.min(...rates) : 0;
    const maxRate = rates.length > 0 ? Math.max(...rates) : 0;
    const avgRate = rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;

    return {
      totalUsd,
      totalBs,
      totalExoneratedUsd,
      exoneratedCount,
      rateDisplay:
        minRate > 0 && maxRate > minRate
          ? `Bs ${minRate.toFixed(2)} - ${maxRate.toFixed(2)}`
          : avgRate > 0
            ? `Bs ${avgRate.toFixed(2)}`
            : '-',
    };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-4">
      <TherapiesFilterBar
        filter={filter}
        onChange={setFilter}
        onRefresh={onRefresh}
        onOpenExportDialog={() => setIsExportDialogOpen(true)}
        onTriggerUpload={onTriggerUpload}
        isLoading={isLoading}
        isPreviewLoading={isPreviewLoading}
        totalFiltered={filtered.length}
        totalAll={therapies.length}
        referenceDate={latestDate}
      />

      <ExportTherapiesDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        therapies={filtered}
        defaultStartDate={filter.startDate}
        defaultEndDate={filter.endDate}
        defaultPeriod={filter.periodLabel === 'Todo el Histórico' ? 'TODO EL HISTÓRICO' : filter.periodLabel}
        onConfirmExport={onExport}
        isExporting={isExporting}
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500">Total Sesiones</span>
          <p className="text-base font-bold text-slate-800">{filtered.length}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-teal-600" />
            Tasa BCV Ref.
          </span>
          <p className="text-sm font-bold text-slate-800 mt-0.5 truncate" title={metrics.rateDisplay}>
            {metrics.rateDisplay}
          </p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500">Monto Facturado ($)</span>
          <p className="text-base font-bold text-blue-600">${metrics.totalUsd.toFixed(2)}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-purple-200 bg-purple-50/20 text-xs">
          <span className="text-purple-700 font-medium flex items-center gap-1">
            <HeartHandshake className="w-3 h-3 text-purple-600" />
            Exonerado ($)
          </span>
          <p className="text-base font-bold text-purple-800">
            ${metrics.totalExoneratedUsd.toFixed(2)}
            <span className="text-[10px] text-purple-600 ml-1 font-normal">
              ({metrics.exoneratedCount} ses.)
            </span>
          </p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs col-span-2 sm:col-span-1">
          <span className="text-slate-500">Total en Bolívares (Bs)</span>
          <p className="text-base font-bold text-emerald-600">
            Bs {metrics.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[600px] w-full">
          <table className="min-w-[1280px] w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold z-10">
              <tr>
                <th className="p-3 w-12">#</th>
                <th className="p-3 w-28">Fecha</th>
                <th className="p-3 w-24">Día</th>
                <th className="p-3">Terapeuta</th>
                <th className="p-3">Especialidad</th>
                <th className="p-3 w-16 text-center">Sesión</th>
                <th className="p-3 w-32 text-center">Tipo de Pago</th>
                <th className="p-3 w-28 text-right">Tasa BCV</th>
                <th className="p-3 w-32 text-right">Bs Facturados</th>
                <th className="p-3 w-24 text-right">Divisas ($)</th>
                <th className="p-3 w-28 text-center">Exoneración</th>
                <th className="p-3 w-48">Estatus / Obs.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    Cargando datos...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    No hay sesiones de terapia que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                paginated.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono text-slate-400">
                      {(safePage - 1) * pageSize + index + 1}
                    </td>
                    <td className="p-3 whitespace-nowrap font-medium text-slate-700">{item.date}</td>
                    <td className="p-3 text-[10px] font-semibold text-slate-500 uppercase">
                      {item.dayOfWeekName}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{item.therapistName}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                        {item.specialty}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-500">{item.sessionIndex}</td>
                    <td className="p-3 text-center">{renderPaymentMethod(item)}</td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {item.bcvRate > 0 ? item.bcvRate.toFixed(2) : '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-700">
                      {item.totalBs > 0 ? item.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-blue-700">
                      {item.amountUsd > 0 ? `$${item.amountUsd.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-3 text-center">
                      {item.exonerationPercent > 0 ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {item.exonerationPercent}%
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600 truncate max-w-[200px]" title={item.observations ?? item.status}>
                      {item.observations ?? item.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/60 text-xs">
            <span className="text-slate-500">
              Página {safePage} de {totalPages} · {filtered.length} sesiones
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safePage === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 cursor-pointer"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safePage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 cursor-pointer"
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
