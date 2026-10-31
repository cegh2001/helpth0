'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  HeartHandshake,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface ReviewMetrics {
  totalParsed: number;
  newRowsCount: number;
  duplicateCount: number;
  rateDisplay: string;
  totalAmountBs: number;
  totalAmountUsd: number;
  totalExoneratedUsd: number;
  exoneratedPatientsCount: number;
}

interface Props {
  metrics: ReviewMetrics;
}

export function ReviewMetricsCards({ metrics }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="p-3">
          <span className="text-[11px] text-slate-500 font-medium">Filas en archivo</span>
          <p className="text-lg font-bold text-slate-900">{metrics.totalParsed}</p>
        </CardContent>
      </Card>

      <Card className="border-emerald-200 bg-emerald-50/40 shadow-2xs">
        <CardContent className="p-3">
          <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Nuevas a guardar
          </span>
          <p className="text-lg font-bold text-emerald-800">{metrics.newRowsCount}</p>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/40 shadow-2xs">
        <CardContent className="p-3">
          <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Duplicados
          </span>
          <p className="text-lg font-bold text-amber-800">{metrics.duplicateCount}</p>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="p-3">
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            Tasa BCV Ref.
          </span>
          <p className="text-sm font-bold text-slate-800 mt-1 truncate" title={metrics.rateDisplay}>
            {metrics.rateDisplay}
          </p>
        </CardContent>
      </Card>

      <Card className="border-emerald-200 bg-emerald-50/20 shadow-2xs">
        <CardContent className="p-3">
          <span className="text-[11px] text-slate-500 font-medium">Total en Bs</span>
          <p className="text-base font-bold text-emerald-700 mt-0.5 truncate">
            Bs {metrics.totalAmountBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="p-3">
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            Total Divisas ($)
          </span>
          <p className="text-lg font-bold text-blue-700">${metrics.totalAmountUsd.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card className="border-purple-200 bg-purple-50/30 shadow-2xs">
        <CardContent className="p-3">
          <span className="text-[11px] text-purple-700 font-medium flex items-center gap-1">
            <HeartHandshake className="w-3.5 h-3.5 text-purple-600" />
            Exonerado ($)
          </span>
          <p className="text-lg font-bold text-purple-800">
            ${metrics.totalExoneratedUsd.toFixed(2)}
            <span className="text-[10px] text-purple-600 ml-1 font-normal">
              ({metrics.exoneratedPatientsCount} pac.)
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
