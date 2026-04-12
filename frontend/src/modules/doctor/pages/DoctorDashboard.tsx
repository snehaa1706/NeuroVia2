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
    <div className="max-w-6xl mx-auto space-y-8 fade-in pb-20" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* 🔹 Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#ede7d9] p-8 rounded-[2rem] shadow-sm border border-[#d2c8b98c] group hover:bg-[#f5f0e8] hover:scale-[1.01] hover:border-[#6b7c52] transition-all duration-300">
        <div>
          <h2 className="text-[2.5rem] font-bold text-[#1a2744] mb-2 transition-colors duration-300 group-hover:text-[#6b7c52]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Doctor's Overview</h2>
          <p className="text-lg text-[#1a2744]/60 font-medium">Welcome back! Manage your cognitive health assessments and consultations.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/doctor/consultations')}
            className="px-8 py-3.5 bg-[#1a2744] text-white font-bold rounded-2xl hover:bg-[#6b7c52] hover:-translate-y-[2px] transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-[#6b7c52]/30 uppercase tracking-widest text-sm"
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
            <div key={idx} className="bg-[#ede7d9] p-6 rounded-[2rem] shadow-sm border border-[#d2c8b98c] hover:bg-[#f5f0e8] hover:-translate-y-1 hover:shadow-xl hover:border-[#6b7c52] transition-all duration-300 group">
              <div className="flex items-start justify-between mb-6">
                <div className={`${stat.color} p-4 rounded-2xl text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-sm`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-[0.65rem] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest ${stat.trend.includes('+') || stat.trend.includes('success') ? 'bg-emerald-100/50 text-emerald-700' : 'bg-[#1a2744]/5 text-[#1a2744]'}`}>
                  {stat.trend}
                </span>
              </div>
              <h4 className="text-[2.5rem] font-semibold text-[#1a2744] mb-1 leading-none" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{loading ? '...' : stat.value}</h4>
              <p className="text-xs font-bold text-[#1a2744]/50 uppercase tracking-widest">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 🔹 Recent Activity Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold text-[#1a2744]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Recent Consultations</h3>
            <button onClick={() => navigate('/doctor/consultations')} className="text-[#6b7c52] font-bold text-sm hover:text-[#556540] hover:underline flex items-center gap-1 transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-[#ede7d9] rounded-[2rem] border border-[#d2c8b98c] overflow-hidden shadow-sm flex flex-col min-h-[300px]">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 animate-pulse opacity-50">
                <Activity className="w-10 h-10 text-(--color-navy)/30 mb-4 animate-spin" />
                <p className="font-bold text-(--color-navy)/40">Loading consultations...</p>
              </div>
            ) : consultations.length > 0 ? (
              <div className="divide-y divide-[#d2c8b98c]/40">
                {consultations.map((item) => {
                  const patientName = item.patient?.full_name || item.metadata?.patient_name || 'Unknown Patient';
                  const initials = patientName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                  
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => navigate('/doctor/consultations')}
                      className="p-6 flex items-center justify-between hover:bg-[#f5f0e8] hover:px-8 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-(--color-sage)/15 rounded-full flex items-center justify-center font-bold text-(--color-sage)">
                          {initials}
                        </div>
                        <div>
                          <h5 className="font-bold text-[#1a2744] text-lg group-hover:text-[#6b7c52] transition-colors">{patientName}</h5>
                          <div className="flex items-center gap-3 mt-1">
                            {item.status === 'pending' && <span className="text-[0.65rem] font-bold px-2.5 py-1 rounded-md bg-amber-100/50 text-amber-700 uppercase tracking-widest">Pending</span>}
                            {item.status === 'completed' && <span className="text-[0.65rem] font-bold px-2.5 py-1 rounded-md bg-emerald-100/50 text-emerald-700 uppercase tracking-widest">Completed</span>}
                            {item.status === 'accepted' && <span className="text-[0.65rem] font-bold px-2.5 py-1 rounded-md bg-blue-100/50 text-blue-700 uppercase tracking-widest">In Progress</span>}
                            {item.metadata?.risk_level === 'High' && <span className="text-[0.65rem] font-bold px-2.5 py-1 rounded-md bg-red-100/50 text-red-700 uppercase tracking-widest">HIGH RISK</span>}
                            <span className="text-xs text-[#1a2744]/40 font-medium">
                              {new Date(item.created_at || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="w-12 h-12 bg-[#f5f0e8] group-hover:bg-[#1a2744] group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center group hover:bg-[#f5f0e8] transition-colors duration-300">
                <div className="w-16 h-16 bg-[#f5f0e8] border border-[#d2c8b98c] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:border-[#6b7c52] transition-colors duration-300">
                  <CheckCircle className="w-8 h-8 text-[#6b7c52]/40 group-hover:text-[#6b7c52] transition-colors duration-300" />
                </div>
                <h4 className="text-[2rem] font-bold text-[#1a2744] mb-1 font-serif" style={{ fontFamily: "'Cormorant Garamond', serif" }}>All Caught Up!</h4>
                <p className="text-(--color-navy)/40">No pending consultation requests at this time.</p>
              </div>
            )}
          </div>
        </div>

        {/* 🔹 Notifications/Alerts Sidebar */}
        <div className="space-y-6">
          <h3 className="text-3xl font-bold text-[#1a2744]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Important Alerts</h3>
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
              <div className="p-5 rounded-3xl flex gap-4 border border-[#d2c8b98c] bg-[#ede7d9] hover:bg-[#f5f0e8] hover:-translate-y-[1px] transition-all duration-300">
                <div className="text-[#1a2744]/40 text-sm font-medium">No new alerts today. Check back later!</div>
              </div>
            )}

            <div className="bg-[#ede7d9] border border-[#d2c8b98c] p-8 rounded-[2rem] mt-4 shadow-sm">
              <h5 className="font-bold text-[#1a2744] mb-4 text-xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Quick Actions</h5>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div onClick={() => navigate('/doctor/patients')} className="p-4 bg-[#f5f0e8] rounded-2xl border border-[#d2c8b98c] hover:border-[#6b7c52] hover:bg-[#ede7d9] cursor-pointer transition-all active:scale-95 group hover:-translate-y-1 hover:shadow-md">
                   <Users className="w-5 h-5 mx-auto mb-2 text-[#1a2744]/50 group-hover:text-[#6b7c52] transition-colors" />
                   <span className="text-[0.65rem] font-bold text-[#1a2744] uppercase tracking-widest">Patient List</span>
                </div>
                <div onClick={() => navigate('/doctor/consultations')} className="p-4 bg-[#f5f0e8] rounded-2xl border border-[#d2c8b98c] hover:border-[#6b7c52] hover:bg-[#ede7d9] cursor-pointer transition-all active:scale-95 group hover:-translate-y-1 hover:shadow-md">
                   <TrendingUp className="w-5 h-5 mx-auto mb-2 text-[#1a2744]/50 group-hover:text-[#6b7c52] transition-colors" />
                   <span className="text-[0.65rem] font-bold text-[#1a2744] uppercase tracking-widest">View All</span>
                </div>
              </div>
            </div>

            {/* Manage Working Hours */}
            <div className="bg-[#ede7d9] border border-[#d2c8b98c] p-8 rounded-[2rem] mt-4 shadow-sm group hover:bg-[#f5f0e8] hover:border-[#6b7c52] transition-all duration-300">
              <h5 className="font-bold text-[#1a2744] mb-5 text-xl group-hover:text-[#6b7c52] transition-colors" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Manage Working Hours</h5>
              <div className="space-y-5">
                <div>
                  <label className="text-[0.65rem] font-black text-[#1a2744]/50 uppercase tracking-[0.15em] block mb-2 px-1">Mon - Fri</label>
                  <input 
                    value={monFri}
                    onChange={(e) => setMonFri(e.target.value)}
                    className="w-full p-3.5 bg-[#f5f0e8] border border-[#d2c8b98c] rounded-2xl outline-none focus:border-[#6b7c52] focus:shadow-md text-sm font-bold text-[#1a2744] transition-all hover:bg-[#ede7d9]"
                    placeholder="09:00-17:00"
                  />
                </div>
                <div>
                  <label className="text-[0.65rem] font-black text-[#1a2744]/50 uppercase tracking-[0.15em] block mb-2 px-1">Saturday</label>
                  <input 
                    value={sat}
                    onChange={(e) => setSat(e.target.value)}
                    className="w-full p-3.5 bg-[#f5f0e8] border border-[#d2c8b98c] rounded-2xl outline-none focus:border-[#6b7c52] focus:shadow-md text-sm font-bold text-[#1a2744] transition-all hover:bg-[#ede7d9]"
                    placeholder="10:00-14:00"
                  />
                </div>
                <button 
                  onClick={handleSaveHours}
                  disabled={savingHours}
                  className="w-full py-4 bg-[#6b7c52] text-white font-bold rounded-2xl hover:bg-[#556540] hover:-translate-y-[1px] hover:shadow-lg shadow-sm tracking-widest uppercase text-[0.7rem] transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
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
