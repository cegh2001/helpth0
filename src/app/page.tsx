'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Clock,
  FileSpreadsheet,
  FileText,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Activity,
  Stethoscope,
  Save,
  Download,
  CalendarDays,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

interface ScheduleItem {
  startTime: string;
  endTime: string;
}

interface DoctorOverview {
  doctorId: string;
  doctorName: string;
  specialty: string;
  scheduledToday: boolean;
  schedules: ScheduleItem[];
  patientCount: number;
  notes: string | null;
  countRecordId: string | null;
}

interface DailyOverviewData {
  date: string;
  dayOfWeek: number;
  totalPatientsToday: number;
  doctors: DoctorOverview[];
}

interface DoctorScheduleSetting {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const DIAS_SEMANA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [overview, setOverview] = useState<DailyOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('desk');
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Formulario nuevo médico
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState('');
  const [isSubmittingDoctor, setIsSubmittingDoctor] = useState(false);

  // Modal de horarios
  const [managingDoctor, setManagingDoctor] = useState<{ id: string; name: string } | null>(null);
  const [doctorSchedules, setDoctorSchedules] = useState<DoctorScheduleSetting[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [isSavingSchedules, setIsSavingSchedules] = useState(false);

  // Filtros de reportes
  const [reportStartDate, setReportStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [reportEndDate, setReportEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const fetchOverview = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/overview?date=${date}`);
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      } else {
        showFeedback('error', data.error || 'Error al cargar el resumen diario');
      }
    } catch {
      showFeedback('error', 'Error de conexión al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview(selectedDate);
  }, [selectedDate, fetchOverview]);

  // Navegación de fecha
  const changeDateByDays = (days: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const setDateToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Manejo de conteo de pacientes
  const handleCountChange = async (doctorId: string, newCount: number, notes?: string | null) => {
    if (newCount < 0) return;

    if (overview) {
      const updatedDoctors = overview.doctors.map((d) => {
        if (d.doctorId === doctorId) {
          return { ...d, patientCount: newCount, notes: notes !== undefined ? notes : d.notes };
        }
        return d;
      });
      const newTotal = updatedDoctors.reduce((acc, curr) => acc + curr.patientCount, 0);
      setOverview({ ...overview, doctors: updatedDoctors, totalPatientsToday: newTotal });
    }

    try {
      const res = await fetch('/api/counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId,
          date: selectedDate,
          patientCount: newCount,
          notes: notes,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        showFeedback('error', data.error || 'Error al guardar el conteo');
        fetchOverview(selectedDate);
      }
    } catch {
      showFeedback('error', 'Error al sincronizar con la base de datos');
      fetchOverview(selectedDate);
    }
  };

  // Registro de médico
  const handleRegisterDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) {
      showFeedback('error', 'El nombre del médico es obligatorio');
      return;
    }

    setIsSubmittingDoctor(true);
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDocName,
          specialty: newDocSpecialty || 'Medicina General',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', `Médico ${data.data.name} registrado con éxito`);
        setNewDocName('');
        setNewDocSpecialty('');
        fetchOverview(selectedDate);
      } else {
        showFeedback('error', data.error || 'Error al registrar médico');
      }
    } catch {
      showFeedback('error', 'Error de red al registrar médico');
    } finally {
      setIsSubmittingDoctor(false);
    }
  };

  // Abrir modal de turnos
  const openScheduleManager = async (doctorId: string, doctorName: string) => {
    setManagingDoctor({ id: doctorId, name: doctorName });
    setLoadingSchedules(true);
    try {
      const res = await fetch(`/api/schedules?doctorId=${doctorId}`);
      const data = await res.json();
      if (data.success) {
        setDoctorSchedules(data.data);
      } else {
        setDoctorSchedules([]);
      }
    } catch {
      setDoctorSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Guardar turnos
  const handleSaveSchedules = async () => {
    if (!managingDoctor) return;
    setIsSavingSchedules(true);
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: managingDoctor.id,
          schedules: doctorSchedules,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', `Horarios actualizados para ${managingDoctor.name}`);
        setManagingDoctor(null);
        fetchOverview(selectedDate);
      } else {
        showFeedback('error', data.error || 'Error al guardar horarios');
      }
    } catch {
      showFeedback('error', 'Error de red al guardar horarios');
    } finally {
      setIsSavingSchedules(false);
    }
  };

  const addScheduleSlot = () => {
    setDoctorSchedules([
      ...doctorSchedules,
      { dayOfWeek: 1, startTime: '08:00', endTime: '14:00' },
    ]);
  };

  const removeScheduleSlot = (index: number) => {
    setDoctorSchedules(doctorSchedules.filter((_, i) => i !== index));
  };

  const updateScheduleSlot = (
    index: number,
    field: keyof DoctorScheduleSetting,
    value: any
  ) => {
    const updated = [...doctorSchedules];
    updated[index] = { ...updated[index], [field]: value };
    setDoctorSchedules(updated);
  };

  // Rango de fechas predefinidos
  const setRangeToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setReportStartDate(today);
    setReportEndDate(today);
  };

  const setRangeLast7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    setReportStartDate(start.toISOString().split('T')[0]);
    setReportEndDate(end.toISOString().split('T')[0]);
  };

  const setRangeThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setReportStartDate(start.toISOString().split('T')[0]);
    setReportEndDate(now.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Barra de Navegación Superior */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                helpth0
              </h1>
              <p className="text-xs text-slate-500">
                Control de Turnos Médicos y Conteo Diario de Pacientes
              </p>
            </div>
          </div>

          {/* Navegador de Fecha con shadcn DatePicker */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => changeDateByDays(-1)}
              title="Día Anterior"
              className="cursor-pointer hover:bg-white hover:shadow-2xs rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              className="border-0 bg-transparent shadow-none hover:bg-white h-8 text-xs font-semibold"
            />

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => changeDateByDays(1)}
              title="Día Siguiente"
              className="cursor-pointer hover:bg-white hover:shadow-2xs rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={setDateToToday}
              className="text-xs font-semibold h-8 px-3 rounded-lg shadow-2xs hover:bg-white cursor-pointer"
            >
              Hoy
            </Button>
          </div>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Alerta Toast */}
        {feedbackMessage && (
          <div
            className={`p-4 rounded-xl flex items-center space-x-3 transition-all ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-medium">{feedbackMessage.text}</span>
          </div>
        )}

        {/* Tarjetas KPI de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="shadow-xs border-slate-200 bg-white">
            <CardContent className="p-5 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Pacientes Hoy
                </p>
                <p className="text-3xl font-extrabold text-slate-900 mt-0.5">
                  {loading ? '...' : overview?.totalPatientsToday ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-slate-200 bg-white">
            <CardContent className="p-5 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Médicos de Turno Hoy
                </p>
                <p className="text-3xl font-extrabold text-slate-900 mt-0.5">
                  {loading
                    ? '...'
                    : overview?.doctors.filter((d) => d.scheduledToday).length ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-slate-200 bg-white">
            <CardContent className="p-5 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Médicos Registrados
                </p>
                <p className="text-3xl font-extrabold text-slate-900 mt-0.5">
                  {loading ? '...' : overview?.doctors.length ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pestañas de Navegación shadcn */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-200/80 p-1 rounded-xl h-auto">
            <TabsTrigger
              value="desk"
              className="data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-lg py-2.5 px-4 text-xs font-semibold flex items-center space-x-2 cursor-pointer transition"
            >
              <Activity className="w-4 h-4" />
              <span>Recepción Diaria</span>
            </TabsTrigger>

            <TabsTrigger
              value="doctors"
              className="data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-lg py-2.5 px-4 text-xs font-semibold flex items-center space-x-2 cursor-pointer transition"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Médicos y Horarios</span>
            </TabsTrigger>

            <TabsTrigger
              value="reports"
              className="data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-lg py-2.5 px-4 text-xs font-semibold flex items-center space-x-2 cursor-pointer transition"
            >
              <Download className="w-4 h-4" />
              <span>Reportes (Excel / PDF)</span>
            </TabsTrigger>
          </TabsList>

          {/* PESTAÑA 1: RECEPCIÓN DIARIA */}
          <TabsContent value="desk" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Conteo para el {DIAS_SEMANA[overview?.dayOfWeek ?? 0]}, {selectedDate}
                </h2>
                <p className="text-xs text-slate-500">
                  Registrá el número de pacientes atendidos por cada médico durante su consulta.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-400">Cargando datos del día...</div>
            ) : overview?.doctors.length === 0 ? (
              <Card className="border-dashed p-12 text-center space-y-4 bg-white">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                  <h3 className="text-base font-semibold text-slate-800">
                    No hay médicos registrados aún
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Ingresá en la pestaña de Médicos y Horarios para agregar al personal y configurar sus turnos.
                  </p>
                </div>
                <Button
                  onClick={() => setActiveTab('doctors')}
                  className="rounded-xl shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Agregar Primer Médico
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {overview?.doctors.map((doc) => (
                  <Card
                    key={doc.doctorId}
                    className={`transition-all shadow-xs ${
                      doc.scheduledToday
                        ? 'border-blue-300 ring-1 ring-blue-100 bg-white'
                        : 'border-slate-200 bg-white/90'
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-base text-slate-900">
                              {doc.doctorName}
                            </h3>
                            {doc.scheduledToday ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-xs hover:bg-emerald-50">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5 inline-block"></span>
                                De Turno
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-500 text-xs">
                                Fuera de Turno
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium">{doc.specialty}</p>

                          {/* Horario del Día */}
                          <div className="mt-2 flex items-center space-x-1.5 text-xs text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {doc.schedules.length > 0
                                ? doc.schedules
                                    .map((s) => `${s.startTime} - ${s.endTime}`)
                                    .join(', ')
                                : 'Sin turno programado para hoy'}
                            </span>
                          </div>
                        </div>

                        {/* Contador de Pacientes */}
                        <div className="flex flex-col items-end space-y-1">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Pacientes
                          </span>
                          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() =>
                                handleCountChange(doc.doctorId, Math.max(0, doc.patientCount - 1))
                              }
                              title="Restar (-1)"
                              className="h-8 w-8 rounded-lg cursor-pointer hover:bg-white active:scale-90"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </Button>

                            <Input
                              type="number"
                              min="0"
                              value={doc.patientCount}
                              onChange={(e) =>
                                handleCountChange(doc.doctorId, parseInt(e.target.value) || 0)
                              }
                              className="w-14 h-8 text-center font-bold text-base bg-transparent border-0 shadow-none focus-visible:ring-0 p-0"
                            />

                            <Button
                              type="button"
                              size="icon-sm"
                              onClick={() => handleCountChange(doc.doctorId, doc.patientCount + 1)}
                              title="Sumar (+1)"
                              className="h-8 w-8 rounded-lg cursor-pointer hover:bg-primary/90 active:scale-90"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Observaciones */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2">
                        <Input
                          type="text"
                          placeholder="Observaciones del día (opcional)..."
                          defaultValue={doc.notes || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (doc.notes || '')) {
                              handleCountChange(doc.doctorId, doc.patientCount, e.target.value);
                            }
                          }}
                          className="h-8 text-xs bg-slate-50/60 focus:bg-white transition"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* PESTAÑA 2: MÉDICOS Y HORARIOS */}
          <TabsContent value="doctors" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulario Registrar Médico */}
              <Card className="shadow-xs border-slate-200 h-fit bg-white">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">Registrar Nuevo Médico</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Ingresá los datos del profesional para incorporarlo al consultorio.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegisterDoctor} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="doc-name" className="text-xs font-semibold text-slate-700">
                        Nombre Completo del Médico *
                      </Label>
                      <Input
                        id="doc-name"
                        type="text"
                        required
                        placeholder="Ej. Dr. Carlos Gómez"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
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
                        value={newDocSpecialty}
                        onChange={(e) => setNewDocSpecialty(e.target.value)}
                        className="rounded-xl h-10"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmittingDoctor}
                      className="w-full rounded-xl cursor-pointer hover:bg-primary/90 transition shadow-xs h-10 font-semibold"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {isSubmittingDoctor ? 'Guardando...' : 'Registrar Médico'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Lista de Médicos */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-bold text-slate-900 text-base">
                  Personal Médico del Consultorio
                </h3>

                {overview?.doctors.length === 0 ? (
                  <Card className="p-8 text-center text-slate-400 border-dashed bg-white">
                    No hay médicos registrados. Agregá uno usando el formulario.
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {overview?.doctors.map((doc) => (
                      <Card
                        key={doc.doctorId}
                        className="shadow-xs border-slate-200 hover:border-slate-300 transition bg-white"
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">
                              {doc.doctorName}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                              {doc.specialty}
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openScheduleManager(doc.doctorId, doc.doctorName)}
                            className="rounded-xl text-xs cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                          >
                            <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-primary" />
                            Configurar Turnos Semanales
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* PESTAÑA 3: REPORTES */}
          <TabsContent value="reports" className="mt-6">
            <Card className="shadow-xs border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-base">Exportar Reportes del Consultorio</CardTitle>
                <CardDescription className="text-xs">
                  Generá planillas estructuradas de Excel (.xlsx) y reportes médicos impresos (.pdf) con los turnos y conteo de pacientes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Rango de Fechas con shadcn DatePicker */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Label className="text-xs font-semibold text-slate-600">Desde:</Label>
                    <DatePicker
                      value={reportStartDate}
                      onChange={setReportStartDate}
                      className="w-[200px]"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label className="text-xs font-semibold text-slate-600">Hasta:</Label>
                    <DatePicker
                      value={reportEndDate}
                      onChange={setReportEndDate}
                      className="w-[200px]"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={setRangeToday}
                      className="text-xs h-9 rounded-xl cursor-pointer hover:bg-slate-100 shadow-2xs"
                    >
                      Hoy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={setRangeLast7Days}
                      className="text-xs h-9 rounded-xl cursor-pointer hover:bg-slate-100 shadow-2xs"
                    >
                      Últimos 7 Días
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={setRangeThisMonth}
                      className="text-xs h-9 rounded-xl cursor-pointer hover:bg-slate-100 shadow-2xs"
                    >
                      Este Mes
                    </Button>
                  </div>
                </div>

                {/* Botones de Descarga con Button asChild */}
                <div className="pt-2 flex flex-wrap gap-4">
                  <Button
                    asChild
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer transition font-semibold h-10 px-5"
                  >
                    <a
                      href={`/api/reports/excel?startDate=${reportStartDate}&endDate=${reportEndDate}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Descargar Excel (.xlsx)
                    </a>
                  </Button>

                  <Button
                    asChild
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xs cursor-pointer transition font-semibold h-10 px-5"
                  >
                    <a
                      href={`/api/reports/pdf?startDate=${reportStartDate}&endDate=${reportEndDate}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Descargar PDF (.pdf)
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* DIÁLOGO SHADCN MEJORADO: GESTIÓN DE HORARIOS SEMANALES */}
      <Dialog
        open={Boolean(managingDoctor)}
        onOpenChange={(open) => {
          if (!open) setManagingDoctor(null);
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl p-6 shadow-2xl border-slate-200">
          <DialogHeader className="space-y-1.5 pb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Turnos Semanales: {managingDoctor?.name}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Configurá los días y rangos horarios recurrentes en los que pasa consulta.
            </DialogDescription>
          </DialogHeader>

          {loadingSchedules ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Cargando horarios configurados...
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 py-1">
              {doctorSchedules.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">
                    Sin turnos configurados aún.
                  </p>
                  <p className="text-2xs text-slate-400 mt-0.5">
                    Hacé clic en "Agregar Turno" para añadir el primer horario.
                  </p>
                </div>
              ) : (
                doctorSchedules.map((slot, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs transition hover:border-slate-300"
                  >
                    {/* Selector de Día shadcn Select */}
                    <div className="w-[140px]">
                      <Select
                        value={String(slot.dayOfWeek)}
                        onValueChange={(val) =>
                          updateScheduleSlot(idx, 'dayOfWeek', parseInt(val))
                        }
                      >
                        <SelectTrigger className="w-full bg-white text-xs h-9 font-medium shadow-2xs rounded-lg">
                          <SelectValue placeholder="Día" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-lg border-slate-200">
                          {DIAS_SEMANA.map((name, dayIndex) => (
                            <SelectItem
                              key={dayIndex}
                              value={String(dayIndex)}
                              className="text-xs font-medium cursor-pointer"
                            >
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Hora de inicio */}
                    <div className="flex items-center space-x-1">
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          updateScheduleSlot(idx, 'startTime', e.target.value)
                        }
                        className="h-9 w-24 bg-white text-xs font-mono text-center rounded-lg shadow-2xs"
                      />
                    </div>

                    <span className="text-xs text-slate-400 font-medium px-0.5">a</span>

                    {/* Hora de fin */}
                    <div className="flex items-center space-x-1">
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          updateScheduleSlot(idx, 'endTime', e.target.value)
                        }
                        className="h-9 w-24 bg-white text-xs font-mono text-center rounded-lg shadow-2xs"
                      />
                    </div>

                    {/* Botón eliminar turno */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeScheduleSlot(idx)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer rounded-lg h-9 w-9 shrink-0 ml-auto transition"
                      title="Eliminar turno"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}

              <Button
                type="button"
                variant="outline"
                onClick={addScheduleSlot}
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
              onClick={() => setManagingDoctor(null)}
              className="rounded-xl text-xs cursor-pointer hover:bg-slate-100 transition"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSavingSchedules}
              onClick={handleSaveSchedules}
              className="rounded-xl text-xs cursor-pointer hover:bg-primary/90 transition shadow-xs font-semibold"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {isSavingSchedules ? 'Guardando...' : 'Guardar Horarios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
