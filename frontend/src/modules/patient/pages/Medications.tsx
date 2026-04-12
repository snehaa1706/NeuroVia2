import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, PlusCircle, Pill, Clock, CalendarDays, ArrowRight, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Medication {
  id: number;
  name: string;
  dosage: string;
  time: string;
  days: string[];
  taken: boolean;
  skipped?: boolean;
  lastTakenDate?: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Medications = () => {
  const { t } = useTranslation();
  const [meds, setMeds] = useState<Medication[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', dosage: '', time: '', days: [...DAYS] });

  const today = new Date();
  const todayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][today.getDay()];
  const todayDate = today.toLocaleDateString();

  useEffect(() => {
    const raw = localStorage.getItem('neurovia_f2_meds');
    if (raw) {
      const loaded: Medication[] = JSON.parse(raw);
      const updated = loaded.map(m => ({
        ...m,
        taken: m.lastTakenDate === todayDate ? m.taken : false,
        skipped: m.lastTakenDate === todayDate ? m.skipped : false
      }));
      setMeds(updated);
    } else {
      const defaults: Medication[] = [
        { id: 1, name: 'Lisinopril', dosage: '10mg', time: '08:00', days: [...DAYS], taken: false },
        { id: 2, name: 'Donepezil', dosage: '5mg', time: '14:00', days: [...DAYS], taken: false },
        { id: 3, name: 'Metformin', dosage: '500mg', time: '20:00', days: ['Mon', 'Wed', 'Fri'], taken: false },
      ];
      setMeds(defaults);
      localStorage.setItem('neurovia_f2_meds', JSON.stringify(defaults));
    }
  }, []);

  const saveMeds = (updated: Medication[]) => {
    setMeds(updated);
    localStorage.setItem('neurovia_f2_meds', JSON.stringify(updated));
  };

  const updateStatus = async (id: number, status: 'taken' | 'skipped') => {
    let wasSkipped = false;
    let medName = "Medication";

    const updated = meds.map(m => {
      if (m.id === id) {
        medName = m.name;
        if (status === 'taken') {
          return { ...m, taken: !m.taken, skipped: false, lastTakenDate: todayDate };
        } else {
          // If we are marking it as skipped (and it's currently NOT skipped)
          if (!m.skipped) wasSkipped = true;
          return { ...m, taken: false, skipped: !m.skipped, lastTakenDate: todayDate };
        }
      }
      return m;
    });
    
    saveMeds(updated);

    if (wasSkipped) {
      try {
        const token = localStorage.getItem('neurovia_patient_token');
        await fetch(`${API_URL}/health/incident`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            incident_type: 'missed_medication',
            severity: 'moderate',
            description: `Patient missed scheduled medication: ${medName}`,
            metadata: { medication_id: id, medication_name: medName }
          })
        });
      } catch (e) {
        console.error("Failed to log missed medication incident:", e);
      }
    }
  };

  const removeMed = (id: number) => {
    saveMeds(meds.filter(m => m.id !== id));
  };

  const handleAdd = () => {
    if (newMed.name && newMed.dosage && newMed.time && newMed.days.length > 0) {
      const updated = [...meds, { ...newMed, id: Date.now(), taken: false }];
      saveMeds(updated);
      setNewMed({ name: '', dosage: '', time: '', days: [...DAYS] });
      setIsAdding(false);
    }
  };

  const toggleDay = (day: string) => {
    setNewMed(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
    }));
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const todayMeds = meds.filter(m => m.days.includes(todayName)).sort((a, b) => a.time.localeCompare(b.time));
  const nextMed = todayMeds.find(m => !m.taken && !m.skipped);
  const takenCount = todayMeds.filter(m => m.taken).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-(--color-navy)">{t('medication_schedule')}</h2>
          <p className="text-(--color-navy)/50 mt-1">{todayMeds.length} {t('meds_scheduled_for')} {todayName}</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-(--color-sage) text-white px-6 py-3 rounded-2xl text-lg font-bold hover:bg-[#6b8c84] transition-colors shadow-sm"
        >
          <PlusCircle className="w-6 h-6" />
          {t('add_medication')}
        </button>
      </div>

      {/* Next Pill Indicator */}
      {nextMed && (
        <div className="bg-gradient-to-r from-[#003049] to-[#003049]/80 rounded-3xl p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <ArrowRight className="w-8 h-8" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-bold uppercase tracking-wider">{t('next_pill')}</p>
              <p className="text-2xl font-bold">{nextMed.name} — {nextMed.dosage}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-2xl">
            <Clock className="w-5 h-5 text-white/80" />
            <span className="text-xl font-bold">{formatTime(nextMed.time)}</span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-(--color-border-light)">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-(--color-navy)">{t('todays_progress')}</span>
          <span className="text-sm font-bold text-(--color-sage)">{takenCount} / {todayMeds.length} {t('taken')}</span>
        </div>
        <div className="w-full bg-(--color-border-light) rounded-full h-3 overflow-hidden">
          <div className="bg-gradient-to-r from-(--color-sage) to-[#6b8c84] h-3 rounded-full transition-all duration-700" style={{ width: todayMeds.length > 0 ? `${(takenCount / todayMeds.length) * 100}%` : '0%' }} />
        </div>
      </div>

      {/* Add Medication Form */}
      {isAdding && (
        <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-(--color-sage)/30 fade-in">
          <h3 className="text-2xl font-bold text-(--color-navy) mb-5">{t('new_medication')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="text-xs font-bold text-(--color-navy)/50 uppercase tracking-wider mb-1 block">{t('med_name')}</label>
              <input type="text" placeholder="e.g. Aspirin" value={newMed.name}
                onChange={e => setNewMed({...newMed, name: e.target.value})}
                className="w-full p-3 border-2 border-(--color-border-light) rounded-xl bg-(--color-surface-alt) outline-none focus:border-(--color-sage) text-(--color-navy) font-medium" />
            </div>
            <div>
              <label className="text-xs font-bold text-(--color-navy)/50 uppercase tracking-wider mb-1 block">{t('dosage')}</label>
              <input type="text" placeholder="e.g. 50mg" value={newMed.dosage}
                onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                className="w-full p-3 border-2 border-(--color-border-light) rounded-xl bg-(--color-surface-alt) outline-none focus:border-(--color-sage) text-(--color-navy) font-medium" />
            </div>
            <div>
              <label className="text-xs font-bold text-(--color-navy)/50 uppercase tracking-wider mb-1 block">{t('time')}</label>
              <input type="time" value={newMed.time}
                onChange={e => setNewMed({...newMed, time: e.target.value})}
                className="w-full p-3 border-2 border-(--color-border-light) rounded-xl bg-(--color-surface-alt) outline-none focus:border-(--color-sage) text-(--color-navy) font-medium" />
            </div>
          </div>
          {/* Day Selector */}
          <div className="mb-5">
            <label className="text-xs font-bold text-(--color-navy)/50 uppercase tracking-wider mb-2 block flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> {t('days')}
            </label>
            <div className="flex gap-2">
              {DAYS.map(day => (
                <button key={day} onClick={() => toggleDay(day)}
                  className={`w-12 h-12 rounded-xl text-sm font-bold transition-all ${
                    newMed.days.includes(day)
                      ? 'bg-(--color-navy) text-white shadow-md'
                      : 'bg-(--color-surface-alt) text-(--color-navy)/50 border border-(--color-border-light) hover:border-(--color-navy)/30'
                  }`}>{day}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-4 justify-end">
            <button onClick={() => setIsAdding(false)} className="px-6 py-2 text-(--color-navy) font-bold hover:bg-(--color-surface-alt) rounded-xl transition-colors">{t('cancel')}</button>
            <button onClick={handleAdd} className="px-6 py-2 bg-(--color-sage) text-white font-bold rounded-xl hover:bg-[#6b8c84] transition-colors">{t('save_medication')}</button>
          </div>
        </div>
      )}

      {/* Today's Medication List */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-(--color-border-light)">
        <h3 className="text-xl font-bold text-(--color-navy) mb-4 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-(--color-sage)" /> {t('today')} — {todayName}
        </h3>
        <div className="space-y-3">
          {todayMeds.map((med) => {
            const isNext = nextMed?.id === med.id;
            return (
              <div 
                key={med.id} 
                className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-default group ${
                  med.taken
                    ? 'bg-(--color-surface-alt)/50 border-(--color-border-light)'
                    : med.skipped
                      ? 'bg-red-50/50 border-red-100 opacity-80'
                      : isNext
                        ? 'bg-gradient-to-r from-(--color-sage)/5 to-transparent border-(--color-sage) shadow-md'
                        : 'bg-white border-(--color-border-light) hover:border-(--color-sage)/50'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    med.taken || med.skipped ? 'bg-(--color-border-light) text-(--color-navy)/40'
                    : isNext ? 'bg-(--color-sage) text-white shadow-md' : 'bg-(--color-sage)/10 text-(--color-sage)'
                  }`}>
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className={`text-xl font-bold ${med.taken || med.skipped ? 'text-(--color-navy)/40 line-through' : 'text-(--color-navy)'}`}>
                      {med.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-medium text-(--color-navy)/60 bg-(--color-surface-alt) px-2 py-0.5 rounded">{med.dosage}</span>
                      <span className="text-sm font-medium text-(--color-sage) flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(med.time)}</span>
                      <span className="text-xs text-(--color-navy)/40">{med.days.join(', ')}</span>
                    </div>
                  </div>
                  {isNext && !med.taken && <span className="ml-3 px-3 py-1 bg-(--color-sage) text-white text-xs font-bold rounded-full uppercase tracking-wider animate-pulse">{t('next')}</span>}
                </div>
                
                <div className="flex items-center gap-3">
                  <button onClick={() => removeMed(med.id)} className="p-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-5 h-5" /></button>
                  
                  <button 
                    onClick={() => updateStatus(med.id, 'skipped')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${
                      med.skipped 
                        ? 'bg-red-50 border-red-200 text-red-500' 
                        : 'border-transparent bg-(--color-surface-alt) text-(--color-navy)/40 hover:bg-red-50 hover:text-red-400'
                    }`}
                  >
                    {t('not_taken', 'Not Taken')}
                  </button>

                  <button 
                    onClick={() => updateStatus(med.id, 'taken')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all border-2 flex items-center gap-2 ${
                      med.taken 
                        ? 'bg-(--color-sage) border-(--color-sage) text-white shadow-sm' 
                        : 'border-transparent bg-(--color-surface-alt) text-(--color-navy)/40 hover:bg-(--color-sage)/10 hover:text-(--color-sage)'
                    }`}
                  >
                    {med.taken && <CheckCircle2 className="w-4 h-4" />}
                    {t('taken', 'Taken')}
                  </button>
                </div>
              </div>
            );
          })}
          {todayMeds.length === 0 && <p className="text-center text-(--color-navy)/50 py-8">{t('no_meds_today')} {todayName}.</p>}
        </div>
      </div>

      {/* Full Week View */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-(--color-border-light)">
        <h3 className="text-xl font-bold text-(--color-navy) mb-4">{t('weekly_schedule')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-3 text-(--color-navy)/50 font-bold uppercase tracking-wider text-xs">{t('medication')}</th>
                {DAYS.map(d => (
                  <th key={d} className={`p-3 text-center text-xs font-bold uppercase tracking-wider ${d === todayName ? 'text-(--color-sage)' : 'text-(--color-navy)/50'}`}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meds.map(med => (
                <tr key={med.id} className="border-t border-(--color-border-light)">
                  <td className="p-3 font-bold text-(--color-navy)">{med.name} <span className="text-(--color-navy)/40 font-normal text-xs">{med.dosage}</span></td>
                  {DAYS.map(d => (
                    <td key={d} className="p-3 text-center">
                      {med.days.includes(d) ? (
                        <span className={`inline-block w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          d === todayName && med.taken ? 'bg-(--color-sage) text-white' 
                          : d === todayName ? 'bg-(--color-sage)/20 text-(--color-sage) border border-(--color-sage)' 
                          : 'bg-(--color-surface-alt) text-(--color-navy)/60'
                        }`}>{formatTime(med.time).split(':')[0]}</span>
                      ) : <span className="text-(--color-navy)/20">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Medications;
