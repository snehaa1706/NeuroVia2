import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, AlertCircle, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import { doctorApi } from '../services/doctorApi';
import { useNavigate } from 'react-router-dom';

// ─── Helpers ──────────────────────────────────────────
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function groupByDate(consultations: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};
  for (const c of consultations) {
    const ts = c.time_slot || c.created_at;
    if (!ts) continue;
    const key = toDateKey(new Date(ts));
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  }
  // Sort each day's consultations by time
  for (const key in grouped) {
    grouped[key].sort((a: any, b: any) => {
      const ta = new Date(a.time_slot || a.created_at).getTime();
      const tb = new Date(b.time_slot || b.created_at).getTime();
      return ta - tb;
    });
  }
  return grouped;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// ─── Status Helpers ───────────────────────────────────
const statusConfig: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  pending:   { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200', icon: Clock,        label: 'Pending' },
  accepted:  { color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',  icon: MessageSquare, label: 'In Progress' },
  completed: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2, label: 'Completed' },
  cancelled: { color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',   icon: XCircle,      label: 'Cancelled' },
};

function getStatus(status: string) {
  return statusConfig[status] || statusConfig.pending;
}

// ─── Component ────────────────────────────────────────
const DoctorSchedule = () => {
  const navigate = useNavigate();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(today));
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await doctorApi.getConsultations();
        setConsultations(data);
      } catch (err) {
        console.error('Error fetching schedule data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const grouped = useMemo(() => groupByDate(consultations), [consultations]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const todayKey = toDateKey(today);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayKey);
  };

  // Compute stats
  const rawSelectedConsultations = grouped[selectedDate] || [];
  const selectedConsultations = statusFilter === 'all' 
    ? rawSelectedConsultations 
    : rawSelectedConsultations.filter((c: any) => c.status === statusFilter);

  const handleQuickAction = async (e: React.MouseEvent, id: string, newStatus: string) => {
    e.stopPropagation();
    try {
      await doctorApi.updateConsultationStatus(id, newStatus);
      const data = await doctorApi.getConsultations();
      setConsultations(data);
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const totalThisMonth = Object.entries(grouped)
    .filter(([key]) => key.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`))
    .reduce((sum, [, arr]) => sum + arr.length, 0);

  const pendingCount = consultations.filter(c => c.status === 'pending').length;
  const todayCount = (grouped[todayKey] || []).length;

  // Working hours (from localStorage)
  const storedUser = localStorage.getItem('neurovia_doctor_user');
  const doctor = storedUser ? JSON.parse(storedUser) : null;

  // Time slots for day view (7 AM to 8 PM)
  const daySlots = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 7;
    return `${String(hour).padStart(2, '0')}:00`;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-(--color-navy) mb-2">Schedule</h2>
          <p className="text-lg text-(--color-navy)/60 font-medium">Your consultation calendar and daily agenda.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={goToToday} className="px-5 py-3 bg-white border border-(--color-border-light) rounded-2xl font-bold text-(--color-navy) hover:bg-(--color-surface-alt) transition-all shadow-sm">
            Today
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-(--color-border-light) shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-(--color-navy)">{todayCount}</div>
            <div className="text-xs font-bold text-(--color-navy)/40 uppercase tracking-wider">Today</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-(--color-border-light) shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-(--color-navy)">{pendingCount}</div>
            <div className="text-xs font-bold text-(--color-navy)/40 uppercase tracking-wider">Pending</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-(--color-border-light) shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-(--color-navy)">{totalThisMonth}</div>
            <div className="text-xs font-bold text-(--color-navy)/40 uppercase tracking-wider">This Month</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ─── Month Calendar ─────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-(--color-border-light) shadow-sm overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-(--color-border-light)">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-(--color-surface-alt) rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-(--color-navy)/60" />
            </button>
            <h3 className="text-2xl font-bold text-(--color-navy)">
              {MONTHS[currentMonth]} {currentYear}
            </h3>
            <button onClick={handleNextMonth} className="p-2 hover:bg-(--color-surface-alt) rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5 text-(--color-navy)/60" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 px-4 pt-4">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-xs font-black text-(--color-navy)/30 uppercase tracking-widest py-3">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 px-4 pb-6">
            {/* Empty cells for first week offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayConsultations = grouped[dateKey] || [];
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDate;
              const hasPending = dayConsultations.some((c: any) => c.status === 'pending');
              const hasCompleted = dayConsultations.some((c: any) => c.status === 'completed');

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateKey)}
                  className={`h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all relative group mx-0.5 my-0.5
                    ${isSelected
                      ? 'bg-(--color-navy) text-white shadow-lg shadow-(--color-navy)/20'
                      : isToday
                        ? 'bg-(--color-sage)/10 text-(--color-navy) border-2 border-(--color-sage)/30'
                        : 'hover:bg-(--color-surface-alt) text-(--color-navy)'
                    }`
                  }
                >
                  <span className={`text-lg font-bold ${isSelected ? 'text-white' : ''}`}>{day}</span>
                  {dayConsultations.length > 0 && (
                    <div className="flex items-center gap-1">
                      {hasPending && <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-400'}`} />}
                      {hasCompleted && <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-400'}`} />}
                      <span className={`text-[10px] font-black ${isSelected ? 'text-white/70' : 'text-(--color-navy)/40'}`}>
                        {dayConsultations.length}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Day Detail Sidebar ────────────────── */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-(--color-border-light) shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-(--color-border-light)">
              <h3 className="text-xl font-bold text-(--color-navy)">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <p className="text-sm text-(--color-navy)/40 font-medium mt-1 mb-4">
                {rawSelectedConsultations.length} consultation{rawSelectedConsultations.length !== 1 ? 's' : ''} scheduled
              </p>
              
              {/* Status Filters */}
              <div className="flex bg-(--color-surface-alt) p-1 rounded-xl w-fit">
                {['all', 'pending', 'accepted', 'completed'].map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                      statusFilter === f 
                        ? 'bg-white text-(--color-navy) shadow-sm' 
                        : 'text-(--color-navy)/50 hover:text-(--color-navy)'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center animate-pulse text-(--color-navy)/30">Loading...</div>
            ) : selectedConsultations.length > 0 ? (
              <div className="divide-y divide-(--color-border-light) max-h-[500px] overflow-y-auto">
                {selectedConsultations.map((c: any) => {
                  const status = getStatus(c.status);
                  const StatusIcon = status.icon;
                  const time = c.time_slot ? new Date(c.time_slot).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Unscheduled';

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        const base = window.location.pathname.startsWith('/consult') ? '/consult/doctor' : '/doctor';
                        navigate(`${base}/consultation/${c.id}`);
                      }}
                      className="p-4 hover:bg-(--color-surface-alt) transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${status.bg} ${status.color}`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-bold text-(--color-navy) text-sm truncate">
                              {c.patient?.full_name || 'Unknown Patient'}
                            </h5>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${status.bg} ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-(--color-navy)/40 font-medium">
                            <Clock className="w-3 h-3" />
                            {time}
                          </div>
                        </div>
                        {c.status === 'pending' && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={(e) => handleQuickAction(e, c.id, 'accepted')}
                              className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              title="Accept"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleQuickAction(e, c.id, 'cancelled')}
                              className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              title="Decline"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center">
                <div className="w-14 h-14 bg-(--color-surface-alt) rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-7 h-7 text-(--color-navy)/15" />
                </div>
                <h4 className="text-lg font-bold text-(--color-navy) mb-1">No Appointments</h4>
                <p className="text-sm text-(--color-navy)/40">No consultations on this day.</p>
              </div>
            )}
          </div>

          {/* Availability Info */}
          <div className="bg-white rounded-3xl border border-(--color-border-light) shadow-sm p-6">
            <h4 className="text-sm font-black text-(--color-navy)/50 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Availability
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-(--color-surface-alt) rounded-xl">
                <span className="text-sm font-medium text-(--color-navy)">Next Available</span>
                <span className="text-sm font-bold text-(--color-sage)">
                  {(() => {
                    // Find next unbooked day from today
                    for (let i = 0; i < 30; i++) {
                      const d = new Date();
                      d.setDate(d.getDate() + i);
                      const key = toDateKey(d);
                      const dayCount = (grouped[key] || []).filter((c: any) => c.status !== 'cancelled').length;
                      if (dayCount < 8) { // Less than 8 appointments = has availability
                        if (i === 0) return 'Today';
                        if (i === 1) return 'Tomorrow';
                        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                      }
                    }
                    return 'Check calendar';
                  })()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-(--color-surface-alt) rounded-xl">
                <span className="text-sm font-medium text-(--color-navy)">Today's Load</span>
                <span className={`text-sm font-bold ${todayCount > 6 ? 'text-red-500' : todayCount > 3 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {todayCount === 0 ? 'Free' : todayCount <= 3 ? 'Light' : todayCount <= 6 ? 'Moderate' : 'Heavy'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-(--color-surface-alt) rounded-xl">
                <span className="text-sm font-medium text-(--color-navy)">Busiest Day</span>
                <span className="text-sm font-bold text-(--color-navy)">
                  {(() => {
                    let maxDay = '';
                    let maxCount = 0;
                    for (const [key, arr] of Object.entries(grouped)) {
                      if (arr.length > maxCount) {
                        maxCount = arr.length;
                        maxDay = key;
                      }
                    }
                    if (!maxDay) return 'N/A';
                    return new Date(maxDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-2xl border border-(--color-border-light) shadow-sm p-5">
            <h4 className="text-xs font-black text-(--color-navy)/40 uppercase tracking-widest mb-3">Legend</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${cfg.bg} border ${cfg.border}`} />
                  <span className="text-xs font-semibold text-(--color-navy)/60 capitalize">{key}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSchedule;
