export type ModuleId = 'consultations' | 'exams' | 'therapies' | 'desk' | 'doctors' | 'rates';

export interface DashboardModule {
  id: ModuleId;
  href: string;
  label: string;
}

export const DASHBOARD_MODULES: readonly DashboardModule[] = [
  { id: 'consultations', href: '/consultas', label: 'Consultas y Pagos' },
  { id: 'exams', href: '/examenes', label: 'Exámenes y Laboratorio' },
  { id: 'therapies', href: '/terapias', label: 'Terapias y Rehabilitación' },
  { id: 'desk', href: '/recepcion', label: 'Recepción Diaria' },
  { id: 'doctors', href: '/medicos', label: 'Médicos y Horarios' },
  { id: 'rates', href: '/tarifas', label: 'Tarifas y Exoneración' },
];

export function isModuleActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
