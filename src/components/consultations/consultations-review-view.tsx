'use client';

import React from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  HeartHandshake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export interface PreviewRow {
  date: string;
  patientName: string;
  patientCedula: string | null;
  doctorName: string;
  specialty: string;
  bcvRate: number;
  amountUsd: number;
  totalBs: number;
  status: string;
  exonerationPercent: number;
  exoneratedAmountUsd: number;
  isDuplicate: boolean;
}

export interface PreviewSummary {
  totalParsed: number;
  newRowsCount: number;
  duplicateCount: number;
  totalAmountUsd: number;
  totalAmountBs: number;
  totalExoneratedUsd: number;
  exoneratedPatientsCount: number;
  averageBcvRate: number;
  minBcvRate: number;
  maxBcvRate: number;
  uniqueDoctors: string[];
  uniqueSpecialties: string[];
}

interface Props {
  fileName: string;
  rows: PreviewRow[];
  summary: PreviewSummary | null;
  onCancel: () => void;
  onConfirm: () => void;
  isConfirming: boolean;
}

export function ConsultationsReviewView({
  fileName,
  rows,
  summary,
  onCancel,
  onConfirm,
  isConfirming,
}: Props) {
  if (!summary) return null;

  const rateDisplay =
    summary.minBcvRate > 0 && summary.maxBcvRate > summary.minBcvRate
      ? `Bs ${summary.minBcvRate.toFixed(2)} - ${summary.maxBcvRate.toFixed(2)}`
      : summary.averageBcvRate > 0
        ? `Bs ${summary.averageBcvRate.toFixed(2)}`
        : '-';

  return (
    <div className="space-y-6">
      {/* Encabezado y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-xs -ml-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver al Listado
            </Button>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-semibold text-slate-500 truncate max-w-xs">{fileName}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <span>Revisión y Validación de Consultas</span>
          </h2>
          <p className="text-xs text-slate-500">
            Revisá los datos antes de guardarlos. Los duplicados se omitirán automáticamente para no repetir registros.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isConfirming}>
            Descartar
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={summary.newRowsCount === 0 || isConfirming}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4"
          >
            {isConfirming
              ? 'Guardando en Base de Datos...'
              : `Confirmar e Importar (${summary.newRowsCount} nuevas)`}
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI de la Planilla */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[11px] text-slate-500 font-medium">Filas en archivo</span>
            <p className="text-lg font-bold text-slate-900">{summary.totalParsed}</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/40 shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Nuevas a guardar
            </span>
            <p className="text-lg font-bold text-emerald-800">{summary.newRowsCount}</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40 shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Duplicados omitidos
            </span>
            <p className="text-lg font-bold text-amber-800">{summary.duplicateCount}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              Tasa BCV Ref.
            </span>
            <p className="text-sm font-bold text-slate-800 mt-1 truncate" title={rateDisplay}>
              {rateDisplay}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Total Divisas ($)
            </span>
            <p className="text-lg font-bold text-blue-700">${summary.totalAmountUsd.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/30 shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[11px] text-purple-700 font-medium flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-purple-600" />
              Total Exonerado ($)
            </span>
            <p className="text-lg font-bold text-purple-800">
              ${summary.totalExoneratedUsd.toFixed(2)}
              <span className="text-[10px] text-purple-600 ml-1 font-normal">
                ({summary.exoneratedPatientsCount} pac.)
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla Ancha a Pantalla Completa */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold z-10">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Paciente</th>
                <th className="p-3">Cédula</th>
                <th className="p-3">Médico</th>
                <th className="p-3">Especialidad</th>
                <th className="p-3 text-right">Tasa BCV</th>
                <th className="p-3 text-right">Bs Pagados</th>
                <th className="p-3 text-right">Divisas ($)</th>
                <th className="p-3 text-center">Exoneración</th>
                <th className="p-3">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={row.isDuplicate ? 'bg-amber-50/40 text-slate-400' : 'hover:bg-slate-50/80 transition'}
                >
                  <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                  <td className="p-3">
                    {row.isDuplicate ? (
                      <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[10px]">
                        Duplicado
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-600 text-white text-[10px]">Nuevo</Badge>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap font-medium text-slate-700">{row.date}</td>
                  <td className="p-3 font-semibold text-slate-900">{row.patientName}</td>
                  <td className="p-3 text-slate-600 font-mono">{row.patientCedula || '-'}</td>
                  <td className="p-3 text-slate-700 whitespace-nowrap">{row.doctorName}</td>
                  <td className="p-3 text-slate-600 whitespace-nowrap">{row.specialty}</td>
                  <td className="p-3 text-right font-mono text-slate-700">
                    {row.bcvRate > 0 ? `Bs ${row.bcvRate.toFixed(2)}` : '-'}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-800">
                    {row.totalBs > 0 ? row.totalBs.toFixed(2) : '-'}
                  </td>
                  <td className="p-3 text-right font-mono font-medium text-blue-700">${row.amountUsd}</td>
                  <td className="p-3 text-center whitespace-nowrap">
                    {row.exonerationPercent > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                        {row.exonerationPercent}% (${row.exoneratedAmountUsd})
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
