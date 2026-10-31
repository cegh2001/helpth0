'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TimeSelect } from '@/components/ui/time-select';
import { WEEKDAY_NAMES } from '@/lib/weekday-names';
import {
  fetchDoctorSchedules,
  saveDoctorSchedules,
  type DoctorScheduleSetting,
} from './doctor-directory-api';
import type { DoctorListItem } from './doctor-list-item';

interface DoctorSchedulesDialogProps {
  doctor: DoctorListItem;
  onClose: () => void;
  onSaved: () => void;
  onError: (text: string) => void;
}

export function DoctorSchedulesDialog({
  doctor,
  onClose,
  onSaved,
  onError,
}: DoctorSchedulesDialogProps) {
  const [schedules, setSchedules] = useState<DoctorScheduleSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const stored = await fetchDoctorSchedules(doctor.id);
        if (!ignore) setSchedules(stored);
      } catch (error) {
        if (!ignore) {
          onError(error instanceof Error ? error.message : 'Error al cargar los horarios');
          setSchedules([]);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [doctor.id, onError]);

  const addSlot = () => {
    setSchedules([...schedules, { dayOfWeek: 1, startTime: '08:00', endTime: '14:00' }]);
  };

  const removeSlot = (index: number) => {
    setSchedules(schedules.filter((_, position) => position !== index));
  };

  const updateSlot = <Field extends keyof DoctorScheduleSetting>(
    index: number,
    field: Field,
    value: DoctorScheduleSetting[Field]
  ) => {
    const updated = [...schedules];
    updated[index] = { ...updated[index], [field]: value };
    setSchedules(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveDoctorSchedules(doctor.id, schedules);
      onSaved();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Error de red al guardar horarios');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl p-6 shadow-2xl border-slate-200">
        <DialogHeader className="space-y-1.5 pb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center">
              <CalendarDays className="w-4 h-4" aria-hidden="true" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Turnos Semanales: {doctor.name}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Configurá los días y rangos horarios recurrentes en los que pasa consulta.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Cargando horarios configurados...
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {schedules.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                Este médico no tiene turnos semanales configurados.
              </p>
            ) : (
              schedules.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs transition hover:border-slate-300"
                >
                  <div className="w-35">
                    <Select
                      value={String(slot.dayOfWeek)}
                      onValueChange={(value) => updateSlot(index, 'dayOfWeek', parseInt(value))}
                    >
                      <SelectTrigger
                        aria-label={`Día del turno ${index + 1}`}
                        className="w-full bg-white text-xs h-9 font-medium shadow-2xs rounded-lg"
                      >
                        <SelectValue placeholder="Día" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-lg border-slate-200">
                        {WEEKDAY_NAMES.map((dayName, dayIndex) => (
                          <SelectItem
                            key={dayIndex}
                            value={String(dayIndex)}
                            className="text-xs font-medium cursor-pointer"
                          >
                            {dayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <TimeSelect
                    value={slot.startTime}
                    onChange={(value) => updateSlot(index, 'startTime', value)}
                    ariaLabel={`Hora de inicio del turno ${index + 1}`}
                  />

                  <span className="text-xs text-slate-400 font-medium px-0.5">a</span>

                  <TimeSelect
                    value={slot.endTime}
                    onChange={(value) => updateSlot(index, 'endTime', value)}
                    ariaLabel={`Hora de fin del turno ${index + 1}`}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeSlot(index)}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer rounded-lg h-9 w-9 shrink-0 ml-auto transition"
                    title="Eliminar turno"
                    aria-label={`Eliminar turno ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}

            <Button
              type="button"
              variant="outline"
              onClick={addSlot}
              className="w-full border-dashed border-slate-300 hover:border-primary hover:text-primary hover:bg-primary/5 cursor-pointer rounded-xl text-xs h-10 font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Agregar Turno
            </Button>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs cursor-pointer hover:bg-slate-100 transition"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={isSaving || isLoading}
            onClick={handleSave}
            className="rounded-xl text-xs cursor-pointer hover:bg-primary/90 transition shadow-xs font-semibold"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {isSaving ? 'Guardando...' : 'Guardar Horarios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
