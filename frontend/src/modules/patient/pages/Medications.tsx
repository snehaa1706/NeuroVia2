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
  lastTakenDate?: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
        taken: m.lastTakenDate === todayDate ? m.taken : false
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

  const toggleTaken = (id: number) => {
    const updated = meds.map(m => m.id === id ? { ...m, taken: !m.taken, lastTakenDate: todayDate } : m);
    saveMeds(updated);
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
  const nextMed = todayMeds.find(m => !m.taken);
  const takenCount = todayMeds.filter(m => m.taken).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in text-[#1a2744]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[1.8rem] font-bold text-[--color-navy] tracking-wide">{t('medication_schedule')}</h2>
          <p className="text-[--color-navy]/60 mt-0.5 text-[0.9rem]">{todayMeds.length} {t('meds_scheduled_for')} {todayName}</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 bg-[#6b7c52] text-white px-4 py-2 rounded-[12px] text-[0.9rem] font-bold hover:bg-[#556540] transition-all duration-300 hover:scale-105 hover:-translate-y-[2px] shadow-md hover:shadow-lg"
        >
          <PlusCircle className="w-5 h-5" />
          {t('add_medication')}
        </button>
      </div>

      {/* Next Pill Indicator */}
      {nextMed && (
        <div className="bg-gradient-to-r from-[#1a2744] to-[#2e3f6b] rounded-[24px] p-5 text-white flex items-center justify-between shadow-[0_4px_12px_rgba(26,39,68,0.15)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-[14px] flex items-center justify-center border border-white/20">
              <ArrowRight className="w-6 h-6 text-[#b8d49e]" />
            </div>
            <div>
              <p className="text-[#b8d49e]/80 text-[0.7rem] font-bold uppercase tracking-wider">{t('next_pill')}</p>
              <p className="text-[1.2rem] font-bold mt-0.5">{nextMed.name} — <span className="font-medium opacity-80">{nextMed.dosage}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-[16px] border border-white/10">
            <Clock className="w-4 h-4 text-white/80" />
            <span className="text-[1.05rem] font-bold">{formatTime(nextMed.time)}</span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-[#f5f0e8] hover:bg-[#e2dcd0] transition-all duration-300 rounded-[20px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-[#d2c8b9]/60">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-[--color-navy] text-[0.9rem]">{t('todays_progress')}</span>
          <span className="text-[0.8rem] font-bold text-[--color-sage]">{takenCount} / {todayMeds.length} {t('taken')}</span>
        </div>
        <div className="w-full bg-[--color-border-light] rounded-full h-2 overflow-hidden">
          <div className="bg-gradient-to-r from-[--color-sage] to-[--color-sage-light] h-2 rounded-full transition-all duration-700" style={{ width: todayMeds.length > 0 ? `${(takenCount / todayMeds.length) * 100}%` : '0%' }} />
        </div>
      </div>

      {/* Add Medication Form */}
      {isAdding && (
        <div className="bg-transparent rounded-[24px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-[--color-sage]/30 fade-in">
          <h3 className="text-xl font-bold text-[--color-navy] mb-4">{t('new_medication')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-[0.7rem] font-bold text-[--color-navy]/60 uppercase tracking-wider mb-1 block">{t('med_name')}</label>
              <input type="text" placeholder="e.g. Aspirin" value={newMed.name}
                onChange={e => setNewMed({...newMed, name: e.target.value})}
                className="w-full p-2.5 border border-[--color-border-light] rounded-[12px] bg-white/50 outline-none focus:border-[--color-sage] text-[--color-navy] font-medium text-[0.85rem]" />
            </div>
            <div>
              <label className="text-[0.7rem] font-bold text-[--color-navy]/60 uppercase tracking-wider mb-1 block">{t('dosage')}</label>
              <input type="text" placeholder="e.g. 50mg" value={newMed.dosage}
                onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                className="w-full p-2.5 border border-[--color-border-light] rounded-[12px] bg-white/50 outline-none focus:border-[--color-sage] text-[--color-navy] font-medium text-[0.85rem]" />
            </div>
            <div>
              <label className="text-[0.7rem] font-bold text-[--color-navy]/60 uppercase tracking-wider mb-1 block">{t('time')}</label>
              <input type="time" value={newMed.time}
                onChange={e => setNewMed({...newMed, time: e.target.value})}
                className="w-full p-2.5 border border-[--color-border-light] rounded-[12px] bg-white/50 outline-none focus:border-[--color-sage] text-[--color-navy] font-medium text-[0.85rem]" />
            </div>
          </div>
          {/* Day Selector */}
          <div className="mb-5">
            <label className="text-[0.7rem] font-bold text-[--color-navy]/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> {t('days')}
            </label>
            <div className="flex gap-1.5">
              {DAYS.map(day => (
                <button key={day} onClick={() => toggleDay(day)}
                  className={`w-10 h-10 rounded-[10px] text-[0.8rem] font-bold transition-all ${
                    newMed.days.includes(day)
                      ? 'bg-[--color-navy] text-white shadow-sm'
                      : 'bg-white/40 text-[--color-navy]/60 border border-[--color-border-light] hover:border-[--color-navy]/30'
                  }`}>{day}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setIsAdding(false)} className="px-5 py-2 text-[--color-navy] font-bold hover:bg-white/40 rounded-[12px] transition-colors text-[0.85rem]">{t('cancel')}</button>
            <button onClick={handleAdd} className="px-5 py-2 bg-[#1a2744] text-white font-bold rounded-[12px] hover:bg-[#2e3f6b] transition-all duration-300 text-[0.85rem] shadow-md hover:shadow-lg hover:-translate-y-[1px]">{t('save_medication')}</button>
          </div>
        </div>
      )}

      {/* Today's Medication List */}
      <div className="bg-[#f5f0e8] hover:bg-[#e2dcd0] transition-all duration-300 rounded-[24px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-[#d2c8b9]/60">
        <h3 className="text-lg font-bold text-[--color-navy] mb-3 flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-[--color-sage]" /> {t('today')} — {todayName}
        </h3>
        <div className="space-y-3">
          {todayMeds.map((med) => {
            const isNext = nextMed?.id === med.id;
            return (
              <div 
                key={med.id} 
                className={`flex items-center justify-between p-4 rounded-[16px] border transition-all cursor-pointer group ${
                  med.taken
                    ? 'bg-[#e2dcd0]/50 backdrop-blur-sm border-[--color-border-light]/50'
                    : isNext
                      ? 'bg-[--color-sage]/5 border-[--color-sage]/40 shadow-sm'
                      : 'bg-[#f5f0e8] backdrop-blur-sm border-[--color-border-light] hover:bg-[#e2dcd0] hover:border-[--color-sage]/50 hover:-translate-y-[2px] hover:shadow-lg'
                }`}
                onClick={() => toggleTaken(med.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${
                    med.taken ? 'bg-[--color-border-light]/50 text-[--color-navy]/40'
                    : isNext ? 'bg-[--color-sage] text-white shadow-sm' : 'bg-[--color-sage]/15 text-[--color-sage]'
                  }`}>
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-[1.05rem] font-bold ${med.taken ? 'text-[--color-navy]/40 line-through' : 'text-[--color-navy]'}`}>
                      {med.name}
                    </h4>
                    <div className="flex items-center gap-2.5 mt-0.5">
                      <span className="text-[0.7rem] font-bold text-[--color-navy]/70 bg-white/50 px-1.5 py-0.5 rounded-[4px]">{med.dosage}</span>
                      <span className="text-[0.75rem] font-bold text-[--color-sage] flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(med.time)}</span>
                      <span className="text-[0.65rem] text-[--color-navy]/50 uppercase tracking-widest font-bold">{med.days.join(', ')}</span>
                    </div>
                  </div>
                  {isNext && !med.taken && <span className="ml-2 px-2 py-0.5 bg-[--color-sage] text-white text-[0.6rem] font-bold rounded-full uppercase tracking-wider animate-pulse">{t('next')}</span>}
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); removeMed(med.id); }} className="p-1.5 text-red-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                  {med.taken ? (
                    <CheckCircle2 className="w-8 h-8 text-[--color-sage]" />
                  ) : (
                    <Circle className="w-8 h-8 text-[--color-border-light] hover:text-[--color-sage] transition-colors" />
                  )}
                </div>
              </div>
            );
          })}
          {todayMeds.length === 0 && <p className="text-center text-(--color-navy)/50 py-8">{t('no_meds_today')} {todayName}.</p>}
        </div>
      </div>

      {/* Full Week View */}
      <div className="bg-[#f5f0e8] hover:bg-[#e2dcd0] transition-all duration-300 rounded-[24px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-[#d2c8b9]/60">
        <h3 className="text-lg font-bold text-[--color-navy] mb-3">{t('weekly_schedule')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2.5 text-[--color-navy]/50 font-bold uppercase tracking-wider text-[0.65rem]">{t('medication')}</th>
                {DAYS.map(d => (
                  <th key={d} className={`p-2.5 text-center text-[0.65rem] font-bold uppercase tracking-wider ${d === todayName ? 'text-[--color-sage]' : 'text-[--color-navy]/50'}`}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meds.map(med => (
                <tr key={med.id} className="border-t border-[--color-border-light]/50">
                  <td className="p-2.5 font-bold text-[--color-navy] text-[0.85rem]">{med.name} <span className="text-[--color-navy]/50 font-medium text-[0.7rem] block sm:inline">{med.dosage}</span></td>
                  {DAYS.map(d => (
                    <td key={d} className="p-2.5 text-center">
                      {med.days.includes(d) ? (
                        <span className={`inline-flex w-7 h-7 rounded-[8px] items-center justify-center text-[0.65rem] font-bold ${
                          d === todayName && med.taken ? 'bg-[#6b7c52] text-white shadow-sm' 
                          : d === todayName ? 'bg-[--color-sage]/15 text-[--color-sage] border border-[--color-sage]/30' 
                          : 'bg-[#f5f0e8] hover:bg-[#e2dcd0] text-[--color-navy]/60 transition-colors'
                        }`}>{formatTime(med.time).split(':')[0]}</span>
                      ) : <span className="text-[--color-navy]/20">—</span>}
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
