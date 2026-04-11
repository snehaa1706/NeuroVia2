import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Brain, Calendar, TrendingUp, AlertCircle, CheckCircle2, MessageSquare, Download, Activity } from 'lucide-react';
import { doctorApi } from '../services/doctorApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const PatientDetail = () => {
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showPrescribe, setShowPrescribe] = useState(false);
    const [newMed, setNewMed] = useState({ name: '', dosage: '', time: '08:00', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] });

    const handleExport = () => {
        if (!data) return;
        
        let report = `NEUROVIA PATIENT REPORT\n`;
        report += `=========================\n`;
        report += `Patient: ${data.patient?.full_name || 'Unknown'}\n`;
        report += `Date: ${new Date().toLocaleDateString()}\n\n`;
        report += `Risk Level: ${(data.latest_report?.risk_level || 'N/A').toUpperCase()}\n`;
        report += `Latest Cognitive Score: ${data.latest_report?.overall_score ?? 'N/A'}%\n\n`;
        
        report += `RECENT ACTIVITIES:\n`;
        report += `------------------\n`;
        const acts = data.activities || [];
        if (acts.length === 0) report += `No recent activities recorded.\n`;
        acts.slice(0, 10).forEach((a: any) => {
           report += `- ${new Date(a.created_at).toLocaleDateString()}: ${a.type || 'Cognitive Activity'} - Score: ${a.score ?? 'N/A'}%\n`;
        });
        
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patient_report_${id || 'download'}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrescribe = () => {
        if (!newMed.name || !newMed.dosage) return;
        // In production, this would call a proper prescription API
        alert('Medication prescribed successfully. A real backend implementation would persist this.');
        setShowPrescribe(false);
        setNewMed({ name: '', dosage: '', time: '08:00', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] });
    };

    useEffect(() => {
        const fetchPatientData = async () => {
            if (!id) return;
            try {
                const dash = await doctorApi.getPatientDashboard(id);
                setData(dash);
            } catch (err) {
                console.error('Error fetching patient data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPatientData();
    }, [id]);

    if (loading) return <div className="p-12 text-center animate-pulse">Loading patient profile...</div>;
    if (!data) return <div className="p-12 text-center text-red-500">Error loading patient data.</div>;

    const { patient, history, activities, latest_report, domain_scores } = data;

    // Format graph data from history (daily_reports) — real data only
    const graphData = (history || []).map((h: any) => ({
      name: new Date(h.created_at).toDateString().slice(0, 3),
      score: h.overall_score || 0,
      clarity: h.mental_clarity || 0,
      mood: h.mood_score || 0
    })).reverse();

    // Format Radar chart for cognitive domains
    const radarData = [
      { subject: 'Memory', A: domain_scores?.Memory || 0, fullMark: 100 },
      { subject: 'Attention', A: domain_scores?.Attention || 0, fullMark: 100 },
      { subject: 'Language', A: domain_scores?.Language || 0, fullMark: 100 },
      { subject: 'Executive', A: domain_scores?.Executive || 0, fullMark: 100 },
      { subject: 'Recognition', A: domain_scores?.Recognition || 0, fullMark: 100 },
    ];

    const hasData = (activities && activities.length > 0) || (history && history.length > 0);
    const riskLevel = latest_report?.risk_level || '';
    const riskColor = riskLevel === 'high' ? 'text-red-600 bg-red-50 border-red-100' : 
                      riskLevel === 'moderate' ? 'text-amber-600 bg-amber-50 border-amber-100' : 
                      riskLevel ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
                      'text-(--color-navy)/60 bg-(--color-surface-alt) border-(--color-border-light)';

    const lastCheckIn = history?.[0]?.created_at 
      ? new Date(history[0].created_at).toLocaleString() 
      : 'No check-ins yet';

    // Determine the focus domain from most recent activity
    const latestFocus = activities?.[0]?.type || (hasData ? 'Cognitive Assessment' : 'No data yet');

    return (
        <div className="max-w-7xl mx-auto space-y-8 fade-in pb-20 px-8">
            {/* Navigation & Title Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/doctor/patients" className="p-2.5 bg-white border border-(--color-border-light) rounded-xl hover:bg-(--color-surface-alt) transition-all">
                        <ChevronLeft className="w-5 h-5 text-(--color-navy)/60" />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold text-(--color-navy)">{patient.full_name}</h2>
                        <p className="text-(--color-navy)/40 font-medium">{patient.email}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                   <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-(--color-border-light) rounded-xl font-bold text-(--color-navy)/70 hover:bg-(--color-surface-alt) transition-all">
                      <Download className="w-4 h-4" /> Export Report
                   </button>
                   <button className="flex items-center gap-2 px-5 py-2.5 bg-(--color-navy) text-white border border-(--color-navy) rounded-xl font-bold hover:bg-(--color-navy-light) transition-all shadow-lg shadow-(--color-navy)/20">
                      <MessageSquare className="w-4 h-4" /> Message Caregiver
                   </button>
                </div>
            </div>

            {/* Stats Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`p-6 rounded-3xl border ${riskColor}`}>
                    <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-wider text-xs">
                        <AlertCircle className="w-4 h-4" /> Clinical Risk Level
                    </div>
                    <div className="text-3xl font-black">{riskLevel ? riskLevel.toUpperCase() : 'N/A'}</div>
                </div>
                <div className="p-6 rounded-3xl border border-(--color-border-light) bg-white">
                    <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-wider text-xs text-(--color-navy)/40">
                        <TrendingUp className="w-4 h-4" /> Cognitive Score
                    </div>
                    <div className="text-3xl font-black text-(--color-navy)">{latest_report?.overall_score != null ? `${latest_report.overall_score}%` : 'N/A'}</div>
                </div>
                <div className="p-6 rounded-3xl border border-(--color-border-light) bg-white">
                    <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-wider text-xs text-(--color-navy)/40">
                        <Brain className="w-4 h-4" /> Latest Focus
                    </div>
                    <div className="text-xl font-bold text-(--color-navy)">{latestFocus}</div>
                </div>
                <div className="p-6 rounded-3xl border border-(--color-border-light) bg-white">
                    <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-wider text-xs text-(--color-navy)/40">
                        <Calendar className="w-4 h-4" /> Last Check-in
                    </div>
                    <div className="text-xl font-bold text-(--color-navy)">{lastCheckIn}</div>
                </div>
            </div>

            {!hasData ? (
                /* Empty State */
                <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-(--color-border-light)">
                    <div className="w-20 h-20 bg-(--color-surface-alt) rounded-full flex items-center justify-center mx-auto mb-6">
                        <Activity className="w-10 h-10 text-(--color-navy)/20" />
                    </div>
                    <h3 className="text-2xl font-bold text-(--color-navy) mb-2">No Assessment Data Yet</h3>
                    <p className="text-(--color-navy)/40 max-w-md mx-auto">This patient hasn't completed any cognitive assessments or activities. Data will appear here once they begin their screening journey.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* 7-Day Performance Chart */}
                        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-(--color-border-light) shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-(--color-navy)">Cognitive Trend</h3>
                                    <p className="text-sm text-(--color-navy)/40">Aggregated performance across recent history</p>
                                </div>
                                <div className="flex gap-4">
                                   <div className="flex items-center gap-2 text-xs font-bold text-(--color-sage)">
                                      <div className="w-3 h-3 rounded-full bg-(--color-sage)" /> Score
                                   </div>
                                   <div className="flex items-center gap-2 text-xs font-bold text-blue-500">
                                      <div className="w-3 h-3 rounded-full bg-blue-500" /> Clarity
                                   </div>
                                </div>
                            </div>
                            <div className="h-80 w-full">
                                {graphData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={graphData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="name" fontSize={12} stroke="#9CA3AF" axisLine={false} tickLine={false} />
                                            <YAxis domain={[0, 100]} fontSize={12} stroke="#9CA3AF" axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Line type="monotone" dataKey="score" stroke="var(--color-sage)" strokeWidth={4} dot={{ r: 6, fill: 'var(--color-sage)', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                                            <Line type="monotone" dataKey="clarity" stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-(--color-navy)/30 font-medium">No trend data available yet</div>
                                )}
                            </div>
                        </div>

                        {/* Domain Analysis Radar */}
                        <div className="bg-white p-8 rounded-3xl border border-(--color-border-light) shadow-sm flex flex-col items-center">
                            <h3 className="text-2xl font-bold text-(--color-navy) self-start mb-2">Domain Analysis</h3>
                            <p className="text-sm text-(--color-navy)/40 self-start mb-6">Strengths & opportunities by area</p>
                            <div className="h-72 w-full mt-auto">
                              <ResponsiveContainer width="100%" height="100%">
                                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                      <PolarGrid stroke="#E5E7EB" />
                                      <PolarAngleAxis dataKey="subject" fontSize={11} fontWeight={700} stroke="#4B5563" />
                                      <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                                      <Radar name="Scoring" dataKey="A" stroke="var(--color-sage)" fill="var(--color-sage)" fillOpacity={0.6} />
                                  </RadarChart>
                              </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Activity Timeline */}
                        <div className="space-y-6">
                           <h3 className="text-2xl font-bold text-(--color-navy)">Recent Assessment Results</h3>
                           <div className="bg-white rounded-3xl border border-(--color-border-light) overflow-hidden shadow-sm">
                              {activities && activities.length > 0 ? (
                                <div className="divide-y divide-(--color-border-light)">
                                  {activities.slice(0, 5).map((act: any, idx: number) => (
                                     <div key={idx} className="p-6 flex items-center justify-between hover:bg-(--color-surface-alt) transition-colors group">
                                        <div className="flex items-center gap-4">
                                           <div className="w-12 h-12 bg-(--color-navy)/5 rounded-2xl flex items-center justify-center">
                                              <Activity className="w-6 h-6 text-(--color-navy)/30" />
                                           </div>
                                           <div>
                                              <h5 className="font-bold text-(--color-navy)">{act.type || 'Cognitive Activity'}</h5>
                                              <p className="text-xs text-(--color-navy)/40 font-medium">{new Date(act.created_at).toLocaleString()}</p>
                                           </div>
                                        </div>
                                        <div className="text-right">
                                           <div className="text-xl font-black text-(--color-navy)">{act.score != null ? `${act.score}%` : 'N/A'}</div>
                                           {act.score != null && (
                                             <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${act.score >= 50 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                                                <CheckCircle2 className="w-3 h-3" /> {act.score >= 50 ? 'PASSED' : 'REVIEW'}
                                             </div>
                                           )}
                                        </div>
                                     </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-12 text-center text-(--color-navy)/30 font-medium">No assessment results yet</div>
                              )}
                           </div>
                        </div>

                        {/* Consultation & Notes Section */}
                        <div className="bg-white p-8 rounded-3xl border border-(--color-border-light) shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-(--color-navy)">Clinical Observations</h3>
                                <button className="text-xs font-bold text-(--color-sage) px-3 py-1 bg-(--color-sage)/10 rounded-full">Internal Only</button>
                            </div>
                            
                            {latest_report?.notes ? (
                               <div className="p-6 bg-(--color-surface-alt) rounded-2xl border border-(--color-border-light) italic text-(--color-navy)/60">
                                  "{latest_report.notes}"
                               </div>
                            ) : (
                               <div className="p-10 text-center border-2 border-dashed border-(--color-border-light) rounded-2xl">
                                  <p className="text-sm text-(--color-navy)/30 font-medium">No clinical notes recorded yet for this patient.</p>
                               </div>
                            )}

                            <div className="space-y-4">
                                <h4 className="text-lg font-bold text-(--color-navy)">Recommended Actions</h4>
                                <div className="space-y-2">
                                   {['Increase frequency of memory exercises', 'Review medication adherence', 'Schedule neuro-psych exam'].map((rec, i) => (
                                      <div key={i} className="flex items-center gap-3 p-4 bg-white border border-(--color-border-light) rounded-2xl hover:border-(--color-sage) transition-all">
                                         <div className="w-5 h-5 border-2 border-(--color-border-light) rounded-md flex-shrink-0" />
                                         <span className="text-sm font-semibold text-(--color-navy)/70">{rec}</span>
                                      </div>
                                   ))}
                                </div>
                                <button 
                                    onClick={() => setShowPrescribe(true)}
                                    className="w-full py-4 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-2xl hover:bg-emerald-100 transition-all">
                                   Prescribe Medication
                                </button>
                                <button className="w-full py-4 bg-(--color-navy)/5 text-(--color-navy) font-bold rounded-2xl hover:bg-(--color-navy)/10 transition-all">
                                   Add New Clinical Observation
                                </button>
                                
                                {showPrescribe && (
                                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                                        <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
                                            <button onClick={() => setShowPrescribe(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><ChevronLeft className="w-4 h-4 rotate-180" /></button>
                                            <h3 className="text-2xl font-bold text-(--color-navy) mb-6">Prescribe Medication</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-bold text-(--color-navy)/50 uppercase mb-1 block">Medication Name</label>
                                                    <input type="text" value={newMed.name} onChange={e => setNewMed({...newMed, name: e.target.value})} className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-(--color-sage)" placeholder="e.g. Donepezil" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-(--color-navy)/50 uppercase mb-1 block">Dosage</label>
                                                    <input type="text" value={newMed.dosage} onChange={e => setNewMed({...newMed, dosage: e.target.value})} className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-(--color-sage)" placeholder="e.g. 10mg" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-(--color-navy)/50 uppercase mb-1 block">Time Slot</label>
                                                    <input type="time" value={newMed.time} onChange={e => setNewMed({...newMed, time: e.target.value})} className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-(--color-sage)" />
                                                </div>
                                                <button onClick={handlePrescribe} className="w-full py-4 bg-(--color-sage) text-white font-bold rounded-2xl shadow-lg shadow-(--color-sage)/30 hover:bg-[#6b8c84] transition-all mt-4">
                                                    Confirm & Sync Prescription
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PatientDetail;
