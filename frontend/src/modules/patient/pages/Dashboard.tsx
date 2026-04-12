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
    { id: 1, title: t('memory_match'), type: 'memory_recall', desc: t('find_pairs'), emoji: '🧠' },
    { id: 2, title: t('word_recall'), type: 'semantic_fluency', desc: t('remember_words'), emoji: '🗣️' },
    { id: 3, title: t('family_faces'), type: 'family_recognition', desc: t('identify_loved_ones'), emoji: '👨‍👩‍👧' },
    { id: 4, title: t('sequence_play'), type: 'task_sequencing', desc: t('order_steps'), emoji: '📋' },
    { id: 5, title: t('daily_objects'), type: 'object_matching', desc: t('identify_household'), emoji: '🔍' },
  ];

  const moodIcon = todayLog.mood === t('happy') || todayLog.mood === t('calm') ? <Smile className="w-8 h-8" /> : todayLog.mood === t('neutral') ? <Meh className="w-8 h-8" /> : <Frown className="w-8 h-8" />;
  const completedToday = activityData.filter(a => a.date === today).length;

  return (
    <div className="space-y-8 fade-in">
      {/* Editable Daily Input */}
      <div className="bg-white rounded-3xl p-6 border border-(--color-border) shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-(--color-navy) flex items-center gap-2">
            <div className="w-9 h-9 bg-(--color-sage)/15 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-(--color-sage)" />
            </div>
            {t('todays_checkin')}
          </h3>
          <div className="flex gap-3">
            <Link to="/consult/patient/doctors" className="flex items-center gap-2 px-6 py-2.5 bg-(--color-navy) rounded-xl text-white font-bold text-sm hover:bg-(--color-navy-light) transition-all shadow-md">
              <Activity className="w-4 h-4 text-(--color-sage)" /> {t('book_consultation')}
            </Link>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-5 py-2.5 bg-(--color-surface-alt) rounded-xl text-(--color-sage) font-bold text-sm border border-(--color-border) hover:bg-(--color-sage) hover:text-white hover:border-(--color-sage) transition-all">
                <Edit3 className="w-4 h-4" /> {t('update')}
              </button>
            ) : (
              <button onClick={saveLog} className="flex items-center gap-2 px-5 py-2.5 bg-(--color-sage) rounded-xl text-white font-bold text-sm hover:bg-(--color-sage-dark) transition-all shadow-md">
                <Check className="w-4 h-4" /> {t('save')}
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mood Selector */}
            <div className="bg-(--color-surface-alt) rounded-2xl p-5 border border-(--color-border-light)">
              <label className="text-sm font-bold text-(--color-navy)/50 uppercase tracking-wider mb-3 block">{t('mood')}</label>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map(m => (
                  <button key={m} onClick={() => setTodayLog({ ...todayLog, mood: m })}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${todayLog.mood === m ? 'bg-(--color-sage) text-white shadow-md' : 'bg-white text-(--color-navy)/70 border border-(--color-border-light) hover:border-(--color-sage)'}`}>{m}</button>
                ))}
              </div>
            </div>
            {/* Sleep Slider */}
            <div className="bg-(--color-surface-alt) rounded-2xl p-5 border border-(--color-border-light)">
              <label className="text-sm font-bold text-(--color-navy)/50 uppercase tracking-wider mb-3 block">{t('sleep')}: {todayLog.sleep} {t('hrs')}</label>
              <input type="range" min="0" max="12" step="0.5" value={todayLog.sleep}
                onChange={e => setTodayLog({ ...todayLog, sleep: parseFloat(e.target.value) })}
                className="w-full accent-[#84A59D] h-2 rounded-full" />
              <div className="flex justify-between text-xs text-(--color-navy)/40 mt-2"><span>0h</span><span>6h</span><span>12h</span></div>
            </div>
            {/* Confusion Selector */}
            <div className="bg-(--color-surface-alt) rounded-2xl p-5 border border-(--color-border-light)">
              <label className="text-sm font-bold text-(--color-navy)/50 uppercase tracking-wider mb-3 block">{t('confusion')}</label>
              <div className="flex flex-wrap gap-2">
                {CONFUSION_OPTIONS.map(c => (
                  <button key={c} onClick={() => setTodayLog({ ...todayLog, confusion: c })}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${todayLog.confusion === c ? 'bg-(--color-navy) text-white shadow-md' : 'bg-white text-(--color-navy)/70 border border-(--color-border-light) hover:border-(--color-navy)'}`}>{c}</button>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-(--color-border)">
          <h3 className="text-2xl font-bold text-(--color-navy) mb-4">{t('overall_wellness')}</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CCC8BB" vertical={false} />
                <XAxis dataKey="day" stroke="#003049" tick={{ fontSize: 13, fontWeight: 600, fill: '#003049' }} tickLine={false} axisLine={{ stroke: '#CCC8BB', strokeWidth: 2 }} />
                <YAxis stroke="#003049" tick={{ fontSize: 13, fontWeight: 600, fill: '#003049' }} tickLine={false} axisLine={{ stroke: '#CCC8BB', strokeWidth: 2 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: '2px solid #CCC8BB', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.2)', padding: '12px 16px', backgroundColor: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 'bold' }} />
                <Line type="monotone" dataKey={t('activities')} stroke="#84A59D" strokeWidth={3} dot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#84A59D' }} connectNulls />
                <Line type="monotone" dataKey={t('mood')} stroke="#F28482" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#F28482' }} connectNulls />
                <Line type="monotone" dataKey={t('sleep')} stroke="#003049" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#003049' }} connectNulls />
                <Line type="monotone" dataKey={t('mental_clarity')} stroke="#D4A373" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#D4A373' }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <RadarChart data={domainData} />
      </div>

      {/* Daily Activities Preview */}
      <div className="bg-white rounded-3xl p-8 shadow-lg border border-(--color-border)">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-(--color-navy)">{t('todays_activities')}</h3>
          <Link to="/activities" className="text-lg font-bold text-(--color-sage) hover:text-(--color-sage-dark) hover:underline transition-colors">{t('view_all')} →</Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-5">
          {dailyActivities.map(act => (
            <div key={act.id} className="bg-(--color-surface-alt) p-5 rounded-2xl flex flex-col justify-between border border-(--color-border-light) hover:shadow-lg hover:-translate-y-1 hover:border-(--color-sage)/50 transition-all duration-300 group">
              <div>
                <span className="text-3xl mb-3 block">{act.emoji}</span>
                <h4 className="text-lg font-bold text-(--color-navy) mb-1">{act.title}</h4>
                <p className="text-sm text-(--color-navy)/50 mb-4">{act.desc}</p>
              </div>
              <Link to="/activities" state={{ play: act.type }} className="w-full py-3 bg-white text-(--color-sage) text-center block font-bold text-base border-2 border-(--color-sage)/30 rounded-xl hover:bg-(--color-sage) hover:text-white hover:border-(--color-sage) transition-all">
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
