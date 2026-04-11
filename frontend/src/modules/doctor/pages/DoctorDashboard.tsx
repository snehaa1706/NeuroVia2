import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, MessageSquare, CheckCircle, TrendingUp, AlertCircle, Clock, ChevronRight, Activity } from 'lucide-react';
import { doctorApi } from '../services/doctorApi';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ pending: 0, accepted: 0, completed: 0, total: 0, avg_time: 0 });
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Working Hours State
  const [monFri, setMonFri] = useState('09:00-17:00');
  const [sat, setSat] = useState('10:00-14:00');
  const [savingHours, setSavingHours] = useState(false);

  const handleSaveHours = async () => {
    setSavingHours(true);
    try {
      await doctorApi.updateWorkingHours({ mon_fri: monFri, sat: sat });
      alert('Working hours saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save working hours');
    } finally {
      setSavingHours(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, consultData] = await Promise.all([
          doctorApi.getStats(),
          doctorApi.getConsultations()
        ]);
        setStats(statsData);
        setConsultations(consultData.slice(0, 5)); // Show only 5 most recent
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Patients', value: stats.total, icon: Users, color: 'bg-blue-500', trend: '+12%' },
    { label: 'Pending Consultations', value: stats.pending, icon: MessageSquare, color: 'bg-amber-500', trend: 'High Priority' },
    { label: 'Completed Cases', value: stats.completed, icon: CheckCircle, color: 'bg-emerald-500', trend: '85% success' },
    { label: 'Avg. Response Time', value: `${stats.avg_time}h`, icon: Clock, color: 'bg-purple-500', trend: '-15% speed' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 fade-in pb-20">
      {/* 🔹 Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-sm border border-(--color-border-light)">
        <div>
          <h2 className="text-4xl font-bold text-(--color-navy) mb-2">Doctor's Overview</h2>
          <p className="text-lg text-(--color-navy)/60 font-medium">Welcome back! Manage your cognitive health assessments and consultations.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/doctor/consultations')}
            className="px-6 py-3 bg-(--color-navy) text-white font-bold rounded-2xl hover:bg-(--color-navy-light) hover:-translate-y-0.5 transition-all shadow-lg shadow-(--color-navy)/20"
          >
            View Requests
          </button>
        </div>
      </div>

      {/* 🔹 Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-(--color-border-light) hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-2xl text-white group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stat.trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                  {stat.trend}
                </span>
              </div>
              <h4 className="text-3xl font-bold text-(--color-navy) mb-1">{loading ? '...' : stat.value}</h4>
              <p className="text-sm font-semibold text-(--color-navy)/40 uppercase tracking-wider">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 🔹 Recent Activity Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-(--color-navy)">Recent Consultations</h3>
            <button onClick={() => navigate('/doctor/consultations')} className="text-(--color-sage) font-bold text-sm hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-white rounded-3xl border border-(--color-border-light) overflow-hidden shadow-sm flex flex-col min-h-[300px]">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 animate-pulse opacity-50">
                <Activity className="w-10 h-10 text-(--color-navy)/30 mb-4 animate-spin" />
                <p className="font-bold text-(--color-navy)/40">Loading consultations...</p>
              </div>
            ) : consultations.length > 0 ? (
              <div className="divide-y divide-(--color-border-light)">
                {consultations.map((item) => {
                  const patientName = item.patient?.full_name || item.metadata?.patient_name || 'Unknown Patient';
                  const initials = patientName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                  
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => navigate('/doctor/consultations')}
                      className="p-5 flex items-center justify-between hover:bg-(--color-surface-alt) transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-(--color-sage)/15 rounded-full flex items-center justify-center font-bold text-(--color-sage)">
                          {initials}
                        </div>
                        <div>
                          <h5 className="font-bold text-(--color-navy)">{patientName}</h5>
                          <div className="flex items-center gap-2">
                            {item.status === 'pending' && <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 uppercase">Pending</span>}
                            {item.status === 'completed' && <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 uppercase">Completed</span>}
                            {item.status === 'accepted' && <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 uppercase">In Progress</span>}
                            {item.metadata?.risk_level === 'High' && <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 uppercase">HIGH RISK</span>}
                            <span className="text-xs text-(--color-navy)/40 font-medium">
                              {new Date(item.created_at || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="w-10 h-10 bg-(--color-surface-alt) group-hover:bg-(--color-navy) group-hover:text-white rounded-xl flex items-center justify-center transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-(--color-surface-alt) rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-(--color-navy)/20" />
                </div>
                <h4 className="text-xl font-bold text-(--color-navy) mb-1">All Caught Up!</h4>
                <p className="text-(--color-navy)/40">No pending consultation requests at this time.</p>
              </div>
            )}
          </div>
        </div>

        {/* 🔹 Notifications/Alerts Sidebar */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-(--color-navy)">Important Alerts</h3>
          <div className="space-y-4">
            
            {consultations.filter(c => c.metadata?.risk_level === 'High').slice(0, 1).map(c => (
              <div key={`alert-${c.id}`} className="bg-red-50 border border-red-100 p-5 rounded-3xl flex gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <h6 className="font-bold text-red-900 leading-tight mb-1">High Risk Assessment</h6>
                  <p className="text-sm text-red-700">Patient <strong>{c.patient?.full_name || c.metadata?.patient_name}</strong> has a high-risk screening result.</p>
                </div>
              </div>
            ))}
            
            {consultations.filter(c => c.status === 'pending').slice(0, 1).map(c => (
              <div key={`pending-${c.id}`} className="bg-amber-50 border border-amber-100 p-5 rounded-3xl flex gap-4">
                <Clock className="w-6 h-6 text-amber-500 shrink-0" />
                <div>
                  <h6 className="font-bold text-amber-900 leading-tight mb-1">Pending Consultation</h6>
                  <p className="text-sm text-amber-700">A new request is waiting for your review.</p>
                </div>
              </div>
            ))}

            {consultations.length === 0 && (
              <div className="p-5 rounded-3xl flex gap-4 border border-(--color-border-light) bg-(--color-surface-alt)">
                <div className="text-(--color-navy)/40 text-sm">No new alerts today. Check back later!</div>
              </div>
            )}

            <div className="bg-(--color-sage)/5 border border-(--color-sage)/10 p-6 rounded-3xl mt-4">
              <h5 className="font-bold text-(--color-navy) mb-3">Quick Actions</h5>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div onClick={() => navigate('/doctor/patients')} className="p-4 bg-white rounded-2xl border border-(--color-border-light) hover:border-(--color-sage) cursor-pointer transition-all active:scale-95 group">
                   <Users className="w-5 h-5 mx-auto mb-2 text-(--color-navy)/50 group-hover:text-(--color-sage)" />
                   <span className="text-xs font-bold text-(--color-navy)">Patient List</span>
                </div>
                <div onClick={() => navigate('/doctor/consultations')} className="p-4 bg-white rounded-2xl border border-(--color-border-light) hover:border-(--color-sage) cursor-pointer transition-all active:scale-95 group">
                   <TrendingUp className="w-5 h-5 mx-auto mb-2 text-(--color-navy)/50 group-hover:text-(--color-sage)" />
                   <span className="text-xs font-bold text-(--color-navy)">View All</span>
                </div>
              </div>
            </div>

            {/* Manage Working Hours */}
            <div className="bg-white border border-(--color-border-light) p-6 rounded-3xl mt-4 shadow-sm">
              <h5 className="font-bold text-(--color-navy) mb-4">Manage Working Hours</h5>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-(--color-navy)/50 uppercase tracking-widest block mb-2 px-1">Mon - Fri</label>
                  <input 
                    value={monFri}
                    onChange={(e) => setMonFri(e.target.value)}
                    className="w-full p-3 bg-(--color-surface-alt) border-2 border-transparent border-(--color-border-light) rounded-xl outline-none focus:border-(--color-sage) text-sm font-bold text-(--color-navy) transition-all"
                    placeholder="09:00-17:00"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-(--color-navy)/50 uppercase tracking-widest block mb-2 px-1">Saturday</label>
                  <input 
                    value={sat}
                    onChange={(e) => setSat(e.target.value)}
                    className="w-full p-3 bg-(--color-surface-alt) border-2 border-transparent border-(--color-border-light) rounded-xl outline-none focus:border-(--color-sage) text-sm font-bold text-(--color-navy) transition-all"
                    placeholder="10:00-14:00"
                  />
                </div>
                <button 
                  onClick={handleSaveHours}
                  disabled={savingHours}
                  className="w-full py-3 bg-(--color-sage) text-white font-bold rounded-xl hover:bg-(--color-sage-light) transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
                >
                  {savingHours ? 'Saving...' : 'Save Availability'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
