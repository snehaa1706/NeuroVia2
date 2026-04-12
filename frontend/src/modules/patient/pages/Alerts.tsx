import React, { useState, useEffect } from 'react';
import { Bell, Calendar, FileText, AlertCircle, Clock, CheckCircle2, XCircle, Pill, ChevronDown, ChevronRight, User, MapPin, Phone, Trash2, Plus } from 'lucide-react';

// ── Types ──
interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
}

interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  date: string;
  duration: string;
  status: 'active' | 'completed' | 'discontinued';
  refillsLeft?: number;
  instructions?: string;
}

interface AlertItem {
  id: string;
  type: 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  time: string;
  read: boolean;
  category: 'medication' | 'appointment' | 'score' | 'system';
}

// ── Seed Data ──
const SEED_APPOINTMENTS: Appointment[] = [
  { id: 'a1', doctorName: 'Dr. Sarah Mitchell', specialty: 'Neurologist', date: '2026-04-15', time: '10:00 AM', location: 'NeuroVia Clinic, Room 204', status: 'upcoming', notes: 'Follow-up cognitive assessment' },
  { id: 'a2', doctorName: 'Dr. James Park', specialty: 'Psychiatrist', date: '2026-04-20', time: '2:30 PM', location: 'Mental Health Center, Suite 5B', status: 'upcoming', notes: 'Medication review' },
  { id: 'a3', doctorName: 'Dr. Sarah Mitchell', specialty: 'Neurologist', date: '2026-03-28', time: '10:00 AM', location: 'NeuroVia Clinic, Room 204', status: 'completed', notes: 'Initial screening completed. MMSE score: 26/30.' },
  { id: 'a4', doctorName: 'Dr. Priya Sharma', specialty: 'Geriatrician', date: '2026-03-15', time: '11:30 AM', location: 'City Hospital, Wing C', status: 'completed', notes: 'General health assessment. All vitals normal.' },
  { id: 'a5', doctorName: 'Dr. James Park', specialty: 'Psychiatrist', date: '2026-03-10', time: '3:00 PM', location: 'Mental Health Center, Suite 5B', status: 'cancelled', notes: 'Patient rescheduled.' },
];

const SEED_PRESCRIPTIONS: Prescription[] = [
  { id: 'p1', medication: 'Donepezil (Aricept)', dosage: '10mg', frequency: 'Once daily', prescribedBy: 'Dr. Sarah Mitchell', date: '2026-03-28', duration: '3 months', status: 'active', refillsLeft: 2, instructions: 'Take at bedtime. May cause nausea initially.' },
  { id: 'p2', medication: 'Memantine (Namenda)', dosage: '5mg', frequency: 'Twice daily', prescribedBy: 'Dr. Sarah Mitchell', date: '2026-03-28', duration: '3 months', status: 'active', refillsLeft: 2, instructions: 'Start with 5mg once daily, increase to twice daily after 1 week.' },
  { id: 'p3', medication: 'Vitamin B12', dosage: '1000mcg', frequency: 'Once daily', prescribedBy: 'Dr. Priya Sharma', date: '2026-03-15', duration: '6 months', status: 'active', refillsLeft: 5, instructions: 'Take with food.' },
  { id: 'p4', medication: 'Sertraline (Zoloft)', dosage: '50mg', frequency: 'Once daily (morning)', prescribedBy: 'Dr. James Park', date: '2026-02-20', duration: '2 months', status: 'completed', instructions: 'Completed course. Mood improvement noted.' },
  { id: 'p5', medication: 'Melatonin', dosage: '3mg', frequency: 'At bedtime', prescribedBy: 'Dr. James Park', date: '2026-01-10', duration: '1 month', status: 'discontinued', instructions: 'Discontinued due to morning grogginess.' },
];

const SEED_ALERTS: AlertItem[] = [
  { id: 'n1', type: 'high', title: 'Missed Medication', description: 'You missed your Donepezil dose yesterday. Please take it tonight and set a reminder.', time: '2 hours ago', read: false, category: 'medication' },
  { id: 'n2', type: 'medium', title: 'Upcoming Appointment', description: 'Reminder: Appointment with Dr. Sarah Mitchell on Apr 15 at 10:00 AM.', time: '1 day ago', read: false, category: 'appointment' },
  { id: 'n3', type: 'low', title: 'Cognitive Score Update', description: 'Your weekly cognitive score improved by 5% — great progress! Keep completing daily activities.', time: '2 days ago', read: true, category: 'score' },
  { id: 'n4', type: 'info', title: 'Prescription Refill Needed', description: 'Your Memantine prescription has 2 refills remaining. Consider requesting a refill from your doctor.', time: '3 days ago', read: true, category: 'medication' },
  { id: 'n5', type: 'medium', title: 'Activity Goal Streak', description: 'You completed daily activities 5 days in a row! Consistency is key for cognitive health.', time: '4 days ago', read: true, category: 'score' },
  { id: 'n6', type: 'low', title: 'New Exercise Available', description: 'A new Story Recall exercise has been added to your activity library. Try it today!', time: '5 days ago', read: true, category: 'system' },
];

const STORAGE_KEYS = {
  appointments: 'neurovia_notifications_appointments',
  prescriptions: 'neurovia_notifications_prescriptions',
  alerts: 'neurovia_notifications_alerts',
};

// ── Helpers ──
const formatDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
};

const statusBadge = (s: string) => {
  const classes: Record<string, string> = {
    upcoming: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    discontinued: 'bg-orange-100 text-orange-600 border-orange-200',
  };
  return classes[s] || 'bg-gray-100 text-gray-600 border-gray-200';
};

const statusIcon = (s: string) => {
  if (s === 'upcoming') return <Clock className="w-4 h-4" />;
  if (s === 'completed') return <CheckCircle2 className="w-4 h-4" />;
  if (s === 'cancelled' || s === 'discontinued') return <XCircle className="w-4 h-4" />;
  if (s === 'active') return <CheckCircle2 className="w-4 h-4" />;
  return null;
};

const alertColor = (type: string) => {
  const m: Record<string, { bg: string; border: string; icon: string; dot: string }> = {
    high:   { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500', dot: 'bg-red-500' },
    medium: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', dot: 'bg-amber-500' },
    low:    { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', dot: 'bg-blue-500' },
    info:   { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-500', dot: 'bg-purple-500' },
  };
  return m[type] || m.info;
};

// ──────────────
// MAIN COMPONENT
// ──────────────
type Tab = 'all' | 'appointments' | 'prescriptions' | 'alerts';

const Alerts = () => {
  const [tab, setTab] = useState<Tab>('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [expandedAppt, setExpandedAppt] = useState<string | null>(null);
  const [expandedRx, setExpandedRx] = useState<string | null>(null);

  // Load data from localStorage — seed on first visit
  useEffect(() => {
    const loadOrSeed = <T,>(key: string, seed: T[]): T[] => {
      const raw = localStorage.getItem(key);
      if (raw) { try { return JSON.parse(raw); } catch { /* fall through */ } }
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    };
    setAppointments(loadOrSeed(STORAGE_KEYS.appointments, SEED_APPOINTMENTS));
    setPrescriptions(loadOrSeed(STORAGE_KEYS.prescriptions, SEED_PRESCRIPTIONS));
    setAlerts(loadOrSeed(STORAGE_KEYS.alerts, SEED_ALERTS));
  }, []);

  const markAlertRead = (id: string) => {
    const updated = alerts.map(a => a.id === id ? { ...a, read: true } : a);
    setAlerts(updated);
    localStorage.setItem(STORAGE_KEYS.alerts, JSON.stringify(updated));
  };

  const clearAlert = (id: string) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    localStorage.setItem(STORAGE_KEYS.alerts, JSON.stringify(updated));
  };

  const unreadCount = alerts.filter(a => !a.read).length;
  const upcomingAppts = appointments.filter(a => a.status === 'upcoming');
  const pastAppts = appointments.filter(a => a.status !== 'upcoming');
  const activeRx = prescriptions.filter(p => p.status === 'active');
  const pastRx = prescriptions.filter(p => p.status !== 'active');

  // ── TAB BUTTONS ──
  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'all', label: 'All', icon: <Bell className="w-4 h-4" />, badge: unreadCount },
    { key: 'appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" />, badge: upcomingAppts.length },
    { key: 'prescriptions', label: 'Prescriptions', icon: <FileText className="w-4 h-4" />, badge: activeRx.length },
    { key: 'alerts', label: 'Alerts', icon: <AlertCircle className="w-4 h-4" /> },
  ];

  // ── Appointment Card ──
  const AppointmentCard = ({ appt }: { appt: Appointment }) => {
    const expanded = expandedAppt === appt.id;
    return (
      <div className={`bg-white rounded-2xl border ${appt.status === 'upcoming' ? 'border-(--color-sage)/30 shadow-md shadow-(--color-sage)/5' : 'border-(--color-border-light)'} overflow-hidden transition-all`}>
        <button onClick={() => setExpandedAppt(expanded ? null : appt.id)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-(--color-surface-alt)/50 transition-colors">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${appt.status === 'upcoming' ? 'bg-(--color-sage)/10' : 'bg-(--color-surface-alt)'}`}>
            <Calendar className={`w-5 h-5 ${appt.status === 'upcoming' ? 'text-(--color-sage)' : 'text-(--color-navy)/30'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-(--color-navy) truncate">{appt.doctorName}</h4>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full border flex items-center gap-1 shrink-0 ${statusBadge(appt.status)}`}>
                {statusIcon(appt.status)} {appt.status}
              </span>
            </div>
            <p className="text-sm text-(--color-navy)/50">{appt.specialty} • {formatDate(appt.date)} at {appt.time}</p>
          </div>
          {expanded ? <ChevronDown className="w-5 h-5 text-(--color-navy)/30 shrink-0" /> : <ChevronRight className="w-5 h-5 text-(--color-navy)/30 shrink-0" />}
        </button>
        {expanded && (
          <div className="px-5 pb-5 pt-0 border-t border-(--color-border-light) space-y-3 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-(--color-navy)/60">
                <User className="w-4 h-4 text-(--color-sage)" /> <span className="font-semibold">{appt.doctorName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-(--color-navy)/60">
                <MapPin className="w-4 h-4 text-(--color-sage)" /> <span>{appt.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-(--color-navy)/60">
                <Clock className="w-4 h-4 text-(--color-sage)" /> <span>{formatDate(appt.date)} at {appt.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-(--color-navy)/60">
                <Phone className="w-4 h-4 text-(--color-sage)" /> <span>Contact clinic for changes</span>
              </div>
            </div>
            {appt.notes && (
              <div className="p-3 bg-(--color-surface-alt) rounded-xl">
                <p className="text-sm text-(--color-navy)/70"><span className="font-bold text-(--color-navy)">Notes: </span>{appt.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Prescription Card ──
  const PrescriptionCard = ({ rx }: { rx: Prescription }) => {
    const expanded = expandedRx === rx.id;
    return (
      <div className={`bg-white rounded-2xl border ${rx.status === 'active' ? 'border-emerald-200 shadow-md shadow-emerald-500/5' : 'border-(--color-border-light)'} overflow-hidden transition-all`}>
        <button onClick={() => setExpandedRx(expanded ? null : rx.id)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-(--color-surface-alt)/50 transition-colors">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${rx.status === 'active' ? 'bg-emerald-50' : 'bg-(--color-surface-alt)'}`}>
            <Pill className={`w-5 h-5 ${rx.status === 'active' ? 'text-emerald-600' : 'text-(--color-navy)/30'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-(--color-navy) truncate">{rx.medication}</h4>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full border flex items-center gap-1 shrink-0 ${statusBadge(rx.status)}`}>
                {statusIcon(rx.status)} {rx.status}
              </span>
            </div>
            <p className="text-sm text-(--color-navy)/50">{rx.dosage} • {rx.frequency} • by {rx.prescribedBy}</p>
          </div>
          {expanded ? <ChevronDown className="w-5 h-5 text-(--color-navy)/30 shrink-0" /> : <ChevronRight className="w-5 h-5 text-(--color-navy)/30 shrink-0" />}
        </button>
        {expanded && (
          <div className="px-5 pb-5 pt-0 border-t border-(--color-border-light) space-y-3 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="text-sm"><span className="font-bold text-(--color-navy)">Dosage:</span> <span className="text-(--color-navy)/60">{rx.dosage}</span></div>
              <div className="text-sm"><span className="font-bold text-(--color-navy)">Frequency:</span> <span className="text-(--color-navy)/60">{rx.frequency}</span></div>
              <div className="text-sm"><span className="font-bold text-(--color-navy)">Duration:</span> <span className="text-(--color-navy)/60">{rx.duration}</span></div>
              <div className="text-sm"><span className="font-bold text-(--color-navy)">Prescribed:</span> <span className="text-(--color-navy)/60">{formatDate(rx.date)}</span></div>
              <div className="text-sm"><span className="font-bold text-(--color-navy)">Doctor:</span> <span className="text-(--color-navy)/60">{rx.prescribedBy}</span></div>
              {rx.refillsLeft !== undefined && (
                <div className="text-sm"><span className="font-bold text-(--color-navy)">Refills Left:</span> <span className={`font-bold ${rx.refillsLeft <= 1 ? 'text-red-500' : 'text-emerald-600'}`}>{rx.refillsLeft}</span></div>
              )}
            </div>
            {rx.instructions && (
              <div className="p-3 bg-(--color-surface-alt) rounded-xl">
                <p className="text-sm text-(--color-navy)/70"><span className="font-bold text-(--color-navy)">Instructions: </span>{rx.instructions}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Alert Card ──
  const AlertCard = ({ alert: a }: { alert: AlertItem }) => {
    const c = alertColor(a.type);
    return (
      <div className={`flex gap-4 p-4 rounded-2xl border ${c.bg} ${c.border} ${!a.read ? 'ring-2 ring-offset-1 ring-' + c.dot.replace('bg-', '') + '/30' : 'opacity-80'} transition-all`} onClick={() => markAlertRead(a.id)}>
        <div className="pt-0.5 shrink-0">
          {!a.read && <div className={`w-2.5 h-2.5 rounded-full ${c.dot} animate-pulse`} />}
          {a.read && <div className="w-2.5 h-2.5 rounded-full bg-transparent" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-bold text-sm ${!a.read ? 'text-(--color-navy)' : 'text-(--color-navy)/60'}`}>{a.title}</h4>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-white/60 text-(--color-navy)/40 border border-(--color-border-light)">{a.category}</span>
          </div>
          <p className="text-sm text-(--color-navy)/50 mb-1">{a.description}</p>
          <p className="text-xs text-(--color-navy)/30 font-semibold">{a.time}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); clearAlert(a.id); }} className="text-(--color-navy)/20 hover:text-red-400 transition-colors p-1 shrink-0 self-start">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 fade-in pb-12">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-(--color-navy)">Notifications</h1>
          <p className="text-(--color-navy)/50 mt-1">Appointments, prescriptions, and alerts in one place.</p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full border border-red-200">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-bold text-sm text-red-600">{unreadCount} unread</span>
          </div>
        )}
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-(--color-border-light) text-center">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2"><Calendar className="w-5 h-5 text-blue-500" /></div>
          <p className="text-2xl font-black text-(--color-navy)">{upcomingAppts.length}</p>
          <p className="text-xs font-bold text-(--color-navy)/40 uppercase">Upcoming</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-(--color-border-light) text-center">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2"><Pill className="w-5 h-5 text-emerald-500" /></div>
          <p className="text-2xl font-black text-(--color-navy)">{activeRx.length}</p>
          <p className="text-xs font-bold text-(--color-navy)/40 uppercase">Active Rx</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-(--color-border-light) text-center">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2"><Bell className="w-5 h-5 text-amber-500" /></div>
          <p className="text-2xl font-black text-(--color-navy)">{unreadCount}</p>
          <p className="text-xs font-bold text-(--color-navy)/40 uppercase">Unread</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-(--color-border-light) text-center">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2"><FileText className="w-5 h-5 text-purple-500" /></div>
          <p className="text-2xl font-black text-(--color-navy)">{pastAppts.length}</p>
          <p className="text-xs font-bold text-(--color-navy)/40 uppercase">Past Visits</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 bg-(--color-surface-alt) p-1.5 rounded-2xl border border-(--color-border-light)">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
              tab === t.key
                ? 'bg-white text-(--color-navy) shadow-md'
                : 'text-(--color-navy)/40 hover:text-(--color-navy)/60'
            }`}>
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {t.badge !== undefined && t.badge > 0 && (
              <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${tab === t.key ? 'bg-(--color-sage) text-white' : 'bg-(--color-navy)/10 text-(--color-navy)/50'}`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: Appointments ── */}
      {(tab === 'all' || tab === 'appointments') && (
        <section>
          <h2 className="text-2xl font-bold text-(--color-navy) mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-(--color-sage)" /> Appointments
          </h2>

          {upcomingAppts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-(--color-navy)/40 uppercase tracking-wider mb-3">Upcoming</h3>
              <div className="space-y-3">{upcomingAppts.map(a => <AppointmentCard key={a.id} appt={a} />)}</div>
            </div>
          )}

          {pastAppts.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-(--color-navy)/40 uppercase tracking-wider mb-3">Past / Cancelled</h3>
              <div className="space-y-3">{pastAppts.map(a => <AppointmentCard key={a.id} appt={a} />)}</div>
            </div>
          )}

          {appointments.length === 0 && (
            <div className="text-center p-12 bg-white rounded-2xl border border-(--color-border-light)">
              <Calendar className="w-12 h-12 text-(--color-navy)/15 mx-auto mb-3" />
              <p className="font-bold text-(--color-navy)/40">No appointments yet</p>
            </div>
          )}
        </section>
      )}

      {/* ── TAB: Prescriptions ── */}
      {(tab === 'all' || tab === 'prescriptions') && (
        <section>
          <h2 className="text-2xl font-bold text-(--color-navy) mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-500" /> Prescriptions
          </h2>

          {activeRx.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-(--color-navy)/40 uppercase tracking-wider mb-3">Active Medications</h3>
              <div className="space-y-3">{activeRx.map(rx => <PrescriptionCard key={rx.id} rx={rx} />)}</div>
            </div>
          )}

          {pastRx.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-(--color-navy)/40 uppercase tracking-wider mb-3">Past / Discontinued</h3>
              <div className="space-y-3">{pastRx.map(rx => <PrescriptionCard key={rx.id} rx={rx} />)}</div>
            </div>
          )}

          {prescriptions.length === 0 && (
            <div className="text-center p-12 bg-white rounded-2xl border border-(--color-border-light)">
              <FileText className="w-12 h-12 text-(--color-navy)/15 mx-auto mb-3" />
              <p className="font-bold text-(--color-navy)/40">No prescriptions yet</p>
            </div>
          )}
        </section>
      )}

      {/* ── TAB: Alerts ── */}
      {(tab === 'all' || tab === 'alerts') && (
        <section>
          <h2 className="text-2xl font-bold text-(--color-navy) mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-amber-500" /> Alerts & Reminders
          </h2>
          <div className="space-y-3">
            {alerts.map(a => <AlertCard key={a.id} alert={a} />)}
            {alerts.length === 0 && (
              <div className="text-center p-12 bg-white rounded-2xl border border-(--color-border-light)">
                <Bell className="w-12 h-12 text-(--color-navy)/15 mx-auto mb-3" />
                <p className="font-bold text-(--color-navy)/40">All caught up! No alerts.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Alerts;
