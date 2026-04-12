import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ActivityCard from '../components/ActivityCard';
import ActivityPlayer, { PersonalDataSetup } from '../components/ActivityPlayer';
import { X, Loader2, BarChart3, Trophy, Target, Zap, Brain } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface ScoreEntry {
  date: string;
  score: number;
  type: string;
}

const Activities = () => {
  const [activeActivityType, setActiveActivityType] = useState<string | null>(null);
  const [completedToday, setCompletedToday] = useState<Record<string, number>>({});
  const [chartData, setChartData] = useState<ScoreEntry[]>([]);
  const [dailyPlan, setDailyPlan] = useState<any[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const location = useLocation();

  // Handle deep linking to specific activities
  useEffect(() => {
    if (location.state?.play) {
      setActiveActivityType(location.state.play);
      // Clean up the state so it doesn't re-trigger on simple refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Load progress data from localStorage
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = () => {
    try {
      const raw = localStorage.getItem("activity_progress_f2");
      if (raw) {
        const data: ScoreEntry[] = JSON.parse(raw);
        setChartData(data);

        // Calculate today's completions checking against local timezone string
        const todayStr = new Date().toLocaleDateString();
        const todayEntries: Record<string, number> = {};
        
        data.forEach(d => {
          if (d.date === todayStr) {
            // Normalize activity type to underscores so it correctly matches `titleToType`
            const normType = d.type.toLowerCase().replace(/ /g, '_');
            todayEntries[normType] = d.score;
          }
        });
        setCompletedToday(todayEntries);
      }
    } catch { /* ignore */ }
  };

  const titleToType = (title: string) => title.toLowerCase().replace(/ /g, '_');

  const handlePlay = (title: string) => {
    setActiveActivityType(titleToType(title));
  };

  const handleActivityComplete = (score: number) => {
    // Reload progress after completion
    loadProgress();
  };

  const handleExit = () => {
    setActiveActivityType(null);
    loadProgress();
  };

  useEffect(() => {
    // Generate daily goals once per day deterministically
    const seed = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const seedNum = parseInt(seed, 10);
    
    // Pick 4 random activities from the library seeded by date
    const shuffled = [...library].sort((a, b) => {
      const hashA = (a.title.length * seedNum) % 100;
      const hashB = (b.title.length * seedNum) % 100;
      return hashA - hashB;
    });
    
    setDailyPlan(shuffled.slice(0, 4));
  }, []);

  const library = [
    { title: 'Memory Recall', description: 'Practice remembering lists of items.' },
    { title: 'Pattern Recognition', description: 'Identify and continue visual patterns.' },
    { title: 'Image Recall', description: 'Remember images shown previously.' },
    { title: 'Word Association', description: 'Link related concepts together.' },
    { title: 'Object Matching', description: 'Match items to their shadows or outlines.' },
    { title: 'Stroop Test', description: 'Identify colors vs words.' },
    { title: 'Digit Span', description: 'Remember sequences of numbers.' },
    { title: 'Task Sequencing', description: 'Put everyday tasks in correct order.' },
    { title: 'Sentence Completion', description: 'Fill in the blanks to formulate logical sentences.' },
    { title: 'Semantic Fluency', description: 'Name items belonging to a specific category.' },
    { title: 'Family Recognition', description: 'Recognize photos of family members.' },
    { title: 'Phone Recognition', description: 'Identify matching phone numbers.' },
  ];

  const dailyCompletedCount = dailyPlan.filter(a => completedToday[titleToType(a.title)] !== undefined).length;

  // Compute today's average score
  const todayScores = Object.values(completedToday);
  const avgScore = todayScores.length > 0 ? Math.round(todayScores.reduce((a, b) => a + b, 0) / todayScores.length) : 0;

  // Build aggregated daily chart data (average score per day)
  const buildDailyChartData = () => {
    if (chartData.length === 0) return [];
    const byDate: Record<string, any> = {};
    chartData.forEach(d => {
      let dDateStr = d.date;
      
      if (!byDate[dDateStr]) byDate[dDateStr] = { date: dDateStr, scores: [], breakdown: {} };
      byDate[dDateStr].scores.push(d.score);
      // Average duplicate activities within the same day for a cleaner breakdown or keep last
      byDate[dDateStr].breakdown[d.type.toLowerCase().replace(/ /g, '_')] = d.score;
    });
    return Object.values(byDate).map((dayData: any) => ({
      date: dayData.date,
      avgScore: Math.round(dayData.scores.reduce((a: number, b: number) => a + b, 0) / dayData.scores.length),
      sessions: dayData.scores.length,
      breakdown: dayData.breakdown
    })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-10);
  };
  
  const dailyChartData = buildDailyChartData();

  useEffect(() => {
    if (dailyPlan.length > 0 && dailyCompletedCount >= dailyPlan.length) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000); // Stop after 5s
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [dailyCompletedCount, dailyPlan.length]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-(--color-border-light) min-w-[200px]">
          <p className="font-bold text-(--color-navy) mb-2 border-b border-(--color-border-light) pb-2">{data.date}</p>
          <p className="text-sm font-semibold text-(--color-sage) mb-3">
            Average Score: {data.avgScore}%
          </p>
          <div className="space-y-1.5">
            {Object.entries(data.breakdown).map(([type, score]) => (
              <div key={type} className="flex justify-between items-center text-xs">
                <span className="text-(--color-navy)/60 capitalize">{type.split('_').join(' ')}</span>
                <span className="font-bold text-(--color-navy)">{String(score)}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-10 pb-12 fade-in relative">
      {showConfetti && (
        <div className="fixed inset-0 z-[10000] pointer-events-none">
           <Confetti width={width} height={height} numberOfPieces={200} gravity={0.15} recycle={false} />
        </div>
      )}

      {/* Section 0.5: Weekly Goal */}
      <section className="bg-gradient-to-r from-(--color-navy) to-(--color-navy-light) rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-(--color-navy)/20 mt-2 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-1">Weekly Goal</h3>
            <h2 className="text-3xl font-black mb-2">Comprehensive Screening</h2>
            <p className="text-white/80 max-w-md">Complete your weekly cognitive health check to track long-term trends and identify risk factors.</p>
          </div>
        </div>
        <Link to="/screening" className="px-8 py-4 bg-white text-(--color-navy) font-black text-lg rounded-xl flex items-center justify-center hover:bg-(--color-sage) hover:text-white transition-all whitespace-nowrap shadow-lg">
          Start Screening
        </Link>
      </section>

      {/* Activity Player Modal — portal to cover full page */}
      {activeActivityType && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" style={{ margin: 0 }}>
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative">
            <button onClick={handleExit} className="absolute top-6 right-6 p-2 bg-(--color-surface-alt) rounded-full hover:bg-(--color-sage) hover:text-white transition-colors z-10">
              <X className="w-6 h-6" />
            </button>
            <ActivityPlayer
              activityType={activeActivityType}
              onComplete={handleActivityComplete}
              onExit={handleExit}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Section 0: Scoreboard */}
      <section className="bg-white rounded-3xl p-8 shadow-lg border border-(--color-border)">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-(--color-sage)/15 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-(--color-sage)" />
          </div>
          <h2 className="text-2xl font-bold text-(--color-navy)">Today's Scoreboard</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-(--color-sage)/10 to-(--color-sage)/5 rounded-2xl p-5 text-center border border-(--color-sage)/20">
            <div className="w-8 h-8 bg-(--color-sage)/15 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-4 h-4 text-(--color-sage)" />
            </div>
            <p className="text-3xl font-black text-(--color-sage)">{dailyCompletedCount}</p>
            <p className="text-sm font-bold text-(--color-navy)/50 mt-1 uppercase tracking-wider">Completed</p>
          </div>
          <div className="bg-gradient-to-br from-(--color-navy)/8 to-(--color-navy)/3 rounded-2xl p-5 text-center border border-(--color-navy)/10">
            <div className="w-8 h-8 bg-(--color-navy)/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Target className="w-4 h-4 text-(--color-navy)" />
            </div>
            <p className="text-3xl font-black text-(--color-navy)">{dailyPlan.length}</p>
            <p className="text-sm font-bold text-(--color-navy)/50 mt-1 uppercase tracking-wider">Daily Goal</p>
          </div>
          <div className="bg-gradient-to-br from-(--color-sage)/10 to-(--color-sage)/5 rounded-2xl p-5 text-center border border-(--color-sage)/20">
            <div className="w-8 h-8 bg-(--color-sage)/15 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Zap className="w-4 h-4 text-(--color-sage)" />
            </div>
            <p className="text-3xl font-black text-(--color-sage)">{avgScore}%</p>
            <p className="text-sm font-bold text-(--color-navy)/50 mt-1 uppercase tracking-wider">Avg Score</p>
          </div>
          <div className="bg-gradient-to-br from-(--color-navy)/8 to-(--color-navy)/3 rounded-2xl p-5 text-center border border-(--color-navy)/10">
            <div className="w-8 h-8 bg-(--color-navy)/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="w-4 h-4 text-(--color-navy)" />
            </div>
            <p className="text-3xl font-black text-(--color-navy)">{chartData.length}</p>
            <p className="text-sm font-bold text-(--color-navy)/50 mt-1 uppercase tracking-wider">Total Sessions</p>
          </div>
        </div>

        {/* Per-activity scores for today */}
        {Object.keys(completedToday).length > 0 && (
          <div className="flex flex-wrap gap-3">
            {Object.entries(completedToday).map(([type, score]) => (
              <div key={type} className={`px-4 py-2 rounded-full text-sm font-bold border ${score >= 80 ? 'bg-(--color-sage)/10 text-(--color-sage) border-(--color-sage)/30' : score >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                {type.split('_').join(' ')} — {score}%
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Personal Data Setup */}
      <PersonalDataSetup />

      {/* Section 1: Daily Plan */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-3xl font-bold text-(--color-navy)">Daily Plan</h2>
          <div className="text-xl font-medium text-(--color-sage)">
            <span className="font-bold text-2xl">{dailyCompletedCount}</span> / {dailyPlan.length} completed
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-(--color-border) rounded-full h-4 mb-8 overflow-hidden shadow-inner">
          <div 
            className="bg-gradient-to-r from-(--color-sage) to-(--color-sage-dark) h-4 rounded-full transition-all duration-1000 shadow-sm" 
            style={{ width: `${(dailyCompletedCount / dailyPlan.length) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dailyPlan.map((act, index) => {
            const type = titleToType(act.title);
            const isCompleted = completedToday[type] !== undefined;
            const score = completedToday[type];
            return (
              <div key={index} className="relative">
                <ActivityCard 
                  title={act.title} 
                  description={act.description} 
                  isCompleted={isCompleted}
                  onPlay={handlePlay}
                />
                {isCompleted && (
                  <div className="absolute top-4 right-4 bg-(--color-sage) text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
                    {score}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 1.5: Personal Data Setup (Family Photos & Phone Numbers) */}
      <section>
        <PersonalDataSetup />
      </section>

      {/* Section 2: Activity Library */}
      <section>
        <h2 className="text-3xl font-bold text-(--color-navy) mb-6">Activity Library</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {library.map((act, index) => (
            <ActivityCard 
              key={index}
              title={act.title}
              description={act.description}
              onPlay={handlePlay}
            />
          ))}
        </div>
      </section>

      {/* Section 3: Progress History Chart */}
      <section className="bg-white rounded-3xl p-8 shadow-lg border border-(--color-border)">
        <h2 className="text-2xl font-bold text-(--color-navy) mb-6">Progress History</h2>
        {dailyChartData.length > 0 ? (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={dailyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84A59D" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#84A59D" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#CCC8BB" vertical={false} />
                <XAxis 
                  dataKey="date"
                  stroke="#003049" 
                  strokeWidth={1.5} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#003049' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CCC8BB', strokeWidth: 2 }}
                />
                <YAxis 
                  stroke="#003049" 
                  strokeWidth={1.5} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#003049' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CCC8BB', strokeWidth: 2 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="avgScore" 
                  stroke="#84A59D" 
                  strokeWidth={3} 
                  fill="url(#progressGradient)"
                  dot={{ r: 6, fill: '#003049', strokeWidth: 3, stroke: '#fff' }} 
                  activeDot={{ r: 9, fill: '#84A59D', strokeWidth: 3, stroke: '#fff' }} 
                  name="avgScore"
                />
                <Line 
                  type="monotone" 
                  dataKey="best" 
                  stroke="#003049" 
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={{ r: 4, fill: '#003049', strokeWidth: 2, stroke: '#fff' }}
                  name="best"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center p-12 bg-(--color-surface-alt) rounded-2xl border-2 border-(--color-border) border-dashed">
            <BarChart3 className="w-12 h-12 text-(--color-navy)/20 mx-auto mb-4" />
            <p className="text-(--color-navy)/60 font-bold text-lg mb-2">No activity history yet</p>
            <p className="text-(--color-navy)/40">Complete some activities to start tracking your daily progress here!</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Activities;
