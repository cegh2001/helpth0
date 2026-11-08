'use client';

import React, { useMemo, useState } from 'react';
import { Download, CalendarDays, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { buildDatePresets } from '@/lib/date-window';
import type { TherapySessionItem } from './therapy-session-item';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  therapies: TherapySessionItem[];
  defaultStartDate?: string;
  defaultEndDate?: string;
  defaultPeriod?: string;
  onConfirmExport: (range: { startDate?: string; endDate?: string; period: string }) => void;
  isExporting: boolean;
  referenceDate?: string;
}

interface FormProps {
  therapies: TherapySessionItem[];
  defaultStartDate: string;
  defaultEndDate: string;
  defaultPeriod?: string;
  onConfirmExport: (range: { startDate?: string; endDate?: string; period: string }) => void;
  onClose: () => void;
  isExporting: boolean;
  referenceDate?: string;
}

function ExportTherapiesForm({
  therapies,
  defaultStartDate,
  defaultEndDate,
  defaultPeriod,
  onConfirmExport,
  onClose,
  isExporting,
  referenceDate,
}: FormProps) {
  const { window, getPreset } = useMemo(
    () => buildDatePresets(referenceDate),
    [referenceDate]
  );
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [periodTitle, setPeriodTitle] = useState(() => {
    if (defaultPeriod && defaultPeriod !== 'Todo el Histórico') {
      return defaultPeriod;
    }
    return window.periodTitle;
  });

  const matchingCount = useMemo(
    () =>
      therapies.filter((item) => {
        if (startDate && item.date < startDate) return false;
        if (endDate && item.date > endDate) return false;
        return true;
      }).length,
    [therapies, startDate, endDate]
  );

  return (
    <>
      <div className="space-y-4 py-2">
        {/* Atajos Rápidos */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-600">Atajos rápidos:</Label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                const p = getPreset('month');
                setStartDate(p.startDate);
                setEndDate(p.endDate);
                setPeriodTitle(p.periodTitle);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition cursor-pointer"
            >
              {getPreset('month').buttonLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                const p = getPreset('sem1');
                setStartDate(p.startDate);
                setEndDate(p.endDate);
                setPeriodTitle(p.periodTitle);
              }}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              Sem. 1 (1-7)
            </button>
            <button
              type="button"
              onClick={() => {
                const p = getPreset('sem2');
                setStartDate(p.startDate);
                setEndDate(p.endDate);
                setPeriodTitle(p.periodTitle);
              }}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              Sem. 2 (8-14)
            </button>
            <button
              type="button"
              onClick={() => {
                const p = getPreset('sem3');
                setStartDate(p.startDate);
                setEndDate(p.endDate);
                setPeriodTitle(p.periodTitle);
              }}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              Sem. 3 (15-21)
            </button>
            <button
              type="button"
              onClick={() => {
                const p = getPreset('sem4');
                setStartDate(p.startDate);
                setEndDate(p.endDate);
                setPeriodTitle(p.periodTitle);
              }}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              Sem. 4 (22+)
            </button>
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setPeriodTitle('HISTÓRICO COMPLETO');
              }}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              Todo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Fecha Inicial</Label>
            <DatePicker value={startDate} onChange={setStartDate} placeholder="Desde" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Fecha Final</Label>
            <DatePicker value={endDate} onChange={setEndDate} placeholder="Hasta" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Título del Período en Reporte
          </Label>
          <input
            type="text"
            value={periodTitle}
            onChange={(e) => setPeriodTitle(e.target.value)}
            placeholder={`Ej: ${window.periodTitle}`}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
          />
        </div>

        <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-teal-600" />
            <span>Sesiones incluidas en el rango:</span>
          </div>
          <span className="font-bold text-sm bg-white px-2.5 py-0.5 rounded-md border border-teal-200 text-teal-700">
            {matchingCount} sesiones
          </span>
        </div>

        <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 space-y-1">
          <p className="font-semibold text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Estructura Unificada (1 sola hoja):
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-600 ml-1">
            <li>Detalle operativo por sesión con terapeuta, especialidad y día.</li>
            <li>Resumen por especialidad y distribución por profesional.</li>
            <li>Resumen semanal por método de cobro y condición de pago.</li>
          </ul>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" size="sm" onClick={onClose} disabled={isExporting}>
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={() =>
            onConfirmExport({
              startDate: startDate || undefined,
              endDate: endDate || undefined,
              period: periodTitle.trim() || 'PERIODO',
            })
          }
          disabled={matchingCount === 0 || isExporting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Generando Excel...' : `Exportar Excel (${matchingCount})`}
        </Button>
      </DialogFooter>
    </>
  );
}

export function ExportTherapiesDialog({
  open,
  onOpenChange,
  therapies,
  defaultStartDate = '',
  defaultEndDate = '',
  defaultPeriod,
  onConfirmExport,
  isExporting,
  referenceDate,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Exportar Control de Terapias a Excel</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Genera un archivo XLSX con el detalle de sesiones y los resúmenes consolidados.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <ExportTherapiesForm
            therapies={therapies}
            defaultStartDate={defaultStartDate}
            defaultEndDate={defaultEndDate}
            defaultPeriod={defaultPeriod}
            onConfirmExport={onConfirmExport}
            onClose={() => onOpenChange(false)}
            isExporting={isExporting}
            referenceDate={referenceDate}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
