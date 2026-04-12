import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import ProgressChart from '../components/ProgressChart';
import RadarChart from '../components/RadarChart';
import { Smile, Frown, Meh, Moon, BrainCircuit, Activity, Edit3, Check, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { useTranslation } from 'react-i18next';

interface DailyLog {
  date: string;
  mood: string;
  sleep: number;
  confusion: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [todayLog, setTodayLog] = useState<DailyLog>({ date: '', mood: 'Happy', sleep: 7.5, confusion: 'Low' });
  const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);

  const MOOD_OPTIONS = [t('happy'), t('calm'), t('neutral'), t('anxious'), t('sad')];
  const CONFUSION_OPTIONS = [t('none'), t('low'), t('moderate'), t('high')];

  const today = new Date().toLocaleDateString();

  useEffect(() => {
    // 🛡️ SECURITY: Redirect doctors away from patient dashboard
    const userStr = localStorage.getItem('neurovia_patient_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === 'doctor') {
        navigate('/doctor/dashboard', { replace: true });
        return;
      }
    }
    // Load daily logs
    const raw = localStorage.getItem('neurovia_f2_daily_logs');
    if (raw) {
      const logs: DailyLog[] = JSON.parse(raw);
      setAllLogs(logs);
      const todayEntry = logs.find(l => l.date === today);
      if (todayEntry) setTodayLog(todayEntry);
      else setTodayLog({ date: today, mood: t('happy'), sleep: 7.5, confusion: t('low') });
    } else {
      setTodayLog({ date: today, mood: t('happy'), sleep: 7.5, confusion: t('low') });
    }
    // Load activity progress
    const actRaw = localStorage.getItem('activity_progress_f2');
    if (actRaw) setActivityData(JSON.parse(actRaw));
  }, []);

  const saveLog = () => {
    const updated = allLogs.filter(l => l.date !== today);
    updated.push({ ...todayLog, date: today });
    setAllLogs(updated);
    localStorage.setItem('neurovia_f2_daily_logs', JSON.stringify(updated));
    setEditing(false);
  };

  // Build comprehensive progress data for the chart
  const seedWellness = [72, 68, 80, 65, 78, 85, 74];
  const seedMood =     [80, 60, 75, 55, 90, 85, 70];
  const seedSleep =    [83, 72, 78, 67, 88, 92, 80];
  const seedClarity =  [75, 70, 85, 60, 80, 90, 78];

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString();
  });

  const hasAnyLogs = allLogs.length > 0 || activityData.length > 0;

  const chartData = last7Days.map((dateStr, i) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const log = allLogs.find(l => l.date === dateStr);
    const dayActivities = activityData.filter(a => a.date === dateStr);
    const avgScore = dayActivities.length > 0 ? Math.round(dayActivities.reduce((s: number, a: any) => s + a.score, 0) / dayActivities.length) : null;
    const moodScore = log ? ({ [t('happy')]: 95, [t('calm')]: 80, [t('neutral')]: 60, [t('anxious')]: 35, [t('sad')]: 20 }[log.mood] || 60) : null;
    const sleepScore = log ? Math.min(100, Math.round((log.sleep / 9) * 100)) : null;
    const confusionScore = log ? ({ [t('none')]: 100, [t('low')]: 75, [t('moderate')]: 45, [t('high')]: 15 }[log.confusion] || 50) : null;

    return {
      day: dayNames[d.getDay()],
      [t('activities')]: avgScore ?? (hasAnyLogs ? null : seedWellness[i]),
      [t('mood')]: moodScore ?? (hasAnyLogs ? null : seedMood[i]),
      [t('sleep')]: sleepScore ?? (hasAnyLogs ? null : seedSleep[i]),
      [t('mental_clarity')]: confusionScore ?? (hasAnyLogs ? null : seedClarity[i]),
    };
  });

  const domainData = [
    { domain: 'Memory', score: 80 },
    { domain: 'Attention', score: 65 },
    { domain: 'Language', score: 90 },
    { domain: 'Recognition', score: 75 },
    { domain: 'Executive', score: 60 },
  ];

  const dailyActivities = [
    { id: 1, title: t('memory_match'), desc: t('find_pairs'), emoji: '🧠' },
    { id: 2, title: t('word_recall'), desc: t('remember_words'), emoji: '🗣️' },
    { id: 3, title: t('family_faces'), desc: t('identify_loved_ones'), emoji: '👨‍👩‍👧' },
    { id: 4, title: t('sequence_play'), desc: t('order_steps'), emoji: '📋' },
    { id: 5, title: t('daily_objects'), desc: t('identify_household'), emoji: '🔍' },
  ];

  const moodIcon = todayLog.mood === t('happy') || todayLog.mood === t('calm') ? <Smile className="w-8 h-8" /> : todayLog.mood === t('neutral') ? <Meh className="w-8 h-8" /> : <Frown className="w-8 h-8" />;
  const completedToday = activityData.filter(a => a.date === today).length;

  return (
    <div className="space-y-6 fade-in text-[#1a2744]">
      {/* Editable Daily Input */}
      <div className="bg-transparent rounded-[24px] p-5 border border-[#d2c8b9]/60 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[1.1rem] font-bold text-(--color-navy) flex items-center gap-2">
            <div className="w-8 h-8 bg-(--color-sage)/15 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-(--color-sage)" />
            </div>
            {t('todays_checkin')}
          </h3>
          <div className="flex gap-2">
            <Link to="/consult/patient/doctors" className="flex items-center gap-1.5 px-4 py-2 bg-[#1a2744] rounded-[10px] text-white font-medium text-[0.85rem] transition-all duration-300 hover:-translate-y-[2px] shadow-[0_4px_12px_rgba(26,39,68,0.25)] hover:shadow-[0_8px_20px_rgba(26,39,68,0.4)] border border-[#1a2744]">
              <Activity className="w-3.5 h-3.5 text-[#b8d49e]" /> {t('book_consultation')}
            </Link>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#f5f0e8] backdrop-blur-sm rounded-[10px] text-[#1a2744] font-medium text-[0.85rem] border border-[--color-border] hover:bg-[#e2dcd0] hover:shadow-[0_0_15px_rgba(26,39,68,0.2)] transition-all duration-300 hover:-translate-y-[2px]">
                <Edit3 className="w-3.5 h-3.5" /> {t('update')}
              </button>
            ) : (
              <button onClick={saveLog} className="flex items-center gap-1.5 px-4 py-2 bg-[#6b7c52] rounded-[10px] text-white font-medium text-[0.85rem] transition-all duration-300 hover:-translate-y-[2px] shadow-sm hover:shadow-[0_0_15px_rgba(107,124,82,0.4)]">
                <Check className="w-3.5 h-3.5" /> {t('save')}
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Mood Selector */}
            <div className="bg-transparent rounded-[16px] p-4 border border-[#d2c8b9]/60">
              <label className="text-[0.7rem] font-bold text-(--color-navy)/50 uppercase tracking-wider mb-2 block">{t('mood')}</label>
              <div className="flex flex-wrap gap-1.5">
                {MOOD_OPTIONS.map(m => (
                  <button key={m} onClick={() => setTodayLog({ ...todayLog, mood: m })}
                    className={`px-3 py-1.5 rounded-full text-[0.8rem] font-bold transition-all ${todayLog.mood === m ? 'bg-[#6b7c52] text-white shadow-[0_4px_12px_rgba(107,124,82,0.3)] scale-105' : 'bg-white/50 text-[#1a2744]/70 border border-[#d2c8b9]/60 hover:border-[#6b7c52] hover:bg-[#e2dcd0]'}`}>{m}</button>
                ))}
              </div>
            </div>
            {/* Sleep Slider */}
            <div className="bg-transparent rounded-[16px] p-4 border border-[#d2c8b9]/60">
              <label className="text-[0.7rem] font-bold text-(--color-navy)/50 uppercase tracking-wider mb-2 block">{t('sleep')}: {todayLog.sleep} {t('hrs')}</label>
              <input type="range" min="0" max="12" step="0.5" value={todayLog.sleep}
                onChange={e => setTodayLog({ ...todayLog, sleep: parseFloat(e.target.value) })}
                className="w-full accent-[#d19e9e] h-1.5 rounded-full bg-[#d2c8b9]/40 outline-none hover:accent-[#c48c8c] transition-colors" />
              <div className="flex justify-between text-[0.65rem] font-bold text-[#1a2744]/40 mt-1"><span>0h</span><span>6h</span><span>12h</span></div>
            </div>
            {/* Confusion Selector */}
            <div className="bg-transparent rounded-[16px] p-4 border border-[#d2c8b9]/60">
              <label className="text-[0.7rem] font-bold text-(--color-navy)/50 uppercase tracking-wider mb-2 block">{t('confusion')}</label>
              <div className="flex flex-wrap gap-1.5">
                {CONFUSION_OPTIONS.map(c => (
                  <button key={c} onClick={() => setTodayLog({ ...todayLog, confusion: c })}
                    className={`px-3 py-1.5 rounded-full text-[0.8rem] font-bold transition-all ${todayLog.confusion === c ? 'bg-[#1a2744] text-white shadow-[0_4px_12px_rgba(26,39,68,0.3)] scale-105' : 'bg-white/50 text-[#1a2744]/70 border border-[#d2c8b9]/60 hover:border-[#1a2744] hover:bg-[#e2dcd0]'}`}>{c}</button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Display Stats */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title={t('mood')} value={todayLog.mood} subtitle={t('todays_feeling')} icon={moodIcon} />
            <StatCard title={t('sleep')} value={`${todayLog.sleep} ${t('hrs')}`} subtitle={todayLog.sleep >= 7 ? t('good_quality') : t('below_target')} icon={<Moon className="w-8 h-8" />} />
            <StatCard title={t('confusion')} value={todayLog.confusion} subtitle={t('mental_clarity')} icon={<BrainCircuit className="w-8 h-8" />} />
            <StatCard title={t('activities')} value={`${completedToday} ${t('done')}`} subtitle={t('todays_sessions')} icon={<Activity className="w-8 h-8" />} />
          </div>
        )}
      </div>

      {/* Comprehensive Progress Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-transparent rounded-[24px] p-5 border border-[#d2c8b9]/60 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <h3 className="text-lg font-bold text-[--color-navy] mb-4">{t('overall_wellness')}</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(210, 200, 185, 0.4)" vertical={false} />
                <XAxis dataKey="day" stroke="#1a2744" tick={{ fontSize: 13, fontWeight: 600, fill: '#1a2744' }} tickLine={false} axisLine={{ stroke: 'rgba(210, 200, 185, 0.6)', strokeWidth: 2 }} />
                <YAxis stroke="#1a2744" tick={{ fontSize: 13, fontWeight: 600, fill: '#1a2744' }} tickLine={false} axisLine={{ stroke: 'rgba(210, 200, 185, 0.6)', strokeWidth: 2 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(226, 220, 208, 0.8)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }} />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 'bold', color: '#1a2744' }} />
                <Line type="monotone" dataKey={t('activities')} stroke="#6b7c52" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#6b7c52' }} connectNulls />
                <Line type="monotone" dataKey={t('mood')} stroke="#D4A373" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#D4A373' }} connectNulls />
                <Line type="monotone" dataKey={t('sleep')} stroke="#1a2744" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#1a2744' }} connectNulls />
                <Line type="monotone" dataKey={t('mental_clarity')} stroke="#b8d49e" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#b8d49e' }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <RadarChart data={domainData} />
      </div>

      {/* Daily Activities Preview */}
      <div className="bg-transparent rounded-[24px] p-6 border border-[#d2c8b9]/60 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-[--color-navy]">{t('todays_activities')}</h3>
          <Link to="/activities" className="text-[0.85rem] font-bold text-[--color-sage] hover:text-[--color-sage-dark] hover:underline transition-colors">{t('view_all')} →</Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {dailyActivities.map(act => (
            <div key={act.id} className="bg-[#f5f0e8] hover:bg-[#e2dcd0] p-4 rounded-[16px] flex flex-col justify-between border border-[#d2c8b9]/60 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-8px_rgba(26,39,68,0.12)] hover:-translate-y-[2px] transition-all duration-300 group">
              <div>
                <span className="text-2xl mb-2 block transition-transform duration-300 group-hover:scale-110 origin-left">{act.emoji}</span>
                <h4 className="text-[0.95rem] font-bold text-[#1a2744] mb-1">{act.title}</h4>
                <p className="text-[0.75rem] text-[#1a2744]/60 mb-3">{act.desc}</p>
              </div>
              <Link to="/activities" className="w-full py-2 bg-[#f5f0e8] hover:bg-[#e2dcd0] text-[#1a2744] text-center block font-bold text-[0.8rem] rounded-[10px] shadow-sm hover:shadow-[0_0_15px_rgba(26,39,68,0.25)] hover:scale-[1.02] transition-all duration-300 border border-[#e2dcd0]/50">
                {t('start')}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
