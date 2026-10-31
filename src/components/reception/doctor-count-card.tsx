import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getDoctorDutyStatus } from '@/lib/date-utils';
import type { DoctorOverview } from './daily-overview';
import { PatientCounter } from './patient-counter';

interface DoctorCountCardProps {
  doctor: DoctorOverview;
  isToday: boolean;
  currentTime: string;
  onCountChange: (doctorId: string, scheduleId: string | null, count: number) => void;
}

export function DoctorCountCard({
  doctor,
  isToday,
  currentTime,
  onCountChange,
}: DoctorCountCardProps) {
  const dutyStatus = getDoctorDutyStatus(doctor.schedules, isToday, currentTime);
  const shiftSlots = doctor.shiftSlots ?? [];
  const hasMultipleShifts = shiftSlots.length > 1;

  return (
    <Card
      className={`transition-all shadow-xs ${
        dutyStatus === 'on_duty'
          ? 'border-emerald-300 ring-2 ring-emerald-100 bg-white'
          : doctor.scheduledToday
            ? 'border-slate-200 bg-white'
            : 'border-slate-200 bg-slate-50/70'
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 className="font-bold text-base text-slate-900">{doctor.doctorName}</h3>
              {dutyStatus === 'on_duty' ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-xs hover:bg-emerald-50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5 inline-block" />
                  En Turno Ahora
                </Badge>
              ) : dutyStatus === 'completed' ? (
                <Badge
                  variant="outline"
                  className="bg-amber-50/80 text-amber-700 border-amber-200 text-xs font-medium"
                >
                  Turno Concluido
                </Badge>
              ) : dutyStatus === 'upcoming' ? (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium"
                >
                  {isToday ? 'Turno Próximo' : 'Programado'}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-slate-400 border-slate-200 text-xs">
                  Sin Turno
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{doctor.specialty}</p>

            <div className="mt-2 flex items-center space-x-1.5 text-xs text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>
                {doctor.schedules.length > 0
                  ? doctor.schedules
                      .map((schedule) => `${schedule.startTime} - ${schedule.endTime}`)
                      .join(', ')
                  : 'Sin turno programado para este día'}
              </span>
            </div>
          </div>

          {hasMultipleShifts ? (
            <div className="text-right">
              <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total Hoy
              </span>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-xs mt-0.5">
                {doctor.patientCount} pac.
              </Badge>
            </div>
          ) : (
            <div className="flex flex-col items-end space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pacientes
              </span>
              <PatientCounter
                value={shiftSlots[0] ? shiftSlots[0].patientCount : doctor.patientCount}
                onChange={(count) =>
                  onCountChange(doctor.doctorId, shiftSlots[0]?.scheduleId ?? null, count)
                }
                minusLabel={`Restar un paciente a ${doctor.doctorName}`}
                inputLabel={`Pacientes atendidos por ${doctor.doctorName}`}
                plusLabel={`Sumar un paciente a ${doctor.doctorName}`}
              />
            </div>
          )}
        </div>

        {hasMultipleShifts && (
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
              Registro por Turno ({shiftSlots.length} turnos)
            </p>
            <div className="space-y-2">
              {shiftSlots.map((slot, index) => {
                const slotDuty =
                  slot.startTime && slot.endTime
                    ? getDoctorDutyStatus(
                        [{ startTime: slot.startTime, endTime: slot.endTime }],
                        isToday,
                        currentTime
                      )
                    : 'unscheduled';
                const slotLabel = `${slot.startTime} a ${slot.endTime}`;

                return (
                  <div
                    key={slot.scheduleId || index}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {slot.startTime && slot.endTime
                            ? `${slot.startTime} - ${slot.endTime}`
                            : 'Consulta fuera de turno'}
                        </span>
                        {slotDuty === 'on_duty' ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-2xs py-0 px-1.5 hover:bg-emerald-50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1 inline-block" />
                            En Turno
                          </Badge>
                        ) : slotDuty === 'completed' ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-50/80 text-amber-700 border-amber-200 text-2xs py-0 px-1.5"
                          >
                            Concluido
                          </Badge>
                        ) : slotDuty === 'upcoming' ? (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 text-2xs py-0 px-1.5"
                          >
                            Próximo
                          </Badge>
                        ) : null}
                      </div>

                      <PatientCounter
                        size="compact"
                        value={slot.patientCount}
                        onChange={(count) =>
                          onCountChange(doctor.doctorId, slot.scheduleId, count)
                        }
                        minusLabel={`Restar un paciente a ${doctor.doctorName} en el turno ${slotLabel}`}
                        inputLabel={`Pacientes atendidos por ${doctor.doctorName} en el turno ${slotLabel}`}
                        plusLabel={`Sumar un paciente a ${doctor.doctorName} en el turno ${slotLabel}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
