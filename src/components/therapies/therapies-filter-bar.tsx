'use client';

import React from 'react';
import {
  Search,
  RefreshCw,
  Download,
  Upload,
  Calendar,
  X,
  CalendarRange,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';

export interface TherapyFilterState {
  search: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  periodLabel: string;
}

interface Props {
  filter: TherapyFilterState;
  onChange: (updater: (prev: TherapyFilterState) => TherapyFilterState) => void;
  onRefresh: () => void;
  onOpenExportDialog: () => void;
  onTriggerUpload: () => void;
  isLoading: boolean;
  isPreviewLoading: boolean;
  totalFiltered: number;
  totalAll: number;
  referenceDate?: string;
}

const MONTH_LABELS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

interface MonthWindow {
  label: string;
  start: string;
  lastDay: number;
}

function resolveMonthWindow(referenceDate?: string): MonthWindow {
  const parsed =
    referenceDate && /^\d{4}-\d{2}-\d{2}$/.test(referenceDate)
      ? new Date(`${referenceDate}T00:00:00.000Z`)
      : new Date();

  const year = parsed.getUTCFullYear();
  const month = parsed.getUTCMonth() + 1;
  const monthStr = String(month).padStart(2, '0');
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return {
    label: MONTH_LABELS[month - 1],
    start: `${year}-${monthStr}-01`,
    lastDay,
  };
}

function buildMonthWindow(label: string, yearMonthPrefix: string, lastDay: number) {
  return {
    month: {
      start: `${yearMonthPrefix}-01`,
      end: `${yearMonthPrefix}-${String(lastDay).padStart(2, '0')}`,
      label: `Mes Completo (${label})`,
    },
    weeks: [
      { start: `${yearMonthPrefix}-01`, end: `${yearMonthPrefix}-07`, label: 'Semana 1 (1-7)' },
      { start: `${yearMonthPrefix}-08`, end: `${yearMonthPrefix}-14`, label: 'Semana 2 (8-14)' },
      { start: `${yearMonthPrefix}-15`, end: `${yearMonthPrefix}-21`, label: 'Semana 3 (15-21)' },
      { start: `${yearMonthPrefix}-22`, end: `${yearMonthPrefix}-${String(lastDay).padStart(2, '0')}`, label: 'Semana 4 (22+)' },
    ],
  };
}

export function TherapiesFilterBar({
  filter,
  onChange,
  onRefresh,
  onOpenExportDialog,
  onTriggerUpload,
  isLoading,
  isPreviewLoading,
  totalFiltered,
  totalAll,
  referenceDate,
}: Props) {
  const window = resolveMonthWindow(referenceDate);
  const yearMonthPrefix = window.start.slice(0, 7);
  const presets = buildMonthWindow(window.label, yearMonthPrefix, window.lastDay);

  const applyRange = (startDate: string, endDate: string, label: string) => {
    onChange((prev) => ({ ...prev, startDate, endDate, periodLabel: label }));
  };

  const clearDates = () => {
    onChange((prev) => ({ ...prev, startDate: '', endDate: '', periodLabel: 'Todo el Histórico' }));
  };

  const hasDateFilter = Boolean(filter.startDate || filter.endDate);

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={filter.search}
            onChange={(e) => onChange((p) => ({ ...p, search: e.target.value }))}
            placeholder="Buscar por terapeuta, especialidad u observación..."
            className="pl-9 text-xs h-9 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 pl-2 flex items-center gap-1">
              <CalendarRange className="w-3.5 h-3.5 text-teal-600" />
              <span>Desde:</span>
            </span>
            <DatePicker
              value={filter.startDate}
              onChange={(d) =>
                onChange((p) => ({
                  ...p,
                  startDate: d,
                  periodLabel: d && p.endDate ? `${d} a ${p.endDate}` : d ? `Desde ${d}` : 'Personalizado',
                }))
              }
              placeholder="Fecha inicio"
              className="h-7 text-xs border-0 shadow-none px-2 bg-transparent"
            />
            <span className="text-[11px] font-semibold text-slate-500">Hasta:</span>
            <DatePicker
              value={filter.endDate}
              onChange={(d) =>
                onChange((p) => ({
                  ...p,
                  endDate: d,
                  periodLabel: p.startDate && d ? `${p.startDate} a ${d}` : d ? `Hasta ${d}` : 'Personalizado',
                }))
              }
              placeholder="Fecha fin"
              className="h-7 text-xs border-0 shadow-none px-2 bg-transparent"
            />
            {hasDateFilter && (
              <button
                type="button"
                onClick={clearDates}
                title="Limpiar fechas"
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onTriggerUpload}
              disabled={isPreviewLoading}
              className="h-9 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 flex items-center gap-1.5 rounded-xl cursor-pointer shadow-xs"
              title="Cargar y validar planilla Excel de terapias"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isPreviewLoading ? 'Analizando...' : 'Cargar Excel'}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={onOpenExportDialog}
              disabled={totalAll === 0}
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 flex items-center gap-1.5 rounded-xl cursor-pointer shadow-xs"
              title="Abrir diálogo de descarga Excel con filtros"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Excel</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-9 text-xs px-2.5 rounded-xl text-slate-600 hover:text-slate-900 border-slate-200"
              title="Refrescar lista"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span>Filtro activo:</span>
          </div>
          <span className="font-semibold text-slate-800 bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-lg text-[10px]">
            {filter.periodLabel}
          </span>
          <span className="text-slate-400">
            ({totalFiltered} de {totalAll} sesiones)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 mr-1 hidden sm:inline text-[11px]">
            Semanas de {window.label}:
          </span>
          <button
            type="button"
            onClick={() => applyRange(presets.month.start, presets.month.end, presets.month.label)}
            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-medium transition cursor-pointer text-[10px]"
          >
            Mes Completo
          </button>
          {presets.weeks.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyRange(preset.start, preset.end, preset.label)}
              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-medium transition cursor-pointer text-[10px]"
            >
              {preset.label.replace('Semana', 'Sem.')}
            </button>
          ))}
          <button
            type="button"
            onClick={clearDates}
            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium transition cursor-pointer text-[10px]"
          >
            Ver Todo
          </button>
        </div>
      </div>
    </div>
  );
}
