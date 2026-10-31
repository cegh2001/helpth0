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

export interface FilterState {
  search: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  periodLabel: string;
}

interface Props {
  filter: FilterState;
  onChange: (updater: (prev: FilterState) => FilterState) => void;
  onRefresh: () => void;
  onOpenExportDialog: () => void;
  onTriggerUpload: () => void;
  isLoading: boolean;
  isPreviewLoading: boolean;
  totalFiltered: number;
  totalAll: number;
}

export function ConsultationsFilterBar({
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
      {/* Fila 1: Búsqueda, Rango con DatePickers y Botones de Acción */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Búsqueda por texto */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={filter.search}
            onChange={(e) => onChange((p) => ({ ...p, search: e.target.value }))}
            placeholder="Buscar por paciente, cédula o médico..."
            className="pl-9 text-xs h-9 bg-slate-50/50"
          />
        </div>

        {/* DatePickers Desde y Hasta */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 pl-2 flex items-center gap-1">
              <CalendarRange className="w-3.5 h-3.5 text-blue-600" />
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
                onClick={() => handleApplyPreset('all')}
                title="Limpiar fechas"
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Grupo de Acciones: Cargar Excel, Descargar Excel y Actualizar */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onTriggerUpload}
              disabled={isPreviewLoading}
              className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 flex items-center gap-1.5 rounded-xl cursor-pointer shadow-xs"
              title="Cargar y validar planilla Excel de consultas"
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

      {/* Fila 2: Atajos de Semanas y Estado del Período Activo */}
      <div className="flex flex-wrap items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Filtro activo:</span>
          </div>
          <span className="font-semibold text-slate-800 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-lg text-[10px]">
            {filter.periodLabel}
          </span>
          <span className="text-slate-400">
            ({totalFiltered} de {totalAll} consultas)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 mr-1 hidden sm:inline text-[11px]">Semanas de Octubre:</span>
          <button
            type="button"
            onClick={() => handleApplyPreset('month')}
            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium transition cursor-pointer text-[10px]"
          >
            Mes Completo
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('sem1')}
            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium transition cursor-pointer text-[10px]"
          >
            Sem. 1 (1-7)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('sem2')}
            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium transition cursor-pointer text-[10px]"
          >
            Sem. 2 (8-14)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('sem3')}
            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium transition cursor-pointer text-[10px]"
          >
            Sem. 3 (15-21)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('sem4')}
            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium transition cursor-pointer text-[10px]"
          >
            Sem. 4 (22+)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('all')}
            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium transition cursor-pointer text-[10px]"
          >
            Ver Todo
          </button>
        </div>
      </div>
    </div>
  );
}
