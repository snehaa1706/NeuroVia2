import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    Pill,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    BarChart3,
    ArrowRight,
    Brain,
    Clock,
    Target,
    HeartPulse,
} from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
} from 'recharts';
import { api } from '../lib/api';
import type { User, Screening, Alert } from '../types';

interface Props { user: User; }

const MOOD_SCORE: Record<string, number> = {
    happy: 5, calm: 4, anxious: 2, agitated: 1, sad: 2, neutral: 3,
};

const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
};

export default function PatientDashboard({ user }: Props) {
    const navigate = useNavigate();
    const [screenings, setScreenings] = useState<Screening[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [healthLogs, setHealthLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadDashboardData(); }, []);

    const loadDashboardData = async () => {
        try {
            const [screeningRes, alertRes, logsRes] = await Promise.all([
                api.getScreeningHistory().catch(() => ({ screenings: [] })),
                api.getAlerts(true).catch(() => ({ alerts: [] })),
                api.getHealthLogs().catch(() => ({ logs: [] })),
            ]);
            setScreenings(screeningRes.screenings || []);
            setAlerts(alertRes.alerts || []);
            setHealthLogs(logsRes.logs || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // Build chart data from health logs (latest 7, reversed to chronological order)
    const chartData = [...healthLogs]
        .slice(0, 7)
        .reverse()
        .map((log, i) => ({
            day: `Day ${i + 1}`,
            Confusion: log.confusion_level ?? 0,
            Sleep: log.sleep_hours ?? 0,
            Mood: MOOD_SCORE[log.mood] ?? 3,
        }));

    const completedScreenings = screenings.filter((s) => s.status === 'completed');
    const latestAnalysis = completedScreenings[0]?.ai_analyses?.[0];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-[#F9F8F4]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#E5E5E0] border-t-[#8C9A86] rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">Loading your health data...</p>
                </div>
            </div>
        );
    }

    const quickActions = [
        { label: 'Activities', desc: 'Brain training & mental exercises', icon: Activity, href: '/activities' },
        { label: 'Medications', desc: 'Track your daily schedule', icon: Pill, href: '/medications' },
        { label: 'Your Logs', desc: 'Track daily vitals & mood', icon: TrendingUp, href: '/logs' },
        { label: 'Alerts', desc: 'View your health alerts', icon: AlertTriangle, href: '/alerts' },
    ];

    const stats = [
        { label: 'HEALTH LOGS', value: healthLogs.length, icon: BarChart3 },
        { label: 'RISK SCORE', value: latestAnalysis ? `${latestAnalysis.risk_score}` : 'N/A', icon: TrendingUp },
        { label: 'ACTIVE ALERTS', value: alerts.length, icon: AlertTriangle },
    ];

    return (
        <div className="p-4 md:p-8 max-w-screen-xl mx-auto flex flex-col gap-8 animate-fadeIn font-sans">
            
            {/* === WELCOME BANNER === */}
            <div className="relative rounded-3xl overflow-hidden shadow-lg bg-[#0D2B45] min-h-[160px] flex items-center">
                <div className="relative z-10 w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-8 p-10">
                    <div>
                        <p className="text-xs font-bold text-[#8C9A86] uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                        <h2 className="text-4xl md:text-5xl font-serif text-white tracking-tight leading-tight mb-3">
                            Good {getGreeting()},{' '}
                            <span className="italic font-light text-[#8C9A86]">{user.full_name?.split(' ')[0]}</span>
                        </h2>
                        <p className="text-slate-300 text-lg max-w-md leading-relaxed">
                            Here's your cognitive health overview. Track your progress and stay on top of your personalized care plan.
                        </p>
                    </div>

                    {/* Quick stat badges */}
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="flex flex-col items-center justify-center bg-[#183955] rounded-2xl px-6 py-4 border border-[#8C9A86]/20 shadow-inner min-w-[80px]">
                            <span className="text-3xl font-serif text-white mb-1">{screenings.length}</span>
                            <span className="text-[10px] font-bold text-[#8C9A86] uppercase tracking-wider">Screenings</span>
                        </div>
                        <div className="flex flex-col items-center justify-center bg-[#183955] rounded-2xl px-6 py-4 border border-[#8C9A86]/20 shadow-inner min-w-[80px]">
                            <span className="text-3xl font-serif text-[#8C9A86] mb-1">—</span>
                            <span className="text-[10px] font-bold text-[#8C9A86] uppercase tracking-wider">Risk Level</span>
                        </div>
                        <div className="flex flex-col items-center justify-center bg-[#183955] rounded-2xl px-6 py-4 border border-[#8C9A86]/20 shadow-inner min-w-[80px]">
                            <span className="text-3xl font-serif text-white mb-1">{alerts.length}</span>
                            <span className="text-[10px] font-bold text-[#8C9A86] uppercase tracking-wider">Alerts</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* === QUICK ACTIONS === */}
            <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                    Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {quickActions.map((action) => (
                        <div
                            key={action.label}
                            onClick={() => navigate(action.href)}
                            className="group cursor-pointer flex flex-col bg-white rounded-3xl border border-[#E5E5E0] p-6 text-left shadow-sm hover:shadow-xl hover:border-[#8C9A86] transition-all duration-300"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-[#8C9A86]/10 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                                <action.icon className="w-7 h-7 text-[#8C9A86]" />
                            </div>
                            <p className="font-bold text-[#0D2B45] text-lg mb-2">{action.label}</p>
                            <p className="text-sm text-slate-500 leading-snug mb-4 flex-1">{action.desc}</p>
                            <div className="flex items-center gap-2 text-sm font-bold text-[#8C9A86]">
                                Go <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* === BOTTOM SECTION === */}
            <div className="grid lg:grid-cols-3 gap-8 items-start">

                {/* Daily Health Progress Chart */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E5E5E0] shadow-sm overflow-hidden flex flex-col">
                    <div className="px-8 py-6 border-b border-[#E5E5E0] flex items-center justify-between bg-white">
                        <h3 className="font-serif text-2xl text-[#0D2B45] flex items-center gap-3">
                            <HeartPulse className="w-6 h-6 text-[#8C9A86]" /> Daily Health Progress
                        </h3>
                        <button onClick={() => navigate('/logs')} className="text-sm font-bold text-[#0D2B45] hover:text-[#8C9A86] transition-colors underline decoration-2 underline-offset-4">
                            View Logs
                        </button>
                    </div>
                    <div className="p-8">
                        {chartData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-5 bg-[#F9F8F4] rounded-2xl border border-dashed border-[#8C9A86]/30">
                                <div className="w-16 h-16 rounded-full bg-[#8C9A86]/10 flex items-center justify-center">
                                    <BarChart3 className="w-8 h-8 text-[#8C9A86]" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-[#0D2B45] text-xl">No data yet</p>
                                    <p className="text-slate-500 mt-2 max-w-sm">Submit your first daily health log to track your health progress natively.</p>
                                </div>
                                <button
                                    onClick={() => navigate('/logs')}
                                    className="mt-4 px-8 py-3 bg-[#0D2B45] hover:bg-[#1A3A54] text-white font-bold rounded-xl transition-colors shadow-lg"
                                >
                                    Add Daily Log
                                </button>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: '1px solid #E5E5E0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                        labelStyle={{ fontWeight: 700, color: '#0D2B45' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                                    <Line type="monotone" dataKey="Confusion" stroke="#E17272" strokeWidth={3} dot={{ r: 5, fill: '#E17272' }} activeDot={{ r: 7 }} />
                                    <Line type="monotone" dataKey="Sleep" stroke="#5D7C9A" strokeWidth={3} dot={{ r: 5, fill: '#5D7C9A' }} activeDot={{ r: 7 }} />
                                    <Line type="monotone" dataKey="Mood" stroke="#8C9A86" strokeWidth={3} dot={{ r: 5, fill: '#8C9A86' }} activeDot={{ r: 7 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Right Column: Mini Stats + Daily Challenge + Health Progress */}
                <div className="flex flex-col gap-6">

                    {/* Stats Strip Repurposed as Sidebar Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        {stats.slice(0, 2).map((stat) => (
                            <div key={stat.label} className="bg-white rounded-3xl border border-[#E5E5E0] p-5 shadow-sm flex flex-col justify-center items-center text-center">
                                <div className="text-3xl font-serif text-[#0D2B45] mb-1">{stat.value}</div>
                                <div className="text-[10px] font-bold text-[#8C9A86] uppercase tracking-wider">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Daily Challenge */}
                    <div className="rounded-3xl p-6 border border-[#8C9A86]/30 bg-[#8C9A86]/10 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="w-5 h-5 text-[#8C9A86]" />
                                <span className="text-xs font-bold text-[#8C9A86] uppercase tracking-widest">Daily Challenge</span>
                            </div>
                            <h4 className="font-serif text-[#0D2B45] text-2xl mb-3">Brain Exercise</h4>
                            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                                Consistency is key to cognitive health. Spend 5 minutes on a brain activity today!
                            </p>
                            <button
                                onClick={() => navigate('/activities')}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-[#0D2B45] hover:bg-[#1A3A54] text-white font-bold rounded-xl text-sm transition-colors shadow-md"
                            >
                                Start Activity <ArrowRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-white rounded-3xl border border-[#E5E5E0] shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-[#E5E5E0] flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-[#8C9A86]" />
                            <h3 className="font-bold text-[#0D2B45]">Notifications</h3>
                        </div>
                        <div className="p-5 flex-1">
                            {alerts.length === 0 ? (
                                <div className="flex items-center gap-3 p-4 bg-[#F9F8F4] rounded-2xl border border-[#8C9A86]/20">
                                    <CheckCircle2 className="w-6 h-6 text-[#8C9A86] shrink-0" />
                                    <div>
                                        <p className="font-bold text-[#0D2B45] text-sm mb-0.5">All clear!</p>
                                        <p className="text-xs text-slate-500">No new alerts at this time.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {alerts.slice(0, 3).map((alert) => (
                                        <div key={alert.id} className={`p-4 rounded-xl text-sm border-l-4 ${alert.severity === 'critical' ? 'border-[#E17272] bg-[#E17272]/10' : alert.severity === 'warning' ? 'border-[#D9A05B] bg-[#D9A05B]/10' : 'border-[#5D7C9A] bg-[#5D7C9A]/10'}`}>
                                            <p className="font-semibold text-[#0D2B45] leading-snug">{alert.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
