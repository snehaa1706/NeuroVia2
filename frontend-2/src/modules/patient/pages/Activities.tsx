import React, { useState, useEffect } from 'react';
import ActivityCard from '../components/ActivityCard';
import ActivityPlayer, { PersonalDataSetup } from '../components/ActivityPlayer';
import { X, Loader2, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ScoreEntry {
  date: string;
  score: number;
  type: string;
}

const Activities = () => {
  const [activeActivityType, setActiveActivityType] = useState<string | null>(null);
  const [completedToday, setCompletedToday] = useState<Record<string, number>>({});
  const [chartData, setChartData] = useState<ScoreEntry[]>([]);

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

        // Calculate today's completions
        const today = new Date().toLocaleDateString();
        const todayEntries: Record<string, number> = {};
        data.filter(d => d.date === today).forEach(d => {
          todayEntries[d.type] = d.score;
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

  const dailyPlan = [
    { title: 'Memory Recall', description: 'Practice remembering lists of items.' },
    { title: 'Pattern Recognition', description: 'Identify and continue visual patterns.' },
    { title: 'Family Recognition', description: 'Recognize photos of family members.' },
    { title: 'Word Association', description: 'Link related concepts together.' },
    { title: 'Task Sequencing', description: 'Put everyday tasks in correct order.' },
  ];

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

  return (
    <div className="space-y-12 pb-12 fade-in relative">
      {/* Activity Player Modal */}
      {activeActivityType && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative">
            <button onClick={handleExit} className="absolute top-6 right-6 p-2 bg-(--color-ivory-200) rounded-full hover:bg-(--color-sage) hover:text-white transition-colors z-10">
              <X className="w-6 h-6" />
            </button>
            <ActivityPlayer
              activityType={activeActivityType}
              onComplete={handleActivityComplete}
              onExit={handleExit}
            />
          </div>
        </div>
      )}

      {/* Section 0: Scoreboard */}
      <section className="bg-white rounded-3xl p-8 shadow-sm border border-(--color-ivory-200)">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-(--color-sage)/10 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-(--color-sage)" />
          </div>
          <h2 className="text-2xl font-bold text-(--color-navy)">Today's Scoreboard</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-(--color-ivory-100) rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-(--color-sage)">{dailyCompletedCount}</p>
            <p className="text-sm font-bold text-(--color-navy)/50 mt-1 uppercase">Completed</p>
          </div>
          <div className="bg-(--color-ivory-100) rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-(--color-navy)">{dailyPlan.length}</p>
            <p className="text-sm font-bold text-(--color-navy)/50 mt-1 uppercase">Daily Goal</p>
          </div>
          <div className="bg-(--color-ivory-100) rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-(--color-sage)">{avgScore}%</p>
            <p className="text-sm font-bold text-(--color-navy)/50 mt-1 uppercase">Avg Score</p>
          </div>
          <div className="bg-(--color-ivory-100) rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-(--color-navy)">{chartData.length}</p>
            <p className="text-sm font-bold text-(--color-navy)/50 mt-1 uppercase">Total Sessions</p>
          </div>
        </div>

        {/* Per-activity scores for today */}
        {Object.keys(completedToday).length > 0 && (
          <div className="flex flex-wrap gap-3">
            {Object.entries(completedToday).map(([type, score]) => (
              <div key={type} className={`px-4 py-2 rounded-full text-sm font-bold ${score >= 80 ? 'bg-(--color-sage)/10 text-(--color-sage)' : score >= 50 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-500'}`}>
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
        <div className="w-full bg-(--color-ivory-200) rounded-full h-4 mb-8 overflow-hidden">
          <div 
            className="bg-(--color-sage) h-4 rounded-full transition-all duration-1000" 
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
                  <div className="absolute top-4 right-4 bg-(--color-sage) text-white text-sm font-bold px-3 py-1 rounded-full">
                    {score}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
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

      {/* Section 3: Daily Progress Chart */}
      <section className="bg-white rounded-3xl p-8 shadow-sm border border-(--color-ivory-200)">
        <h2 className="text-2xl font-bold text-(--color-navy) mb-6">Progress History</h2>
        {chartData.length > 0 ? (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={chartData.map((d, i) => ({ ...d, uniqueKey: `${d.date}#${i}` }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5d0" />
                <XAxis dataKey="uniqueKey" stroke="#003049" strokeWidth={2} tick={{ fontSize: 12 }} tickFormatter={(val: string) => val.split('#')[0]} />
                <YAxis stroke="#003049" strokeWidth={2} domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px 16px' }}
                  labelFormatter={(label: any) => typeof label === 'string' ? label.split('#')[0] : label}
                  formatter={(value: any, _name: any, props: any) => [`${value}%`, props.payload.type || 'Score']}
                />
                <Line type="monotone" dataKey="score" stroke="#84A59D" strokeWidth={3} dot={{ r: 5, fill: '#003049', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, fill: '#84A59D' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center p-8 bg-(--color-ivory-100) rounded-2xl border border-(--color-ivory-200) border-dashed">
            <p className="text-(--color-navy)/60 font-medium text-lg mb-2">No activity history yet</p>
            <p className="text-(--color-navy)/40">Complete some activities to start tracking your daily progress here!</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Activities;
