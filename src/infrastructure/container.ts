import { prisma } from './persistence/prisma/prisma.client';
import { PrismaDoctorRepository } from './persistence/repositories/prisma-doctor.repository';
import { PrismaScheduleRepository } from './persistence/repositories/prisma-schedule.repository';
import { PrismaDailyCountRepository } from './persistence/repositories/prisma-daily-count.repository';
import { ExcelJsReportExporter } from './exporters/exceljs-report.exporter';
import { PdfKitReportExporter } from './exporters/pdfkit-report.exporter';

import { RegisterDoctorUseCase } from '@/core/application/use-cases/doctor/register-doctor.use-case';
import { UpdateDoctorUseCase } from '@/core/application/use-cases/doctor/update-doctor.use-case';
import { DeleteDoctorUseCase } from '@/core/application/use-cases/doctor/delete-doctor.use-case';
import { ListDoctorsUseCase } from '@/core/application/use-cases/doctor/list-doctors.use-case';
import { SetDoctorSchedulesUseCase } from '@/core/application/use-cases/schedule/set-doctor-schedules.use-case';
import { GetDoctorSchedulesUseCase } from '@/core/application/use-cases/schedule/get-doctor-schedules.use-case';
import { RecordPatientCountUseCase } from '@/core/application/use-cases/count/record-patient-count.use-case';
import { GetDailyOverviewUseCase } from '@/core/application/use-cases/count/get-daily-overview.use-case';
import { GenerateReportDataUseCase } from '@/core/application/use-cases/reports/generate-report-data.use-case';

// Persistence Repositories
export const doctorRepository = new PrismaDoctorRepository(prisma);
export const scheduleRepository = new PrismaScheduleRepository(prisma);
export const dailyCountRepository = new PrismaDailyCountRepository(prisma);

// Exporters
export const excelExporter = new ExcelJsReportExporter();
export const pdfExporter = new PdfKitReportExporter();

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
