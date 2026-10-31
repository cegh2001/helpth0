import ExcelJS from 'exceljs';
import { Consultation } from '@/core/domain/entities/consultation.entity';
import { ConsultationExporterPort } from '@/core/application/ports/consultation-exporter.port';

export { type ConsultationExporterPort };
export type ConsultationExcelExporter = ConsultationExporterPort;

function getWeekBucket(dateStr: string): string {
  // dateStr is "YYYY-MM-DD"
  const day = parseInt(dateStr.slice(8, 10), 10);
  if (day <= 7) return 'Semana 1';
  if (day <= 14) return 'Semana 2';
  if (day <= 21) return 'Semana 3';
  return 'Semana 4';
}

export class ExcelJsConsultationExporter implements ConsultationExcelExporter {
  async exportToExcel(consultations: Consultation[], titlePeriod = 'OCTUBRE 2026'): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'helpth0';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Consultas y Pagos', {
      views: [{ showGridLines: true }],
    });

    // 1. Column Definitions
    sheet.columns = [
      { key: 'index', width: 6 },
      { key: 'date', width: 13 },
      { key: 'name', width: 28 },
      { key: 'cedula', width: 14 },
      { key: 'address', width: 18 },
      { key: 'phone', width: 16 },
      { key: 'doctor', width: 28 },
      { key: 'specialty', width: 22 },
      { key: 'pointBs', width: 15 },
      { key: 'mobileBs', width: 15 },
      { key: 'cashBs', width: 14 },
      { key: 'bcvRate', width: 13 },
      { key: 'usd', width: 11 },
      { key: 'totalBs', width: 15 },
      { key: 'observations', width: 24 },
    ];

    // 2. Header Row
    const headerRow = sheet.addRow([
      '#',
      'Fecha',
      'Nombre y Apellido',
      'Cedula',
      'Direccion',
      'Telefono',
      'Medicos',
      'Consulta',
      'Punto',
      'Pago Movil',
      'Efectivo',
      'Tasa BCV',
      'Divisas',
      'TOTAL',
      'Observaciones',
    ]);

    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }, // Deep Blue
    };
    headerRow.height = 24;

    // 3. Data Rows
    consultations.forEach((c, idx) => {
      const paidBs = c.amountPointBs + c.amountMobileBs + c.amountCashBs;
      let effectiveTotalBs = c.totalBs > 0 ? c.totalBs : paidBs;
      let effectiveUsd = c.amountUsd;

      if (paidBs > 0) {
        if (effectiveUsd <= 0 && c.bcvRate > 0) {
          effectiveUsd = Number((paidBs / c.bcvRate).toFixed(2));
        }
      } else if (effectiveUsd > 0 && c.bcvRate > 0 && effectiveTotalBs <= 0) {
        effectiveTotalBs = Number((effectiveUsd * c.bcvRate).toFixed(2));
      }

      const row = sheet.addRow([
        idx + 1,
        c.date,
        c.patientName,
        c.patientCedula ?? '',
        c.patientAddress ?? '',
        c.patientPhone ?? '',
        c.doctorName,
        c.specialty,
        c.amountPointBs > 0 ? c.amountPointBs : '',
        c.amountMobileBs > 0 ? c.amountMobileBs : '',
        c.amountCashBs > 0 ? c.amountCashBs : '',
        c.bcvRate > 0 ? c.bcvRate : '',
        effectiveUsd > 0 ? effectiveUsd : '',
        effectiveTotalBs > 0 ? effectiveTotalBs : '',
        c.observations ?? c.status,
      ]);

      row.alignment = { vertical: 'middle' };
      // Format numeric columns
      [9, 10, 11, 12, 14].forEach((colIdx) => {
        const cell = row.getCell(colIdx);
        if (typeof cell.value === 'number') {
          cell.numFmt = '#,##0.00';
        }
      });
    });

    sheet.addRow([]); // Blank line

    // 4. Consolidated Summary by Specialty
    const summaryHeader = sheet.addRow([
      '',
      `RESUMEN CONSOLIDADO DE CONSULTAS Y PACIENTES - ${titlePeriod.toUpperCase()}`,
    ]);
    summaryHeader.font = { bold: true, size: 12, color: { argb: 'FF1E3A8A' } };

    const specialtySubHeader = sheet.addRow([
      '',
      'Especialidad',
      'Total Pacientes',
      'Tarifa Ref. ($)',
      'Total Facturado (Bs)',
      '% Pacientes',
    ]);
    specialtySubHeader.font = { bold: true };
    specialtySubHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };

    const specialtyMap = new Map<
      string,
      { count: number; totalBs: number; sampleUsd: number }
    >();

    consultations.forEach((c) => {
      const cur = specialtyMap.get(c.specialty) || { count: 0, totalBs: 0, sampleUsd: c.amountUsd };
      cur.count++;
      cur.totalBs += c.totalBs;
      if (c.amountUsd > 0) cur.sampleUsd = c.amountUsd;
      specialtyMap.set(c.specialty, cur);
    });

    const totalPatients = consultations.length;
    let grandTotalBs = 0;

    for (const [specialty, data] of specialtyMap.entries()) {
      grandTotalBs += data.totalBs;
      const pct = totalPatients > 0 ? ((data.count / totalPatients) * 100).toFixed(2) + '%' : '0%';
      const row = sheet.addRow([
        '',
        specialty,
        data.count,
        data.sampleUsd,
        data.totalBs,
        pct,
      ]);
      row.getCell(5).numFmt = '#,##0.00';
    }

    const totalRow = sheet.addRow([
      '',
      'TOTAL GENERAL',
      totalPatients,
      '',
      grandTotalBs,
      '100.00%',
    ]);
    totalRow.font = { bold: true };
    totalRow.getCell(5).numFmt = '#,##0.00';
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };

    sheet.addRow([]); // Blank line

    // 5. Weekly Distribution
    const weeklyHeader = sheet.addRow(['', 'DISTRIBUCIÓN SEMANAL DETALLADA']);
    weeklyHeader.font = { bold: true, size: 12, color: { argb: 'FF1E3A8A' } };

    const weeklySubHeader = sheet.addRow([
      '',
      'Semana',
      'Especialidad',
      'Pacientes',
      'Total Facturado (Bs)',
    ]);
    weeklySubHeader.font = { bold: true };
    weeklySubHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };

    // Group by (week, specialty)
    const weekMap = new Map<string, Map<string, { count: number; totalBs: number }>>();

    consultations.forEach((c) => {
      const week = getWeekBucket(c.date);
      if (!weekMap.has(week)) weekMap.set(week, new Map());
      const specMap = weekMap.get(week)!;
      const cur = specMap.get(c.specialty) || { count: 0, totalBs: 0 };
      cur.count++;
      cur.totalBs += c.totalBs;
      specMap.set(c.specialty, cur);
    });

    const sortedWeeks = Array.from(weekMap.keys()).sort();
    let accumulatedPatients = 0;
    let accumulatedBs = 0;

    for (const week of sortedWeeks) {
      const specMap = weekMap.get(week)!;
      for (const [specialty, data] of specMap.entries()) {
        accumulatedPatients += data.count;
        accumulatedBs += data.totalBs;
        const row = sheet.addRow(['', week, specialty, data.count, data.totalBs]);
        row.getCell(5).numFmt = '#,##0.00';
      }
    }

    const weeklyTotalRow = sheet.addRow([
      '',
      'TOTAL ACUMULADO SEMANAL',
      '',
      accumulatedPatients,
      accumulatedBs,
    ]);
    weeklyTotalRow.font = { bold: true };
    weeklyTotalRow.getCell(5).numFmt = '#,##0.00';
    weeklyTotalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };

    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }
}
