import ExcelJS from 'exceljs';
import { ClinicReportData, ReportExporterPort } from '@/core/application/ports/report-exporter.port';

export class ExcelJsReportExporter implements ReportExporterPort {
  async exportToExcel(data: ClinicReportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Clínico helpth0';
    workbook.created = data.generatedAt;

    // Hoja 1: Resumen
    const summarySheet = workbook.addWorksheet('Resumen de Clínica', {
      views: [{ showGridLines: true }],
    });

    // Encabezado
    summarySheet.mergeCells('A1:D1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'REPORTE CLÍNICO HELPTH0';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    summarySheet.getRow(1).height = 30;

    summarySheet.addRow([]);
    summarySheet.addRow(['Período:', `${data.startDate} al ${data.endDate}`]);
    summarySheet.addRow(['Fecha de Emisión:', data.generatedAt.toISOString().replace('T', ' ').substring(0, 19)]);
    summarySheet.addRow(['Total Pacientes:', data.totalPatientsPeriod]);
    summarySheet.getRow(3).font = { bold: true };
    summarySheet.getRow(4).font = { bold: true };
    summarySheet.getRow(5).font = { bold: true, size: 12 };

    summarySheet.addRow([]);

    // Encabezados de Tabla
    const tableHeader = summarySheet.addRow([
      'Médico',
      'Especialidad',
      'Horario Semanal',
      'Total Pacientes',
    ]);
    tableHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    tableHeader.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    tableHeader.height = 24;

    for (const doc of data.doctors) {
      const row = summarySheet.addRow([
        doc.doctorName,
        doc.specialty,
        doc.schedulesSummary,
        doc.totalPatients,
      ]);
      row.getCell(4).alignment = { horizontal: 'center' };
    }

    // Fila de Totales
    const totalRow = summarySheet.addRow([
      'TOTAL GENERAL',
      '',
      '',
      data.totalPatientsPeriod,
    ]);
    totalRow.font = { bold: true };
    totalRow.getCell(4).alignment = { horizontal: 'center' };
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' },
      };
    });

    summarySheet.columns = [
      { width: 28 },
      { width: 24 },
      { width: 45 },
      { width: 18 },
    ];

    // Hoja 2: Desglose Diario
    const detailSheet = workbook.addWorksheet('Desglose Diario', {
      views: [{ showGridLines: true }],
    });

    const detailHeader = detailSheet.addRow([
      'Fecha',
      'Médico',
      'Especialidad',
      'Pacientes Atendidos',
      'Observaciones',
    ]);
    detailHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    detailHeader.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0D9488' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    detailHeader.height = 24;

    for (const doc of data.doctors) {
      for (const item of doc.dailyBreakdown) {
        const row = detailSheet.addRow([
          item.date,
          doc.doctorName,
          doc.specialty,
          item.count,
          item.notes || '',
        ]);
        row.getCell(4).alignment = { horizontal: 'center' };
      }
    }

    detailSheet.columns = [
      { width: 16 },
      { width: 28 },
      { width: 24 },
      { width: 20 },
      { width: 35 },
    ];

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  async exportToPdf(data: ClinicReportData): Promise<Buffer> {
    throw new Error('Use PdfKitReportExporter for PDF generation');
  }
}
