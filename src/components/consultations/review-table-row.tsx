'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PreviewRow } from './consultations-review-view';

interface Props {
  row: PreviewRow;
  index: number;
  onChange: (index: number, field: keyof PreviewRow, value: unknown) => void;
}

function getPaymentBadge(row: PreviewRow) {
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

export function ReviewTableRow({ row, index, onChange }: Props) {
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
          className="h-7 text-xs font-semibold px-2 bg-white"
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
          value={row.doctorName}
          onChange={(e) => onChange(index, 'doctorName', e.target.value)}
          className="h-7 text-xs px-2 bg-white"
        />
      </td>
      <td className="p-2">
        <Input
          value={row.specialty}
          onChange={(e) => onChange(index, 'specialty', e.target.value)}
          className="h-7 text-xs px-2 bg-white"
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
          step="1"
          value={row.amountUsd || ''}
          onChange={(e) => onChange(index, 'amountUsd', parseFloat(e.target.value) || 0)}
          className="h-7 text-xs text-right font-bold text-blue-700 px-2 bg-white w-20"
        />
      </td>
      <td className="p-2">
        <div className="flex items-center justify-center gap-1">
          <Input
            type="number"
            min="0"
            max="100"
            value={row.exonerationPercent}
            onChange={(e) => onChange(index, 'exonerationPercent', e.target.value)}
            className="h-7 text-xs text-center font-mono px-1 bg-white w-14"
          />
          <span className="text-slate-400 text-xs">%</span>
        </div>
      </td>
      <td className="p-2.5 text-right font-mono font-bold text-purple-700 whitespace-nowrap">
        {row.exoneratedAmountUsd > 0 ? `$${row.exoneratedAmountUsd.toFixed(2)}` : <span className="text-slate-300">-</span>}
      </td>
      <td className="p-2.5 whitespace-nowrap">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {row.status}
        </span>
      </td>
    </tr>
  );
}
