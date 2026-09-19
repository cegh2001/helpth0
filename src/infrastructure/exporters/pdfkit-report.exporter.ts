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

        // Cabecera
        doc
          .rect(40, 40, 515, 60)
          .fill('#1E3A8A');

        doc
          .fillColor('#FFFFFF')
          .fontSize(18)
          .font('Helvetica-Bold')
          .text('REPORTE CLÍNICO HELPTH0', 55, 52);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text('Resumen de Turnos Médicos y Conteo Diario de Pacientes', 55, 76);

        // Caja de Metadatos
        doc
          .fillColor('#1E293B')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Período del Reporte:', 40, 115)
          .font('Helvetica')
          .text(`${data.startDate}  al  ${data.endDate}`, 155, 115);

        doc
          .font('Helvetica-Bold')
          .text('Fecha de Emisión:', 330, 115)
          .font('Helvetica')
          .text(data.generatedAt.toISOString().replace('T', ' ').substring(0, 19), 430, 115);

        // Tarjetas de Métricas KPI
        // Tarjeta 1: Total Pacientes
        doc
          .roundedRect(40, 135, 250, 60, 6)
          .fillAndStroke('#F1F5F9', '#CBD5E1');

        doc
          .fillColor('#64748B')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('TOTAL PACIENTES ATENDIDOS', 55, 145);

        doc
          .fillColor('#0F172A')
          .fontSize(22)
          .font('Helvetica-Bold')
          .text(String(data.totalPatientsPeriod), 55, 162);

        // Tarjeta 2: Médicos Registrados
        doc
          .roundedRect(305, 135, 250, 60, 6)
          .fillAndStroke('#F1F5F9', '#CBD5E1');

        doc
          .fillColor('#64748B')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('MÉDICOS REGISTRADOS', 320, 145);

        doc
          .fillColor('#0F172A')
          .fontSize(22)
          .font('Helvetica-Bold')
          .text(String(data.doctors.length), 320, 162);

        // Tabla de Médicos
        let y = 215;
        doc
          .fillColor('#0F172A')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Resumen General por Médico', 40, y);

        y += 20;

        // Encabezado de la tabla
        doc
          .rect(40, y, 515, 22)
          .fill('#2563EB');

        doc
          .fillColor('#FFFFFF')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('Nombre del Médico', 45, y + 6)
          .text('Especialidad', 180, y + 6)
          .text('Turnos Semanales', 290, y + 6)
          .text('Pacientes', 490, y + 6, { width: 60, align: 'right' });

        y += 22;

        // Filas de la tabla
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

        // Fila Total
        doc
          .rect(40, y, 515, 24)
          .fill('#E2E8F0');

        doc
          .fillColor('#0F172A')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('TOTAL GENERAL', 45, y + 6)
          .text(String(data.totalPatientsPeriod), 490, y + 6, { width: 60, align: 'right' });

        y += 40;

        // Si queda poco espacio, agregar página
        if (y > 620) {
          doc.addPage({ margin: 40, size: 'A4' });
          y = 40;
        }

        doc
          .fillColor('#0F172A')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Desglose Detallado por Fecha y Turno', 40, y);

        y += 20;

        // Encabezado de la tabla de turnos
        doc
          .rect(40, y, 515, 22)
          .fill('#0D9488');

        doc
          .fillColor('#FFFFFF')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('Fecha', 45, y + 6)
          .text('Día', 110, y + 6)
          .text('Médico', 145, y + 6)
          .text('Turno', 280, y + 6)
          .text('Observaciones', 380, y + 6)
          .text('Pacientes', 490, y + 6, { width: 60, align: 'right' });

        y += 22;

        let hasBreakdownItems = false;
        let detailAlternate = false;

        for (const docRow of data.doctors) {
          for (const item of docRow.dailyBreakdown) {
            hasBreakdownItems = true;
            if (y > 740) {
              doc.addPage({ margin: 40, size: 'A4' });
              y = 40;
            }

            if (detailAlternate) {
              doc.rect(40, y, 515, 22).fill('#F8FAFC');
            }

            doc
              .fillColor('#1E293B')
              .fontSize(8.5)
              .font('Helvetica')
              .text(item.date, 45, y + 6, { width: 60 })
              .text(item.dayName, 110, y + 6, { width: 30 })
              .font('Helvetica-Bold')
              .text(docRow.doctorName, 145, y + 6, { width: 130, ellipsis: true })
              .font('Helvetica')
              .text(item.shiftTime, 280, y + 6, { width: 95, ellipsis: true })
              .text(item.notes || '—', 380, y + 6, { width: 105, ellipsis: true })
              .font('Helvetica-Bold')
              .text(String(item.count), 490, y + 6, { width: 60, align: 'right' });

            y += 22;
            detailAlternate = !detailAlternate;
          }
        }

        if (!hasBreakdownItems) {
          doc
            .fillColor('#64748B')
            .fontSize(9)
            .font('Helvetica-Oblique')
            .text('No se registraron atenciones en el período seleccionado.', 45, y + 10);
        }

        // Pie de Página
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#94A3B8')
          .text('helpth0 — Sistema de Gestión Clínica • Reporte Confidencial', 40, 780, {
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
