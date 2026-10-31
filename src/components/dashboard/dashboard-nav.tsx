'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  FileSpreadsheet,
  FlaskConical,
  HeartPulse,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';
import { DASHBOARD_MODULES, isModuleActive, type DashboardModule } from './dashboard-modules';

const MODULE_ICONS: Record<DashboardModule['id'], LucideIcon> = {
  consultations: FileSpreadsheet,
  exams: FlaskConical,
  therapies: HeartPulse,
  desk: Activity,
  doctors: Stethoscope,
};

const MODULE_ICON_TONES: Record<DashboardModule['id'], string> = {
  consultations: 'text-emerald-600',
  exams: 'text-blue-600',
  therapies: 'text-teal-600',
  desk: 'text-slate-600',
  doctors: 'text-purple-600',
};

interface ModuleLinkProps {
  module: DashboardModule;
  isActive: boolean;
  variant: 'rail' | 'strip';
}

function ModuleLink({ module, isActive, variant }: ModuleLinkProps) {
  const Icon = MODULE_ICONS[module.id];
  const base =
    'flex items-center gap-2.5 rounded-xl border text-xs font-semibold transition-colors';
  const shape = variant === 'rail' ? 'px-3 py-2.5' : 'px-3 py-2 whitespace-nowrap';
  const tone = isActive
    ? 'border-primary/20 bg-primary/10 text-primary'
    : 'border-transparent text-slate-600 hover:bg-slate-100';

  return (
    <Link
      href={module.href}
      aria-current={isActive ? 'page' : undefined}
      className={`${base} ${shape} ${tone}`}
    >
      <Icon
        className={`w-4 h-4 ${isActive ? 'text-primary' : MODULE_ICON_TONES[module.id]}`}
        aria-hidden="true"
      />
      <span>{module.label}</span>
    </Link>
  );
}

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: horizontal strip under the header */}
      <nav
        aria-label="Módulos del sistema"
        className="lg:hidden flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2"
      >
        {DASHBOARD_MODULES.map((module) => (
          <ModuleLink
            key={module.id}
            module={module}
            isActive={isModuleActive(pathname, module.href)}
            variant="strip"
          />
        ))}
      </nav>

      {/* Desktop: fixed vertical rail */}
      <nav
        aria-label="Módulos del sistema"
        className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:gap-1 lg:self-start lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto border-r border-slate-200 bg-white p-3"
      >
        <p className="px-2 pt-2 pb-3 text-2xs font-semibold uppercase tracking-wider text-slate-400">
          Módulos
        </p>
        {DASHBOARD_MODULES.map((module) => (
          <ModuleLink
            key={module.id}
            module={module}
            isActive={isModuleActive(pathname, module.href)}
            variant="rail"
          />
        ))}
      </nav>
    </>
  );
}
