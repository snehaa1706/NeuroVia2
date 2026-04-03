import React from 'react';
import StatCard from '../components/StatCard';
import ProgressChart from '../components/ProgressChart';
import RadarChart from '../components/RadarChart';
import { Smile, Moon, BrainCircuit, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  // Mock Data
  const progressData = [
    { date: 'Mon', score: 65 },
    { date: 'Tue', score: 70 },
    { date: 'Wed', score: 68 },
    { date: 'Thu', score: 80 },
    { date: 'Fri', score: 75 },
    { date: 'Sat', score: 85 },
    { date: 'Sun', score: 88 },
  ];

  const domainData = [
    { domain: 'Memory', score: 80 },
    { domain: 'Attention', score: 65 },
    { domain: 'Language', score: 90 },
    { domain: 'Recognition', score: 75 },
    { domain: 'Executive', score: 60 },
  ];

  const dailyActivities = [
    { id: 1, title: 'Memory Match', desc: 'Find pairs of images' },
    { id: 2, title: 'Word Recall', desc: 'Remember previous words' },
    { id: 3, title: 'Family Faces', desc: 'Identify your loved ones' },
    { id: 4, title: 'Sequence Play', desc: 'Order the steps correctly' },
    { id: 5, title: 'Daily Objects', desc: 'Identify household items' },
  ];

  return (
    <div className="space-y-8 fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Mood" value="Happy" subtitle="Higher than yesterday" icon={<Smile className="w-8 h-8" />} />
        <StatCard title="Sleep" value="7.5 hrs" subtitle="Good quality" icon={<Moon className="w-8 h-8" />} />
        <StatCard title="Confusion Level" value="Low" subtitle="Stable trend" icon={<BrainCircuit className="w-8 h-8" />} />
        <StatCard title="Activities" value="4 / 5" subtitle="Almost there!" icon={<Activity className="w-8 h-8" />} />
      </div>

      {/* Charts Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6 w-full">
          <ProgressChart data={progressData} />
        </div>
        <div className="flex flex-col gap-6 w-full">
          <RadarChart data={domainData} />
        </div>
      </div>

      {/* Daily Activities Preview */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-(--color-ivory-200)">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-(--color-navy)">Today's Required Activities</h3>
          <Link to="/activities" className="text-xl font-bold text-(--color-sage) hover:underline">View All</Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
          {dailyActivities.map(act => (
            <div key={act.id} className="bg-(--color-ivory-100) p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <h4 className="text-xl font-bold text-(--color-navy) mb-1">{act.title}</h4>
                <p className="text-md text-(--color-navy)/70 mb-4">{act.desc}</p>
              </div>
              <Link to="/activities" className="w-full py-3 bg-white text-(--color-sage) text-center block font-bold text-lg border border-(--color-sage)/30 rounded-xl hover:bg-(--color-sage) hover:text-white transition-colors">
                Start
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
