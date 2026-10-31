'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deactivateDoctor } from './doctor-directory-api';
import type { DoctorListItem } from './doctor-list-item';

interface DoctorDeactivateDialogProps {
  doctor: DoctorListItem;
  onClose: () => void;
  onDeactivated: () => void;
  onError: (error: unknown) => void;
}

export function DoctorDeactivateDialog({
  doctor,
  onClose,
  onDeactivated,
  onError,
}: DoctorDeactivateDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeactivate = async () => {
    setIsDeleting(true);
    try {
      await deactivateDoctor(doctor.id);
      onDeactivated();
    } catch (error) {
      onError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6 shadow-2xl border-slate-200">
        <DialogHeader className="space-y-2">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto sm:mx-0">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <DialogTitle className="text-base font-bold text-slate-900">
            ¿Desactivar al Dr. {doctor.name}?
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 leading-relaxed">
            El profesional dejará de aparecer en la operación diaria. Sus turnos y conteos
            históricos se conservarán en los reportes.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs cursor-pointer hover:bg-slate-100"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={handleDeactivate}
            className="rounded-xl text-xs cursor-pointer font-semibold shadow-xs"
          >
            {isDeleting ? 'Desactivando...' : 'Desactivar Médico'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
