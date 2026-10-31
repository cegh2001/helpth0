'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateDoctor } from './doctor-directory-api';
import type { DoctorListItem } from './doctor-list-item';

interface DoctorEditDialogProps {
  doctor: DoctorListItem;
  onClose: () => void;
  onUpdated: () => void;
  onError: (text: string) => void;
}

export function DoctorEditDialog({
  doctor,
  onClose,
  onUpdated,
  onError,
}: DoctorEditDialogProps) {
  const [name, setName] = useState(doctor.name);
  const [specialty, setSpecialty] = useState(doctor.specialty);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await updateDoctor({ id: doctor.id, name: name.trim(), specialty: specialty.trim() });
      onUpdated();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Error de red al actualizar médico');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6 shadow-2xl border-slate-200">
        <DialogHeader className="space-y-1 pb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center">
              <Pencil className="w-4 h-4" aria-hidden="true" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Editar Datos del Médico
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Modificá el nombre completo o especialidad del profesional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-xs font-semibold text-slate-700">
              Nombre Completo *
            </Label>
            <Input
              id="edit-name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-xl h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-spec" className="text-xs font-semibold text-slate-700">
              Especialidad / Área
            </Label>
            <Input
              id="edit-spec"
              type="text"
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value)}
              className="rounded-xl h-10 text-sm"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs cursor-pointer hover:bg-slate-100"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-xl text-xs cursor-pointer hover:bg-primary/90 font-semibold"
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
