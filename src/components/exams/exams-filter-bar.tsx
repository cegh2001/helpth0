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

export interface ExamFilterState {
  search: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  periodLabel: string;
}

interface Props {
  filter: ExamFilterState;
  onChange: (updater: (prev: ExamFilterState) => ExamFilterState) => void;
  onRefresh: () => void;
  onOpenExportDialog: () => void;
  onTriggerUpload: () => void;
  isLoading: boolean;
  isPreviewLoading: boolean;
  totalFiltered: number;
  totalAll: number;
}

export function ExamsFilterBar({
  filter,
  onChange,
  onRefresh,
  onOpenExportDialog,
  onTriggerUpload,
  isLoading,
  isPreviewLoading,
  totalFiltered,
  totalAll,
}: Props) {
  const handleApplyPreset = (preset: 'month' | 'sem1' | 'sem2' | 'sem3' | 'sem4' | 'all') => {
    if (preset === 'all') {
      onChange((prev) => ({
        ...prev,
        startDate: '',
        endDate: '',
        periodLabel: 'Todo el Histórico',
      }));
      return;
    }

    const baseYear = 2026;
    const baseMonth = 10;
    const mStr = String(baseMonth).padStart(2, '0');
    const lastDay = 31;

    let start = '';
    let end = '';
    let label = '';

    if (preset === 'month') {
      start = `${baseYear}-${mStr}-01`;
      end = `${baseYear}-${mStr}-${lastDay}`;
      label = 'Mes Completo (Octubre 2026)';
    } else if (preset === 'sem1') {
      start = `${baseYear}-${mStr}-01`;
      end = `${baseYear}-${mStr}-07`;
      label = 'Semana 1 (1-7 Oct)';
    } else if (preset === 'sem2') {
      start = `${baseYear}-${mStr}-08`;
      end = `${baseYear}-${mStr}-14`;
      label = 'Semana 2 (8-14 Oct)';
    } else if (preset === 'sem3') {
      start = `${baseYear}-${mStr}-15`;
      end = `${baseYear}-${mStr}-21`;
      label = 'Semana 3 (15-21 Oct)';
    } else if (preset === 'sem4') {
      start = `${baseYear}-${mStr}-22`;
      end = `${baseYear}-${mStr}-${lastDay}`;
      label = 'Semana 4 (22+ Oct)';
    }

    onChange((prev) => ({
      ...prev,
      startDate: start,
      endDate: end,
      periodLabel: label,
    }));
  };

  const hasDateFilter = Boolean(filter.startDate || filter.endDate);

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por paciente, cédula, estudio u observación..."
            value={filter.search}
            onChange={(e) => onChange((prev) => ({ ...prev, search: e.target.value }))}
            className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
          />
          {filter.search && (
            <button
              onClick={() => onChange((prev) => ({ ...prev, search: '' }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs h-9 text-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenExportDialog}
            className="text-xs h-9 text-slate-700 hover:text-slate-900 border-slate-200"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            Exportar Excel
          </Button>

          <Button
            size="sm"
            onClick={onTriggerUpload}
            disabled={isPreviewLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            {isPreviewLoading ? 'Analizando...' : 'Importar Excel / CSV'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1 text-slate-500 font-medium mr-1">
          <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
          <span>Filtro Rápido:</span>
        </div>

        <button
          onClick={() => handleApplyPreset('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
            !filter.startDate && !filter.endDate
              ? 'bg-blue-600 text-white font-semibold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todo
        </button>

        <button
          onClick={() => handleApplyPreset('month')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
            filter.periodLabel.includes('Mes Completo')
              ? 'bg-blue-600 text-white font-semibold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Mes Actual
        </button>

        <button
          onClick={() => handleApplyPreset('sem1')}
          className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
            filter.periodLabel.includes('Semana 1')
              ? 'bg-blue-600 text-white font-semibold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Sem 1
        </button>

        <button
          onClick={() => handleApplyPreset('sem2')}
          className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
            filter.periodLabel.includes('Semana 2')
              ? 'bg-blue-600 text-white font-semibold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Sem 2
        </button>

        <button
          onClick={() => handleApplyPreset('sem3')}
          className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
            filter.periodLabel.includes('Semana 3')
              ? 'bg-blue-600 text-white font-semibold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Sem 3
        </button>

        <button
          onClick={() => handleApplyPreset('sem4')}
          className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
            filter.periodLabel.includes('Semana 4')
              ? 'bg-blue-600 text-white font-semibold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Sem 4
        </button>

        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-28">
            <DatePicker
              value={filter.startDate}
              onChange={(d) =>
                onChange((prev) => ({
                  ...prev,
                  startDate: d,
                  periodLabel: 'Rango Personalizado',
                }))
              }
              placeholder="Desde"
            />
          </div>
          <span className="text-slate-400">-</span>
          <div className="w-28">
            <DatePicker
              value={filter.endDate}
              onChange={(d) =>
                onChange((prev) => ({
                  ...prev,
                  endDate: d,
                  periodLabel: 'Rango Personalizado',
                }))
              }
              placeholder="Hasta"
            />
          </div>

          {hasDateFilter && (
            <button
              onClick={() => handleApplyPreset('all')}
              title="Limpiar fechas"
              className="p-1.5 text-slate-400 hover:text-rose-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
        <span>
          Mostrando <strong className="text-slate-800">{totalFiltered}</strong> de{' '}
          <strong className="text-slate-800">{totalAll}</strong> exámenes registrados
        </span>
        {hasDateFilter && (
          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium border border-blue-100 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {filter.periodLabel} ({filter.startDate || 'Inicio'} al {filter.endDate || 'Fin'})
          </span>
        )}
      </div>
    </div>
  );
}
