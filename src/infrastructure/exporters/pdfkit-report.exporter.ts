import PDFDocument from 'pdfkit';
import { ClinicReportData, ReportExporterPort } from '@/core/application/ports/report-exporter.port';

export class PdfKitReportExporter implements ReportExporterPort {
  async exportToExcel(data: ClinicReportData): Promise<Buffer> {
    throw new Error('Use ExcelJsReportExporter for Excel generation');
  }

  async exportToPdf(data: ClinicReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));

        // Header
        doc
          .rect(40, 40, 515, 60)
          .fill('#1E3A8A');

        doc
          .fillColor('#FFFFFF')
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('HELPTH0 CLINIC REPORT', 55, 52);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text('Doctor Shifts and Patient Headcount Summary', 55, 76);

        // Metadata box
        doc
          .fillColor('#1E293B')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Report Period:', 40, 115)
          .font('Helvetica')
          .text(`${data.startDate}  to  ${data.endDate}`, 130, 115);

        doc
          .font('Helvetica-Bold')
          .text('Generated At:', 340, 115)
          .font('Helvetica')
          .text(data.generatedAt.toISOString().replace('T', ' ').substring(0, 19), 420, 115);

        // KPI Summary cards
        // Card 1: Total Patients
        doc
          .roundedRect(40, 135, 250, 60, 6)
          .fillAndStroke('#F1F5F9', '#CBD5E1');

        doc
          .fillColor('#64748B')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('TOTAL PATIENTS SEEN', 55, 145);

        doc
          .fillColor('#0F172A')
          .fontSize(22)
          .font('Helvetica-Bold')
          .text(String(data.totalPatientsPeriod), 55, 162);

        // Card 2: Active Doctors
        doc
          .roundedRect(305, 135, 250, 60, 6)
          .fillAndStroke('#F1F5F9', '#CBD5E1');

        doc
          .fillColor('#64748B')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('DOCTORS RECORDED', 320, 145);

        doc
          .fillColor('#0F172A')
          .fontSize(22)
          .font('Helvetica-Bold')
          .text(String(data.doctors.length), 320, 162);

        // Doctors Table
        let y = 215;
        doc
          .fillColor('#0F172A')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Doctor Summary Breakdown', 40, y);

        y += 20;

        // Table Header
        doc
          .rect(40, y, 515, 22)
          .fill('#2563EB');

        doc
          .fillColor('#FFFFFF')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('Doctor Name', 45, y + 6)
          .text('Specialty', 180, y + 6)
          .text('Weekly Shift Schedule', 290, y + 6)
          .text('Patients', 490, y + 6, { width: 60, align: 'right' });

        y += 22;

        // Table Rows
        let isAlternate = false;
        for (const docRow of data.doctors) {
          if (y > 740) {
            doc.addPage({ margin: 40, size: 'A4' });
            y = 40;
          }

          if (isAlternate) {
            doc.rect(40, y, 515, 24).fill('#F8FAFC');
          }

          doc
            .fillColor('#1E293B')
            .fontSize(9)
            .font('Helvetica-Bold')
            .text(docRow.doctorName, 45, y + 6, { width: 130, ellipsis: true })
            .font('Helvetica')
            .text(docRow.specialty, 180, y + 6, { width: 105, ellipsis: true })
            .text(docRow.schedulesSummary, 290, y + 6, { width: 195, ellipsis: true })
            .font('Helvetica-Bold')
            .text(String(docRow.totalPatients), 490, y + 6, { width: 60, align: 'right' });

          y += 24;
          isAlternate = !isAlternate;
        }

        // Total Line
        doc
          .rect(40, y, 515, 24)
          .fill('#E2E8F0');

        doc
          .fillColor('#0F172A')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('TOTAL', 45, y + 6)
          .text(String(data.totalPatientsPeriod), 490, y + 6, { width: 60, align: 'right' });

        // Footer
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#94A3B8')
          .text('helpth0 Clinic Management System - Confidential Report', 40, 780, {
            align: 'center',
            width: 515,
          });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
