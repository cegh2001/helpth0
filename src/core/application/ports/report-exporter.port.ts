export interface DoctorReportRow {
  doctorId: string;
  doctorName: string;
  specialty: string;
  schedulesSummary: string;
  totalPatients: number;
  dailyBreakdown: Array<{
    date: string;
    dayName: string;
    shiftTime: string;
    count: number;
  }>;
}

export interface ClinicReportData {
  startDate: string;
  endDate: string;
  generatedAt: Date;
  totalPatientsPeriod: number;
  doctors: DoctorReportRow[];
}

export interface ReportExporterPort {
  exportToExcel(data: ClinicReportData): Promise<Buffer>;
  exportToPdf(data: ClinicReportData): Promise<Buffer>;
}
