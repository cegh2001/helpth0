'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';

export interface PreviewRow {
  date: string;
  patientName: string;
  patientCedula: string | null;
  doctorName: string;
  specialty: string;
  amountUsd: number;
  totalBs: number;
  status: string;
  isDuplicate: boolean;
}

export interface PreviewSummary {
  totalParsed: number;
  newRowsCount: number;
  duplicateCount: number;
  totalAmountUsd: number;
  totalAmountBs: number;
  uniqueDoctors: string[];
  uniqueSpecialties: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: PreviewRow[];
  summary: PreviewSummary | null;
  onConfirm: () => void;
  isConfirming: boolean;
}

export function ConsultationsPreviewDialog({
  open,
  onOpenChange,
  rows,
  summary,
  onConfirm,
  isConfirming,
}: Props) {
  if (!summary) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <span>Previsualización y Validación de Datos</span>
          </DialogTitle>
          <DialogDescription>
            Revisá los registros detectados antes de guardarlos. Los duplicados se ignorarán
            automáticamente para proteger la integridad de los datos.
          </DialogDescription>
        </DialogHeader>

        {/* Resumen de Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
          <div className="p-3 bg-slate-100 rounded-lg">
            <div className="text-xs text-slate-500 font-medium">Filas en archivo</div>
            <div className="text-lg font-bold text-slate-900">{summary.totalParsed}</div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Nuevos a guardar
            </div>
            <div className="text-lg font-bold text-emerald-800">{summary.newRowsCount}</div>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-xs text-amber-700 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Duplicados (a omitir)
            </div>
            <div className="text-lg font-bold text-amber-800">{summary.duplicateCount}</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs text-blue-700 font-medium">Total Divisas ($)</div>
            <div className="text-lg font-bold text-blue-800">${summary.totalAmountUsd}</div>
          </div>
        </div>

        {/* Tabla con Scroll */}
        <div className="flex-1 overflow-auto border border-slate-200 rounded-lg text-xs">
          <table className="w-full border-collapse">
            <thead className="bg-slate-100 sticky top-0 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-2 text-left">Estado</th>
                <th className="p-2 text-left">Fecha</th>
                <th className="p-2 text-left">Paciente</th>
                <th className="p-2 text-left">Cédula</th>
                <th className="p-2 text-left">Médico</th>
                <th className="p-2 text-left">Especialidad</th>
                <th className="p-2 text-right">Bs</th>
                <th className="p-2 text-right">$</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={row.isDuplicate ? 'bg-amber-50/50 text-slate-400' : 'hover:bg-slate-50'}
                >
                  <td className="p-2">
                    {row.isDuplicate ? (
                      <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                        Duplicado
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-600 text-white">Nuevo</Badge>
                    )}
                  </td>
                  <td className="p-2 whitespace-nowrap">{row.date}</td>
                  <td className="p-2 font-medium">{row.patientName}</td>
                  <td className="p-2">{row.patientCedula || '-'}</td>
                  <td className="p-2 whitespace-nowrap">{row.doctorName}</td>
                  <td className="p-2 whitespace-nowrap">{row.specialty}</td>
                  <td className="p-2 text-right font-mono">{row.totalBs.toFixed(2)}</td>
                  <td className="p-2 text-right font-mono font-medium">${row.amountUsd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={summary.newRowsCount === 0 || isConfirming}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isConfirming
              ? 'Guardando...'
              : `Confirmar e Importar (${summary.newRowsCount} nuevos)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
