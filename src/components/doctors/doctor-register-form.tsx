'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerDoctor } from './doctor-directory-api';

interface DoctorRegisterFormProps {
  onRegistered: (doctorName: string) => void;
  onError: (error: unknown) => void;
}

export function DoctorRegisterForm({ onRegistered, onError }: DoctorRegisterFormProps) {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      onError('El nombre del médico es obligatorio');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerDoctor({ name, specialty });
      setName('');
      setSpecialty('');
      onRegistered(name.trim());
    } catch (error) {
      onError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-xs border-slate-200 h-fit bg-white">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <UserPlus className="w-5 h-5 text-primary" aria-hidden="true" />
          <CardTitle className="text-base">Registrar Nuevo Médico</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Ingresá los datos del profesional para incorporarlo al consultorio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="doc-name" className="text-xs font-semibold text-slate-700">
              Nombre Completo del Médico *
            </Label>
            <Input
              id="doc-name"
              type="text"
              required
              placeholder="Ej. Dr. Carlos Gómez"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-xl h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-spec" className="text-xs font-semibold text-slate-700">
              Especialidad / Área
            </Label>
            <Input
              id="doc-spec"
              type="text"
              placeholder="Ej. Pediatría, Traumatología"
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value)}
              className="rounded-xl h-10"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl cursor-pointer hover:bg-primary/90 transition shadow-xs h-10 font-semibold"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Guardando...' : 'Registrar Médico'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
