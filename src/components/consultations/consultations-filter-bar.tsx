'use client';

import React from 'react';
import { Search, RefreshCw, Download, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface FilterState {
  search: string;
  mode: 'all' | 'month' | 'range';
  selectedMonth: string; // "YYYY-MM"
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  periodLabel: string;
}

interface Props {
  filter: FilterState;
  onChange: (updater: (prev: FilterState) => FilterState) => void;
  availableMonths: Array<{ value: string; label: string }>;
  onRefresh: () => void;
  onExport: () => void;
  isLoading: boolean;
  isExporting: boolean;
  totalFiltered: number;
}

export function ConsultationsFilterBar({
  filter,
  onChange,
  availableMonths,
  onRefresh,
  onExport,
  isLoading,
  isExporting,
  totalFiltered,
}: Props) {
  const handleModeChange = (newMode: 'all' | 'month' | 'range') => {
    onChange((prev) => {
      if (newMode === 'all') {
        return {
          ...prev,
          mode: 'all',
          startDate: '',
          endDate: '',
          periodLabel: 'Todo el Histórico',
        };
      }
      if (newMode === 'month') {
        const monthVal = prev.selectedMonth || availableMonths[0]?.value || '2026-10';
        const [year, month] = monthVal.split('-').map(Number);
        const lastDay = new Date(year, month, 0).getDate();
        const start = `${year}-${String(month).padStart(2, '0')}-01`;
        const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const label = availableMonths.find((m) => m.value === monthVal)?.label || monthVal;
        return {
          ...prev,
          mode: 'month',
          selectedMonth: monthVal,
          startDate: start,
          endDate: end,
          periodLabel: label,
        };
      }
      return {
        ...prev,
        mode: 'range',
        periodLabel: prev.startDate && prev.endDate ? `${prev.startDate} a ${prev.endDate}` : 'Rango personalizado',
      };
    });
  };

  const handleMonthChange = (monthVal: string) => {
    const [year, month] = monthVal.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const label = availableMonths.find((m) => m.value === monthVal)?.label || monthVal;

    onChange((prev) => ({
      ...prev,
      mode: 'month',
      selectedMonth: monthVal,
      startDate: start,
      endDate: end,
      periodLabel: label,
    }));
  };

  const handleWeekPreset = (weekNum: 1 | 2 | 3 | 4) => {
    const monthVal = filter.selectedMonth || availableMonths[0]?.value || '2026-10';
    const [year, month] = monthVal.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const mStr = String(month).padStart(2, '0');

    let startDay = 1;
    let endDay = 7;
    if (weekNum === 2) {
      startDay = 8;
      endDay = 14;
    } else if (weekNum === 3) {
      startDay = 15;
      endDay = 21;
    } else if (weekNum === 4) {
      startDay = 22;
      endDay = lastDay;
    }

    const start = `${year}-${mStr}-${String(startDay).padStart(2, '0')}`;
    const end = `${year}-${mStr}-${String(endDay).padStart(2, '0')}`;
    const monthLabel = availableMonths.find((m) => m.value === monthVal)?.label || monthVal;

    onChange((prev) => ({
      ...prev,
      mode: 'range',
      startDate: start,
      endDate: end,
      periodLabel: `Semana ${weekNum} (${monthLabel})`,
    }));
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
      {/* Fila Principal de Filtros */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Búsqueda por texto */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={filter.search}
            onChange={(e) => onChange((p) => ({ ...p, search: e.target.value }))}
            placeholder="Buscar por paciente, cédula o médico..."
            className="pl-9 text-xs"
          />
        </div>

        {/* Selector de Modo de Período */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filtro:</span>
          </div>

          <Select value={filter.mode} onValueChange={(v) => handleModeChange(v as 'all' | 'month' | 'range')}>
            <SelectTrigger className="h-8 text-xs w-[140px] bg-slate-50 font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el histórico</SelectItem>
              <SelectItem value="month">Mes completo</SelectItem>
              <SelectItem value="range">Semanas / Rango</SelectItem>
            </SelectContent>
          </Select>

          {/* Sub-selector según el modo */}
          {filter.mode === 'month' && (
            <Select value={filter.selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="h-8 text-xs w-[150px] bg-white font-semibold text-blue-700 border-blue-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filter.mode === 'range' && (
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={filter.startDate}
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    startDate: e.target.value,
                    periodLabel: `${e.target.value} a ${p.endDate || '...'}`,
                  }))
                }
                className="h-8 text-xs w-32 font-mono px-2"
              />
              <span className="text-slate-400 text-xs">a</span>
              <Input
                type="date"
                value={filter.endDate}
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    endDate: e.target.value,
                    periodLabel: `${p.startDate || '...'} a ${e.target.value}`,
                  }))
                }
                className="h-8 text-xs w-32 font-mono px-2"
              />
            </div>
          )}

          {/* Botones de Acción */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 text-xs flex items-center gap-1 px-2.5"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>

          <Button
            size="sm"
            onClick={onExport}
            disabled={isExporting || totalFiltered === 0}
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 px-3"
            title={`Descargar planilla Excel para: ${filter.periodLabel}`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generando...' : 'Descargar Excel'}</span>
          </Button>
        </div>
      </div>

      {/* Barra secundaria: Botones rápidos por semana cuando se está filtrando */}
      <div className="flex flex-wrap items-center justify-between text-[11px] pt-1 border-t border-slate-100 gap-2">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>Período activo:</span>
          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
            {filter.periodLabel}
          </span>
          <span className="text-slate-400">({totalFiltered} consultas)</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-400 mr-1 hidden sm:inline">Semanas del mes:</span>
          <button
            type="button"
            onClick={() => handleWeekPreset(1)}
            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 font-medium transition cursor-pointer text-[10px]"
          >
            Sem. 1 (1-7)
          </button>
          <button
            type="button"
            onClick={() => handleWeekPreset(2)}
            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 font-medium transition cursor-pointer text-[10px]"
          >
            Sem. 2 (8-14)
          </button>
          <button
            type="button"
            onClick={() => handleWeekPreset(3)}
            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 font-medium transition cursor-pointer text-[10px]"
          >
            Sem. 3 (15-21)
          </button>
          <button
            type="button"
            onClick={() => handleWeekPreset(4)}
            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 font-medium transition cursor-pointer text-[10px]"
          >
            Sem. 4 (22+)
          </button>
        </div>
      </div>
    </div>
  );
}
