import ExcelJS from 'exceljs';
import { ClinicReportData, ReportExporterPort } from '@/core/application/ports/report-exporter.port';

export class ExcelJsReportExporter implements ReportExporterPort {
  async exportToExcel(data: ClinicReportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'helpth0 Clinic System';
    workbook.created = data.generatedAt;

    // Sheet 1: Summary
    const summarySheet = workbook.addWorksheet('Clinic Summary', {
      views: [{ showGridLines: true }],
    });

    // Header styling
    summarySheet.mergeCells('A1:D1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'HELPTH0 CLINIC REPORT';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }, // Deep blue
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    summarySheet.getRow(1).height = 30;

    summarySheet.addRow([]);
    summarySheet.addRow(['Period:', `${data.startDate} to ${data.endDate}`]);
    summarySheet.addRow(['Generated:', data.generatedAt.toISOString().replace('T', ' ').substring(0, 19)]);
    summarySheet.addRow(['Total Patients:', data.totalPatientsPeriod]);
    summarySheet.getRow(3).font = { bold: true };
    summarySheet.getRow(4).font = { bold: true };
    summarySheet.getRow(5).font = { bold: true, size: 12 };

    summarySheet.addRow([]);

    // Table Header
    const tableHeader = summarySheet.addRow([
      'Doctor Name',
      'Specialty',
      'Weekly Schedule',
      'Total Patients',
    ]);
    tableHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    tableHeader.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }, // Blue
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

    // Totals Row
    const totalRow = summarySheet.addRow([
      'TOTAL',
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
      { width: 25 },
      { width: 22 },
      { width: 40 },
      { width: 16 },
    ];

    // Sheet 2: Daily Breakdown
    const detailSheet = workbook.addWorksheet('Daily Breakdown', {
      views: [{ showGridLines: true }],
    });

    const detailHeader = detailSheet.addRow([
      'Date',
      'Doctor',
      'Specialty',
      'Patients Seen',
      'Notes',
    ]);
    detailHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    detailHeader.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0D9488' }, // Teal
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
      { width: 15 },
      { width: 25 },
      { width: 20 },
      { width: 16 },
      { width: 35 },
    ];

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  async exportToPdf(data: ClinicReportData): Promise<Buffer> {
    // Delegate to PdfKit exporter
    throw new Error('Use PdfKitReportExporter for PDF generation');
  }
}
