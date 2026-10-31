import { Clock, Stethoscope, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DailyOverviewData } from './daily-overview';

interface ReceptionSummaryCardsProps {
  loading: boolean;
  overview: DailyOverviewData | null;
  activeNowCount: number;
  scheduledTodayCount: number;
  isToday: boolean;
}

export function ReceptionSummaryCards({
  loading,
  overview,
  activeNowCount,
  scheduledTodayCount,
  isToday,
}: ReceptionSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <Card className="shadow-xs border-slate-200 bg-white">
        <CardContent className="p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pacientes Hoy
            </p>
            <p aria-live="polite" className="text-3xl font-extrabold text-slate-900 mt-0.5">
              {loading ? '...' : overview?.totalPatientsToday ?? 0}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs border-slate-200 bg-white">
        <CardContent className="p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Médicos en Consulta Ahora
            </p>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <p aria-live="polite" className="text-3xl font-extrabold text-slate-900">
                {loading ? '...' : activeNowCount}
              </p>
              <span className="text-xs text-slate-500 font-medium">
                ({scheduledTodayCount} programados {isToday ? 'hoy' : 'este día'})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs border-slate-200 bg-white">
        <CardContent className="p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Médicos Registrados
            </p>
            <p aria-live="polite" className="text-3xl font-extrabold text-slate-900 mt-0.5">
              {loading ? '...' : overview?.doctors.length ?? 0}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
