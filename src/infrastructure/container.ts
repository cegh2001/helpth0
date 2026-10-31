import { prisma } from './persistence/prisma/prisma.client';
import { PrismaDoctorRepository } from './persistence/repositories/prisma-doctor.repository';
import { PrismaScheduleRepository } from './persistence/repositories/prisma-schedule.repository';
import { PrismaDailyCountRepository } from './persistence/repositories/prisma-daily-count.repository';
import { PrismaAdminAccountRepository } from './persistence/repositories/prisma-admin-account.repository';
import { PrismaConsultationRepository } from './persistence/repositories/prisma-consultation.repository';
import { PrismaMedicalExamRepository } from './persistence/repositories/prisma-medical-exam.repository';
import { ExcelJsReportExporter } from './exporters/exceljs-report.exporter';
import { PdfKitReportExporter } from './exporters/pdfkit-report.exporter';
import { ExcelJsConsultationExporter } from './exporters/consultation-excel.exporter';
import { ExcelJsMedicalExamExporter } from './exporters/medical-exam-excel.exporter';
import { ConsultationCsvParser } from './parsers/consultation-excel.parser';
import { MedicalExamExcelParser } from './parsers/medical-exam-excel.parser';

import { RegisterDoctorUseCase } from '@/core/application/use-cases/doctor/register-doctor.use-case';
import { UpdateDoctorUseCase } from '@/core/application/use-cases/doctor/update-doctor.use-case';
import { DeleteDoctorUseCase } from '@/core/application/use-cases/doctor/delete-doctor.use-case';
import { ListDoctorsUseCase } from '@/core/application/use-cases/doctor/list-doctors.use-case';
import { SetDoctorSchedulesUseCase } from '@/core/application/use-cases/schedule/set-doctor-schedules.use-case';
import { GetDoctorSchedulesUseCase } from '@/core/application/use-cases/schedule/get-doctor-schedules.use-case';
import { RecordPatientCountUseCase } from '@/core/application/use-cases/count/record-patient-count.use-case';
import { GetDailyOverviewUseCase } from '@/core/application/use-cases/count/get-daily-overview.use-case';
import { GenerateReportDataUseCase } from '@/core/application/use-cases/reports/generate-report-data.use-case';
import { CheckSetupStatusUseCase } from '@/core/application/use-cases/setup/check-setup-status.use-case';
import { ImportConsultationsUseCase } from '@/core/application/use-cases/consultations/import-consultations.use-case';
import { GetConsultationsUseCase } from '@/core/application/use-cases/consultations/get-consultations.use-case';
import { ExportConsultationsUseCase } from '@/core/application/use-cases/consultations/export-consultations.use-case';
import { ImportMedicalExamsUseCase } from '@/core/application/use-cases/exams/import-medical-exams.use-case';
import { GetMedicalExamsUseCase } from '@/core/application/use-cases/exams/get-medical-exams.use-case';
import { ExportMedicalExamsUseCase } from '@/core/application/use-cases/exams/export-medical-exams.use-case';

// Persistence Repositories
export const doctorRepository = new PrismaDoctorRepository(prisma);
export const scheduleRepository = new PrismaScheduleRepository(prisma);
export const dailyCountRepository = new PrismaDailyCountRepository(prisma);
export const adminAccountRepository = new PrismaAdminAccountRepository(prisma);
export const consultationRepository = new PrismaConsultationRepository(prisma);
export const medicalExamRepository = new PrismaMedicalExamRepository(prisma);

// Exporters & Parsers
export const excelExporter = new ExcelJsReportExporter();
export const pdfExporter = new PdfKitReportExporter();
export const consultationExcelExporter = new ExcelJsConsultationExporter();
export const medicalExamExcelExporter = new ExcelJsMedicalExamExporter();
export const consultationParser = new ConsultationCsvParser();
export const medicalExamParser = new MedicalExamExcelParser();

// Application Use Cases
export const registerDoctorUseCase = new RegisterDoctorUseCase(doctorRepository);
export const updateDoctorUseCase = new UpdateDoctorUseCase(doctorRepository);
export const deleteDoctorUseCase = new DeleteDoctorUseCase(doctorRepository);
export const listDoctorsUseCase = new ListDoctorsUseCase(doctorRepository);
export const setDoctorSchedulesUseCase = new SetDoctorSchedulesUseCase(
  doctorRepository,
  scheduleRepository
);
export const getDoctorSchedulesUseCase = new GetDoctorSchedulesUseCase(
  doctorRepository,
  scheduleRepository
);
export const recordPatientCountUseCase = new RecordPatientCountUseCase(
  doctorRepository,
  scheduleRepository,
  dailyCountRepository
);
export const getDailyOverviewUseCase = new GetDailyOverviewUseCase(
  doctorRepository,
  scheduleRepository,
  dailyCountRepository
);
export const generateReportDataUseCase = new GenerateReportDataUseCase(
  doctorRepository,
  scheduleRepository,
  dailyCountRepository
);
export const checkSetupStatusUseCase = new CheckSetupStatusUseCase(adminAccountRepository);
export const importConsultationsUseCase = new ImportConsultationsUseCase(
  consultationRepository,
  consultationParser,
  doctorRepository
);
export const getConsultationsUseCase = new GetConsultationsUseCase(consultationRepository);
export const exportConsultationsUseCase = new ExportConsultationsUseCase(
  consultationRepository,
  consultationExcelExporter
);
export const importMedicalExamsUseCase = new ImportMedicalExamsUseCase(
  medicalExamRepository,
  medicalExamParser
);
export const getMedicalExamsUseCase = new GetMedicalExamsUseCase(medicalExamRepository);
export const exportMedicalExamsUseCase = new ExportMedicalExamsUseCase(
  medicalExamRepository,
  medicalExamExcelExporter
);
