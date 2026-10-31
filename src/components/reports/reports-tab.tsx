'use client';

import { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { notifyError, notifySuccess } from '@/components/dashboard/notify';
import { requestFile } from '@/lib/api-client';
import { formatLocalDate } from '@/lib/date-utils';
import { resolveExportFileName } from '@/lib/export-file-name';
import { saveBlob } from '@/lib/save-blob';

type ReportFormat = 'xlsx' | 'pdf';

const FORMATS = {
  xlsx: { endpoint: 'excel', label: 'Excel', extension: 'xlsx', pending: 'Generando planilla…' },
  pdf: { endpoint: 'pdf', label: 'PDF', extension: 'pdf', pending: 'Generando reporte…' },
} as const;

export function ReportsTab() {
  const [reportStartDate, setReportStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return formatLocalDate(d);
  });
  const [reportEndDate, setReportEndDate] = useState<string>(() => {
    return formatLocalDate();
  });
  const [pendingFormat, setPendingFormat] = useState<ReportFormat | null>(null);

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

  /**
   * Downloads through fetch instead of a plain anchor: an anchor with
   * `target="_blank"` can only fail by opening a tab with a raw JSON error or a
   * framework page, which the user reads as "the app is broken".
   */
  const handleDownload = async (format: ReportFormat) => {
    if (reportEndDate < reportStartDate) {
      notifyError('La fecha inicial no puede ser posterior a la final', 'Rango de fechas inválido', {
        id: 'report-export',
      });
      return;
    }

    const { endpoint, label, extension } = FORMATS[format];
    setPendingFormat(format);

    try {
      const query = new URLSearchParams({
        startDate: reportStartDate,
        endDate: reportEndDate,
      }).toString();
      const file = await requestFile(
        `/api/reports/${endpoint}?${query}`,
        `Error al generar el reporte ${label}`
      );
      const fileName = resolveExportFileName(file.headers, {
        module: 'reporte',
        startDate: reportStartDate,
        endDate: reportEndDate,
        extension,
      });

      saveBlob(file.blob, fileName);
      notifySuccess(`Reporte ${label} generado`, { id: 'report-export' });
    } catch (error) {
      notifyError(error, `Error al generar el reporte ${label}`, { id: 'report-export' });
    } finally {
      setPendingFormat(null);
    }
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
            type="button"
            onClick={() => handleDownload('xlsx')}
            disabled={pendingFormat !== null}
            aria-busy={pendingFormat === 'xlsx'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer transition font-semibold h-10 px-5"
          >
            {pendingFormat === 'xlsx' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" aria-hidden="true" />
            )}
            {pendingFormat === 'xlsx' ? FORMATS.xlsx.pending : 'Descargar Excel (.xlsx)'}
          </Button>

          <Button
            type="button"
            onClick={() => handleDownload('pdf')}
            disabled={pendingFormat !== null}
            aria-busy={pendingFormat === 'pdf'}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xs cursor-pointer transition font-semibold h-10 px-5"
          >
            {pendingFormat === 'pdf' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
            )}
            {pendingFormat === 'pdf' ? FORMATS.pdf.pending : 'Descargar PDF (.pdf)'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
