'use client';

import React, { useState, useMemo } from 'react';
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
import type { ConsultationItem } from './consultation-item';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultations: ConsultationItem[];
  defaultStartDate?: string;
  defaultEndDate?: string;
  defaultPeriod?: string;
  onConfirmExport: (range: { startDate?: string; endDate?: string; period: string }) => void;
  isExporting: boolean;
}

interface FormProps {
  consultations: ConsultationItem[];
  defaultStartDate: string;
  defaultEndDate: string;
  defaultPeriod: string;
  onConfirmExport: (range: { startDate?: string; endDate?: string; period: string }) => void;
  onClose: () => void;
  isExporting: boolean;
}

function ExportDialogForm({
  consultations,
  defaultStartDate,
  defaultEndDate,
  defaultPeriod,
  onConfirmExport,
  onClose,
  isExporting,
}: FormProps) {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [periodTitle, setPeriodTitle] = useState(defaultPeriod || 'OCTUBRE 2026');

  // Count matching consultations in selected range
  const matchingCount = useMemo(() => {
    return consultations.filter((c) => {
      if (startDate && c.date < startDate) return false;
      if (endDate && c.date > endDate) return false;
      return true;
    }).length;
  }, [consultations, startDate, endDate]);

  const handleApplyPreset = (preset: 'month' | 'sem1' | 'sem2' | 'sem3' | 'sem4' | 'all') => {
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      setPeriodTitle('HISTORICO COMPLETO');
      return;
    }

    const baseYear = 2026;
    const baseMonth = 10;
    const mStr = String(baseMonth).padStart(2, '0');
    const lastDay = 31;

    if (preset === 'month') {
      setStartDate(`${baseYear}-${mStr}-01`);
      setEndDate(`${baseYear}-${mStr}-${lastDay}`);
      setPeriodTitle('OCTUBRE 2026');
    } else if (preset === 'sem1') {
      setStartDate(`${baseYear}-${mStr}-01`);
      setEndDate(`${baseYear}-${mStr}-07`);
      setPeriodTitle('SEMANA 1 OCTUBRE 2026');
    } else if (preset === 'sem2') {
      setStartDate(`${baseYear}-${mStr}-08`);
      setEndDate(`${baseYear}-${mStr}-14`);
      setPeriodTitle('SEMANA 2 OCTUBRE 2026');
    } else if (preset === 'sem3') {
      setStartDate(`${baseYear}-${mStr}-15`);
      setEndDate(`${baseYear}-${mStr}-21`);
      setPeriodTitle('SEMANA 3 OCTUBRE 2026');
    } else if (preset === 'sem4') {
      setStartDate(`${baseYear}-${mStr}-22`);
      setEndDate(`${baseYear}-${mStr}-${lastDay}`);
      setPeriodTitle('SEMANA 4 OCTUBRE 2026');
    }
  };

  const handleDownload = () => {
    onConfirmExport({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      period: periodTitle.trim() || 'CONSULTAS',
    });
    onClose();
  };

  return (
    <>
      <DialogHeader className="space-y-2">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <DialogTitle className="text-lg font-bold text-slate-900">
          Descargar Planilla Excel con Resumen
        </DialogTitle>
        <DialogDescription className="text-xs text-slate-500">
          Definí el período que querés exportar. El archivo incluirá las consultas filtradas,
          el consolidado por especialidad médica y la distribución semanal con fórmulas automáticas.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-2">
        {/* Atajos Rápidos */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-600">Atajos rápidos:</Label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleApplyPreset('month')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
            >
              Mes Completo (Oct 2026)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('sem1')}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              Sem. 1 (1-7)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('sem2')}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              Sem. 2 (8-14)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('sem3')}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              Sem. 3 (15-21)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('sem4')}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              Sem. 4 (22+)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('all')}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              Todo
            </button>
          </div>
        </div>

        {/* Date Pickers Desde y Hasta */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              <span>Fecha Desde:</span>
            </Label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="Inicio (opcional)"
              className="w-full h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              <span>Fecha Hasta:</span>
            </Label>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="Fin (opcional)"
              className="w-full h-9 text-xs"
            />
          </div>
        </div>

        {/* Resumen del alcance */}
        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs flex items-center justify-between text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>{matchingCount}</strong> consultas incluidas para exportación
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
            {startDate || 'Inicio'} → {endDate || 'Fin'}
          </span>
        </div>
      </div>

      <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          className="text-xs"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleDownload}
          disabled={isExporting || matchingCount === 0}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 px-4"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Generando Excel...' : `Exportar (${matchingCount} registros)`}</span>
        </Button>
      </DialogFooter>
    </>
  );
}

export function ExportConsultationsDialog({
  open,
  onOpenChange,
  consultations,
  defaultStartDate = '',
  defaultEndDate = '',
  defaultPeriod = 'OCTUBRE 2026',
  onConfirmExport,
  isExporting,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-6 shadow-2xl border-slate-200">
        {open && (
          <ExportDialogForm
            consultations={consultations}
            defaultStartDate={defaultStartDate}
            defaultEndDate={defaultEndDate}
            defaultPeriod={defaultPeriod}
            onConfirmExport={onConfirmExport}
            onClose={() => onOpenChange(false)}
            isExporting={isExporting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
