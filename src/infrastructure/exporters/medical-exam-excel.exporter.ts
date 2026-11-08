import ExcelJS from 'exceljs';
import { MedicalExam } from '@/core/domain/entities/medical-exam.entity';
import { MedicalExamExporterPort } from '@/core/application/ports/medical-exam-exporter.port';
import { appendStandardExcelSummary } from './standard-excel-summary.builder';
import { formatDisplayDate } from '@/lib/date-utils';

export { type MedicalExamExporterPort };
export type MedicalExamExcelExporter = MedicalExamExporterPort;

export class ExcelJsMedicalExamExporter implements MedicalExamExcelExporter {
  async exportToExcel(exams: MedicalExam[], titlePeriod = 'HISTÓRICO COMPLETO'): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'helpth0';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Control de Exámenes', {
      views: [{ showGridLines: true }],
    });

    // 1. Column Definitions
    sheet.columns = [
      { key: 'index', width: 6 },
      { key: 'date', width: 13 },
      { key: 'name', width: 28 },
      { key: 'cedula', width: 14 },
      { key: 'birthDate', width: 18 },
      { key: 'phone', width: 16 },
      { key: 'address', width: 20 },
      { key: 'exams', width: 18 },
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
      'Fecha de Nacimiento',
      'Telefono',
      'Direccion',
      'Examenes',
      'Punto',
      'Pago Movil',
      'Efectivo',
      'Tasa BCV',
      'Divisas',
      'TOTAL',
      'OBSERVACIONES',
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
    exams.forEach((c, idx) => {
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
        formatDisplayDate(c.date),
        c.patientName,
        c.patientCedula ?? '',
        formatDisplayDate(c.patientBirthDate) || (c.patientBirthDate ?? ''),
        c.patientPhone ?? '',
        c.patientAddress ?? '',
        c.examName ?? '',
        c.amountPointBs > 0 ? c.amountPointBs : '',
        c.amountMobileBs > 0 ? c.amountMobileBs : '',
        c.amountCashBs > 0 ? c.amountCashBs : '',
        c.bcvRate > 0 ? c.bcvRate : '',
        effectiveUsd > 0 ? effectiveUsd : '',
        effectiveTotalBs > 0 ? effectiveTotalBs : '',
        c.observations ?? c.status,
      ]);

      row.alignment = { vertical: 'middle' };
      [9, 10, 11, 12, 14].forEach((colIdx) => {
        const cell = row.getCell(colIdx);
        if (typeof cell.value === 'number') {
          cell.numFmt = '#,##0.00';
        }
      });
    });

    // 4. Standardized Summary Section
    appendStandardExcelSummary(sheet, exams, 'EXÁMENES Y LABORATORIO', titlePeriod);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
