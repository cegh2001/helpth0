'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
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
} from 'lucide-react';

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

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [overview, setOverview] = useState<DailyOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'desk' | 'doctors' | 'reports'>('desk');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Doctor Form State
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState('');
  const [isSubmittingDoctor, setIsSubmittingDoctor] = useState(false);

  // Schedule Management Modal State
  const [managingDoctor, setManagingDoctor] = useState<{ id: string; name: string } | null>(null);
  const [doctorSchedules, setDoctorSchedules] = useState<DoctorScheduleSetting[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Reports Range State
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
        showFeedback('error', data.error || 'Failed to fetch overview');
      }
    } catch (err: any) {
      showFeedback('error', 'Network error loading overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview(selectedDate);
  }, [selectedDate, fetchOverview]);

  // Date Navigation
  const changeDateByDays = (days: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const setDateToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Headcount Increment / Decrement / Input
  const handleCountChange = async (doctorId: string, newCount: number, notes?: string | null) => {
    if (newCount < 0) return;

    // Optimistic update
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
        showFeedback('error', data.error || 'Failed to save count');
        fetchOverview(selectedDate); // Revert
      }
    } catch {
      showFeedback('error', 'Error syncing count');
      fetchOverview(selectedDate);
    }
  };

  // Register Doctor
  const handleRegisterDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) {
      showFeedback('error', 'Doctor name is required');
      return;
    }

    setIsSubmittingDoctor(true);
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDocName,
          specialty: newDocSpecialty || 'General',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', `Registered Dr. ${data.data.name}`);
        setNewDocName('');
        setNewDocSpecialty('');
        fetchOverview(selectedDate);
      } else {
        showFeedback('error', data.error || 'Failed to add doctor');
      }
    } catch {
      showFeedback('error', 'Failed to register doctor');
    } finally {
      setIsSubmittingDoctor(false);
    }
  };

  // Open Schedule Manager
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

  // Save Schedules
  const handleSaveSchedules = async () => {
    if (!managingDoctor) return;
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
        showFeedback('success', `Updated schedules for ${managingDoctor.name}`);
        setManagingDoctor(null);
        fetchOverview(selectedDate);
      } else {
        showFeedback('error', data.error || 'Failed to update schedule');
      }
    } catch {
      showFeedback('error', 'Network error saving schedule');
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

  // Preset Ranges for Reports
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
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  helpth0
                </h1>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold border border-blue-200">
                  Clinic Core
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Medical Shift & Patient Headcount Management
              </p>
            </div>
          </div>

          {/* Date Selector Navigation */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-600 hover:text-slate-900"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2 px-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-medium text-sm text-slate-800 outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={() => changeDateByDays(1)}
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-600 hover:text-slate-900"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={setDateToToday}
              className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs border border-slate-200"
            >
              Today
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Toast Alert */}
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

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Patients Today
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-0.5">
                {loading ? '...' : overview?.totalPatientsToday ?? 0}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Doctors On Duty Today
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-0.5">
                {loading
                  ? '...'
                  : overview?.doctors.filter((d) => d.scheduledToday).length ?? 0}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Registered Doctors
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-0.5">
                {loading ? '...' : overview?.doctors.length ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 space-x-8">
          <button
            onClick={() => setActiveTab('desk')}
            className={`pb-4 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'desk'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Daily Reception Desk</span>
          </button>

          <button
            onClick={() => setActiveTab('doctors')}
            className={`pb-4 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'doctors'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctors & Schedules</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-4 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'reports'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export Reports (Excel / PDF)</span>
          </button>
        </div>

        {/* TAB 1: DAILY RECEPTION DESK */}
        {activeTab === 'desk' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Headcounts for {DAY_NAMES[overview?.dayOfWeek ?? 0]}, {selectedDate}
                </h2>
                <p className="text-xs text-slate-500">
                  Record how many patients each doctor attended during their clinic session.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-400">Loading daily overview...</div>
            ) : overview?.doctors.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-semibold text-slate-800">
                  No doctors registered yet
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Go to the Doctors & Schedules tab to add medical staff and set up their working hours.
                </p>
                <button
                  onClick={() => setActiveTab('doctors')}
                  className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Doctor
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {overview?.doctors.map((doc) => (
                  <div
                    key={doc.doctorId}
                    className={`bg-white rounded-2xl p-5 border transition-all shadow-xs ${
                      doc.scheduledToday
                        ? 'border-blue-200 ring-1 ring-blue-100'
                        : 'border-slate-200 opacity-90'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-base text-slate-900">
                            {doc.doctorName}
                          </h3>
                          {doc.scheduledToday ? (
                            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>On Duty</span>
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                              Off Schedule
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{doc.specialty}</p>

                        {/* Shift Times */}
                        <div className="mt-2 flex items-center space-x-1.5 text-xs text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {doc.schedules.length > 0
                              ? doc.schedules
                                  .map((s) => `${s.startTime} - ${s.endTime}`)
                                  .join(', ')
                              : 'No shift scheduled for today'}
                          </span>
                        </div>
                      </div>

                      {/* Counter Controls */}
                      <div className="flex flex-col items-end space-y-1">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Patients
                        </span>
                        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() =>
                              handleCountChange(doc.doctorId, Math.max(0, doc.patientCount - 1))
                            }
                            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center shadow-2xs border border-slate-200 active:scale-95 transition"
                            title="Decrease (-1)"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={doc.patientCount}
                            onChange={(e) =>
                              handleCountChange(doc.doctorId, parseInt(e.target.value) || 0)
                            }
                            className="w-14 text-center font-bold text-lg bg-transparent text-slate-900 outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => handleCountChange(doc.doctorId, doc.patientCount + 1)}
                            className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center shadow-xs active:scale-95 transition"
                            title="Increase (+1)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Notes Field */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Add notes for today (optional)..."
                        defaultValue={doc.notes || ''}
                        onBlur={(e) => {
                          if (e.target.value !== (doc.notes || '')) {
                            handleCountChange(doc.doctorId, doc.patientCount, e.target.value);
                          }
                        }}
                        className="w-full text-xs text-slate-700 bg-slate-50 hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg border border-slate-200 focus:border-blue-400 outline-none transition"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DOCTORS & SCHEDULES */}
        {activeTab === 'doctors' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Add Doctor Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs h-fit space-y-4">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Register New Doctor</h3>
              </div>
              <p className="text-xs text-slate-500">
                Add medical practitioners to your clinic directory.
              </p>

              <form onSubmit={handleRegisterDoctor} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jane Foster"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specialty / Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pediatrics, Cardiology"
                    value={newDocSpecialty}
                    onChange={(e) => setNewDocSpecialty(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingDoctor}
                  className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmittingDoctor ? 'Saving...' : 'Register Doctor'}</span>
                </button>
              </form>
            </div>

            {/* Right: Doctor List & Schedule Management */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-slate-900 text-base">Clinic Medical Staff</h3>

              {overview?.doctors.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                  No doctors found. Register one on the left.
                </div>
              ) : (
                <div className="space-y-3">
                  {overview?.doctors.map((doc) => (
                    <div
                      key={doc.doctorId}
                      className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-slate-300 transition"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900">{doc.doctorName}</h4>
                        <p className="text-xs text-slate-500 font-medium">{doc.specialty}</p>
                      </div>

                      <button
                        onClick={() => openScheduleManager(doc.doctorId, doc.doctorName)}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 flex items-center space-x-1.5 transition"
                      >
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>Manage Weekly Shifts</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: EXPORT REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Export Clinic Reports</h3>
                <p className="text-xs text-slate-500">
                  Generate professional spreadsheet (.xlsx) and printable PDF summaries of doctor shifts and attended patient counts.
                </p>
              </div>

              {/* Date Range Selection */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-600">From:</span>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 text-slate-800"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-600">To:</span>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 text-slate-800"
                  />
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={setRangeToday}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                  >
                    Today
                  </button>
                  <button
                    onClick={setRangeLast7Days}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={setRangeThisMonth}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                  >
                    This Month
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap gap-4">
                <a
                  href={`/api/reports/excel?startDate=${reportStartDate}&endDate=${reportEndDate}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs flex items-center space-x-2 transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download Excel (.xlsx)</span>
                </a>

                <a
                  href={`/api/reports/pdf?startDate=${reportStartDate}&endDate=${reportEndDate}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs flex items-center space-x-2 transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download PDF (.pdf)</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SCHEDULE MANAGEMENT MODAL */}
      {managingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Weekly Shifts: {managingDoctor.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure recurring working days and time intervals.
                </p>
              </div>
              <button
                onClick={() => setManagingDoctor(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {loadingSchedules ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Loading existing schedules...
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {doctorSchedules.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No shifts configured yet. Click "Add Shift" below.
                  </p>
                ) : (
                  doctorSchedules.map((slot, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                    >
                      {/* Day of Week */}
                      <select
                        value={slot.dayOfWeek}
                        onChange={(e) =>
                          updateScheduleSlot(idx, 'dayOfWeek', parseInt(e.target.value))
                        }
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700 outline-none"
                      >
                        {DAY_NAMES.map((name, dayIndex) => (
                          <option key={dayIndex} value={dayIndex}>
                            {name}
                          </option>
                        ))}
                      </select>

                      {/* Start Time */}
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateScheduleSlot(idx, 'startTime', e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-mono text-slate-700 outline-none"
                      />

                      <span className="text-slate-400">to</span>

                      {/* End Time */}
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateScheduleSlot(idx, 'endTime', e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-mono text-slate-700 outline-none"
                      />

                      {/* Remove Button */}
                      <button
                        onClick={() => removeScheduleSlot(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Remove slot"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}

                <button
                  type="button"
                  onClick={addScheduleSlot}
                  className="w-full py-2 border border-dashed border-slate-300 hover:border-blue-400 rounded-xl text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center justify-center space-x-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Shift Slot</span>
                </button>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setManagingDoctor(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSchedules}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Schedules</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
