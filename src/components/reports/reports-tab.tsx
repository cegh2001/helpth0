'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { formatLocalDate } from '@/lib/date-utils';

export function ReportsTab() {
  const [reportStartDate, setReportStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return formatLocalDate(d);
  });
  const [reportEndDate, setReportEndDate] = useState<string>(() => {
    return formatLocalDate();
  });

  const setRangeToday = () => {
    const today = formatLocalDate();
    setReportStartDate(today);
    setReportEndDate(today);
  };

  const setRangeLast7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    setReportStartDate(formatLocalDate(start));
    setReportEndDate(formatLocalDate(end));
  };

  const setRangeThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setReportStartDate(formatLocalDate(start));
    setReportEndDate(formatLocalDate(now));
  };

  return (
    <Card className="shadow-xs border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Reportes de Turnos Médicos y Pacientes (Excel / PDF)</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Generá planillas de Excel (.xlsx) y reportes médicos impresos (.pdf) correspondientes al
          conteo diario de turnos y guardias del consultorio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Label className="text-xs font-semibold text-slate-600">Desde:</Label>
            <DatePicker
              value={reportStartDate}
              onChange={setReportStartDate}
              ariaLabel="Seleccionar fecha inicial del reporte"
              className="w-50"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Label className="text-xs font-semibold text-slate-600">Hasta:</Label>
            <DatePicker
              value={reportEndDate}
              onChange={setReportEndDate}
              ariaLabel="Seleccionar fecha final del reporte"
              className="w-50"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={setRangeToday}
              className="text-xs h-9 rounded-xl cursor-pointer hover:bg-slate-100 shadow-2xs"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={setRangeLast7Days}
              className="text-xs h-9 rounded-xl cursor-pointer hover:bg-slate-100 shadow-2xs"
            >
              Últimos 7 Días
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={setRangeThisMonth}
              className="text-xs h-9 rounded-xl cursor-pointer hover:bg-slate-100 shadow-2xs"
            >
              Este Mes
            </Button>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap gap-4">
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer transition font-semibold h-10 px-5"
          >
            <a
              href={`/api/reports/excel?startDate=${reportStartDate}&endDate=${reportEndDate}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Descargar Excel (.xlsx)
            </a>
          </Button>

          <Button
            asChild
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xs cursor-pointer transition font-semibold h-10 px-5"
          >
            <a
              href={`/api/reports/pdf?startDate=${reportStartDate}&endDate=${reportEndDate}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText className="w-4 h-4 mr-2" />
              Descargar PDF (.pdf)
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
