'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ExamPreviewRow } from './exams-review-view';

interface Props {
  row: ExamPreviewRow;
  index: number;
  onChange: (index: number, field: keyof ExamPreviewRow, value: unknown) => void;
}

function getPaymentBadge(row: ExamPreviewRow) {
  if (row.exonerationPercent === 100) {
    return <Badge variant="outline" className="text-slate-500 bg-slate-50 text-[10px]">Exonerado</Badge>;
  }
  const parts: string[] = [];
  if (row.amountPointBs > 0) parts.push('Punto');
  if (row.amountMobileBs > 0) parts.push('P. Móvil');
  if (row.amountCashBs > 0) parts.push('Efectivo');

  if (parts.length === 0) {
    return row.amountUsd > 0
      ? <Badge variant="outline" className="text-blue-700 bg-blue-50 text-[10px]">Divisas ($)</Badge>
      : <span className="text-slate-400 text-xs">-</span>;
  }
  if (parts.length === 1) {
    return <Badge variant="outline" className="text-slate-700 bg-slate-50 text-[10px]">{parts[0]}</Badge>;
  }
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
      Mixto
    </span>
  );
}

export function ExamReviewTableRow({ row, index, onChange }: Props) {
  return (
    <tr className={row.isDuplicate ? 'bg-amber-50/40 text-slate-400' : 'hover:bg-slate-50/70 transition'}>
      <td className="p-2.5 font-mono text-slate-400">{index + 1}</td>
      <td className="p-2.5">
        {row.isDuplicate ? (
          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[10px]">
            Duplicado
          </Badge>
        ) : (
          <Badge className="bg-emerald-600 text-white text-[10px]">Nuevo</Badge>
        )}
      </td>
      <td className="p-2.5 whitespace-nowrap font-medium text-slate-700">{row.date}</td>
      <td className="p-2">
        <Input
          value={row.patientName}
          onChange={(e) => onChange(index, 'patientName', e.target.value)}
          className="h-7 text-xs font-semibold px-2 bg-white min-w-36"
        />
      </td>
      <td className="p-2">
        <Input
          value={row.patientCedula || ''}
          placeholder="Sin Cédula"
          onChange={(e) => onChange(index, 'patientCedula', e.target.value)}
          className="h-7 text-xs font-mono px-2 bg-white w-28"
        />
      </td>
      <td className="p-2">
        <Input
          value={row.patientBirthDate || ''}
          placeholder="AAAA-MM-DD"
          onChange={(e) => onChange(index, 'patientBirthDate', e.target.value)}
          className="h-7 text-xs font-mono px-2 bg-white w-28"
        />
      </td>
      <td className="p-2">
        <Input
          value={row.examName || ''}
          placeholder="(Estudio/Examen)"
          onChange={(e) => onChange(index, 'examName', e.target.value)}
          className="h-7 text-xs px-2 bg-white min-w-28"
        />
      </td>
      <td className="p-2.5 text-center whitespace-nowrap">{getPaymentBadge(row)}</td>
      <td className="p-2">
        <Input
          type="number"
          step="0.01"
          value={row.bcvRate || ''}
          onChange={(e) => onChange(index, 'bcvRate', parseFloat(e.target.value) || 0)}
          className="h-7 text-xs text-right font-mono px-2 bg-white w-24"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          step="0.01"
          value={row.totalBs || ''}
          onChange={(e) => onChange(index, 'totalBs', parseFloat(e.target.value) || 0)}
          className="h-7 text-xs text-right font-mono px-2 bg-white w-28"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          step="0.01"
          value={row.amountUsd || ''}
          onChange={(e) => onChange(index, 'amountUsd', parseFloat(e.target.value) || 0)}
          className="h-7 text-xs text-right font-mono font-bold text-blue-700 px-2 bg-white w-20"
        />
      </td>
      <td className="p-2">
        <Input
          value={row.observations || ''}
          placeholder="Observaciones"
          onChange={(e) => onChange(index, 'observations', e.target.value)}
          className="h-7 text-xs px-2 bg-white min-w-32"
        />
      </td>
    </tr>
  );
}
