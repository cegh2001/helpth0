'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, RefreshCw } from 'lucide-react';

export interface ConsultationItem {
  id: string;
  date: string;
  patientName: string;
  patientCedula: string | null;
  patientPhone: string | null;
  patientAddress: string | null;
  doctorName: string;
  specialty: string;
  amountPointBs: number;
  amountMobileBs: number;
  amountCashBs: number;
  bcvRate: number;
  amountUsd: number;
  totalBs: number;
  status: string;
  observations: string | null;
}

interface Props {
  consultations: ConsultationItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onExport: () => void;
  isExporting: boolean;
}

export function ConsultationsTable({
  consultations,
  isLoading,
  onRefresh,
  onExport,
  isExporting,
}: Props) {
  const [search, setSearch] = useState('');

  const filtered = consultations.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.patientName.toLowerCase().includes(q) ||
      (c.patientCedula && c.patientCedula.includes(q)) ||
      c.doctorName.toLowerCase().includes(q) ||
      c.specialty.toLowerCase().includes(q) ||
      c.date.includes(q)
    );
  });

  const totalUsd = filtered.reduce((s, c) => s + c.amountUsd, 0);
  const totalBs = filtered.reduce((s, c) => s + c.totalBs, 0);

  return (
    <div className="space-y-4">
      {/* Barra de Herramientas y Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por paciente, cédula o médico..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>

          <Button
            size="sm"
            onClick={onExport}
            disabled={isExporting || consultations.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generando...' : 'Descargar Excel con Resumen'}</span>
          </Button>
        </div>
      </div>

      {/* Métricas Resumidas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500">Total Consultas Mostradas</span>
          <p className="text-base font-bold text-slate-800">{filtered.length}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500">Monto Facturado ($)</span>
          <p className="text-base font-bold text-blue-600">${totalUsd.toFixed(2)}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs col-span-2 sm:col-span-1">
          <span className="text-slate-500">Total en Bolívares (Bs)</span>
          <p className="text-base font-bold text-emerald-600">Bs {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[550px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Paciente</th>
                <th className="p-3">Cédula</th>
                <th className="p-3">Médico</th>
                <th className="p-3">Especialidad</th>
                <th className="p-3 text-right">Bs Facturados</th>
                <th className="p-3 text-right">Divisas ($)</th>
                <th className="p-3">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    {isLoading ? 'Cargando datos...' : 'No se encontraron consultas registradas.'}
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 text-slate-400 font-mono">{index + 1}</td>
                    <td className="p-3 whitespace-nowrap font-medium text-slate-700">{item.date}</td>
                    <td className="p-3 font-semibold text-slate-900">{item.patientName}</td>
                    <td className="p-3 text-slate-600">{item.patientCedula || 'Sin Cédula'}</td>
                    <td className="p-3 text-slate-700">{item.doctorName}</td>
                    <td className="p-3 text-slate-600">{item.specialty}</td>
                    <td className="p-3 text-right font-mono text-slate-800">
                      {item.totalBs > 0 ? item.totalBs.toFixed(2) : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-blue-700">
                      ${item.amountUsd}
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
      </div>
    </div>
  );
}
