import { describe, it, expect } from 'vitest';
import { ExcelJsReportExporter } from '@/infrastructure/exporters/exceljs-report.exporter';
import { PdfKitReportExporter } from '@/infrastructure/exporters/pdfkit-report.exporter';
import { ClinicReportData } from '@/core/application/ports/report-exporter.port';

describe('Report Exporters', () => {
  const sampleData: ClinicReportData = {
    startDate: '2026-09-01',
    endDate: '2026-09-18',
    generatedAt: new Date(),
    totalPatientsPeriod: 45,
    doctors: [
      {
        doctorId: 'doc-1',
        doctorName: 'Dr. John Watson',
        specialty: 'General Medicine',
        schedulesSummary: 'Mon: 08:00-14:00, Wed: 08:00-14:00',
        totalPatients: 25,
        dailyBreakdown: [
          { date: '2026-09-01', count: 12, notes: 'Routine checkups' },
          { date: '2026-09-03', count: 13, notes: null },
        ],
      },
      {
        doctorId: 'doc-2',
        doctorName: 'Dr. Gregory House',
        specialty: 'Diagnostics',
        schedulesSummary: 'Tue: 09:00-13:00, Thu: 09:00-13:00',
        totalPatients: 20,
        dailyBreakdown: [
          { date: '2026-09-02', count: 10, notes: 'Clinic cases' },
          { date: '2026-09-04', count: 10, notes: null },
        ],
      },
    ],
  };

  it('should generate a valid Excel (.xlsx) buffer with non-zero length', async () => {
    const exporter = new ExcelJsReportExporter();
    const buffer = await exporter.exportToExcel(sampleData);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // Standard zip/xlsx magic bytes: PK\x03\x04
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  it('should generate a valid PDF buffer with non-zero length and PDF header', async () => {
    const exporter = new PdfKitReportExporter();
    const buffer = await exporter.exportToPdf(sampleData);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // PDF magic bytes: %PDF-
    const header = buffer.subarray(0, 5).toString();
    expect(header).toBe('%PDF-');
  });
});
