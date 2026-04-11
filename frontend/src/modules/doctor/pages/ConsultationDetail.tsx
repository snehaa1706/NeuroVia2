import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Brain, Calendar, Info, AlertCircle, FileText, CheckCircle2, Save, MoreVertical, Activity, User, MessageSquare } from 'lucide-react';
import { doctorApi } from '../services/doctorApi';

const ConsultationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [consultation, setConsultation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [prescription, setPrescription] = useState('');
    const [prescriptionText, setPrescriptionText] = useState('');
    const [bp, setBp] = useState('');
    const [heartRate, setHeartRate] = useState('');
    const [temperature, setTemperature] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                // In a real app we'd have getConsultationById. 
                // For now we'll fetch all and filter or adapt the dashboard fetch.
                const all = await doctorApi.getConsultations();
                const found = all.find((c: any) => c.id === id);
                if (found) {
                  setConsultation(found);
                  if (found.status === 'completed') {
                     setDiagnosis(found.response_data?.diagnosis || '');
                     setNotes(found.response_data?.notes || '');
                     setPrescriptionText(found.response_data?.prescription_text || found.response_data?.prescription?.join(', ') || '');
                     if (found.response_data?.vitals) {
                         setBp(found.response_data.vitals.bp || '');
                         setHeartRate(found.response_data.vitals.heart_rate || '');
                         setTemperature(found.response_data.vitals.temperature || '');
                     }
                  }
                }
            } catch (err) {
                console.error('Error fetching consultation:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handleSubmit = async () => {
        if (!id || !diagnosis) return;
        setSubmitting(true);
        try {
            await doctorApi.respondToConsultation(id, {
                diagnosis,
                notes,
                prescription_text: prescriptionText,
                vitals: {
                    bp,
                    heart_rate: heartRate,
                    temperature
                },
                attachments: attachments.map(f => f.name), // Mock sending attached file names
                follow_up_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });
            alert('Consultation response submitted successfully!');
            navigate('/doctor/consultations');
        } catch (err) {
            console.error('Error submitting response:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Loading consultation...</div>;
    if (!consultation) return <div className="p-12 text-center text-red-500">Consultation record not found.</div>;

    const isCompleted = consultation.status === 'completed';

    return (
        <div className="max-w-5xl mx-auto space-y-8 fade-in pb-20">
            {/* 🔹 Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/doctor/consultations" className="p-2.5 bg-white border border-(--color-border-light) rounded-xl hover:bg-(--color-surface-alt) transition-all">
                        <ChevronLeft className="w-5 h-5 text-(--color-navy)/60" />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold text-(--color-navy)">Review Request</h2>
                        <p className="text-(--color-navy)/40 font-medium">Consultation ID: {id?.slice(0, 8)}</p>
                    </div>
                </div>
                <div className={`p-4 rounded-2xl flex items-center gap-3 border shadow-sm ${consultation.status === 'pending' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                    {consultation.status === 'pending' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">Session Status</div>
                        <div className="font-bold leading-none">{consultation.status.toUpperCase()}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 🔹 Left Column: Patient Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-(--color-border-light) shadow-sm">
                        <div className="w-20 h-20 bg-(--color-navy) rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-(--color-navy)/20">
                            <span className="text-3xl font-bold">{consultation.patient?.full_name?.charAt(0)}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-(--color-navy) mb-1">{consultation.patient?.full_name}</h3>
                        <p className="text-sm font-semibold text-(--color-navy)/40 mb-6">{consultation.patient?.email}</p>
                        
                        <div className="space-y-4 pt-6 border-t border-(--color-border-light)">
                           <div className="flex items-center gap-4 text-sm font-bold text-(--color-navy)/60">
                              <Calendar className="w-4 h-4" /> Received: {new Date(consultation.created_at).toLocaleDateString()}
                           </div>
                           <Link to={`/doctor/patient/${consultation.patient_id}`} className="flex items-center justify-between p-4 bg-(--color-surface-alt) rounded-2xl border border-(--color-border-light) hover:border-(--color-sage) transition-all group">
                              <div className="flex items-center gap-3">
                                 <Activity className="w-5 h-5 text-(--color-navy)/40 group-hover:text-(--color-sage)" />
                                 <span className="text-xs font-bold text-(--color-navy)">Full Medical History</span>
                              </div>
                              <ChevronLeft className="w-4 h-4 rotate-180 text-(--color-navy)/40 group-hover:text-(--color-sage)" />
                           </Link>
                        </div>
                    </div>
                    
                    <div className="p-5 bg-yellow-50 rounded-2xl border border-yellow-200/60 flex gap-4">
                        <AlertCircle className="w-6 h-6 text-yellow-600 shrink-0" />
                        <div>
                            <h4 className="font-bold text-yellow-800 text-sm mb-1">Patient Request Note</h4>
                            <p className="text-yellow-700/80 text-sm leading-relaxed">{consultation.metadata?.patient_notes || 'No specific notes provided.'}</p>
                        </div>
                    </div>
                    
                    {consultation.time_slot && (
                        <div className="p-5 bg-blue-50 rounded-2xl border border-blue-200/60 flex items-center gap-4">
                            <Calendar className="w-6 h-6 text-blue-600 shrink-0" />
                            <div>
                                <h4 className="font-bold text-blue-800 text-sm mb-1">Requested Consultation Time</h4>
                                <p className="text-blue-700/80 text-sm leading-relaxed">{new Date(consultation.time_slot).toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 🔹 Right Column: Action Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-8 rounded-3xl border border-(--color-border-light) shadow-sm space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold text-(--color-navy) mb-2">Doctor's Clinical Response</h3>
                            <p className="text-(--color-navy)/40 font-medium text-sm">Provide your diagnosis and recommendations for both the patient and their caregiver.</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-black text-(--color-navy)/50 uppercase tracking-widest block mb-2 px-1">Primary Diagnosis</label>
                                <input 
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    disabled={isCompleted}
                                    className="w-full p-4 bg-(--color-surface-alt) border-2 border-transparent border-(--color-border-light) rounded-2xl outline-none focus:border-(--color-sage) focus:bg-white text-lg font-bold text-(--color-navy) transition-all disabled:opacity-60"
                                    placeholder="e.g. Mild Cognitive Impairment (Early Stage)"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black text-(--color-navy)/50 uppercase tracking-widest block mb-2 px-1">Clinical Observations & Notes</label>
                                <textarea 
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    disabled={isCompleted}
                                    className="w-full h-40 p-5 bg-(--color-surface-alt) border-2 border-transparent border-(--color-border-light) rounded-3xl outline-none focus:border-(--color-sage) focus:bg-white text-lg font-medium text-(--color-navy) transition-all resize-none disabled:opacity-60"
                                    placeholder="Detail your observations here..."
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-black text-(--color-navy)/50 uppercase tracking-widest block mb-2 px-1">Blood Pressure</label>
                                    <input 
                                        value={bp}
                                        onChange={(e) => setBp(e.target.value)}
                                        disabled={isCompleted}
                                        className="w-full p-4 bg-(--color-surface-alt) border-2 border-transparent border-(--color-border-light) rounded-2xl outline-none focus:border-(--color-sage) focus:bg-white text-md font-bold text-(--color-navy) transition-all disabled:opacity-60"
                                        placeholder="e.g. 120/80"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-(--color-navy)/50 uppercase tracking-widest block mb-2 px-1">Heart Rate</label>
                                    <input 
                                        value={heartRate}
                                        onChange={(e) => setHeartRate(e.target.value)}
                                        disabled={isCompleted}
                                        className="w-full p-4 bg-(--color-surface-alt) border-2 border-transparent border-(--color-border-light) rounded-2xl outline-none focus:border-(--color-sage) focus:bg-white text-md font-bold text-(--color-navy) transition-all disabled:opacity-60"
                                        placeholder="e.g. 75 bpm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-(--color-navy)/50 uppercase tracking-widest block mb-2 px-1">Temp</label>
                                    <input 
                                        value={temperature}
                                        onChange={(e) => setTemperature(e.target.value)}
                                        disabled={isCompleted}
                                        className="w-full p-4 bg-(--color-surface-alt) border-2 border-transparent border-(--color-border-light) rounded-2xl outline-none focus:border-(--color-sage) focus:bg-white text-md font-bold text-(--color-navy) transition-all disabled:opacity-60"
                                        placeholder="e.g. 98.6 F"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black text-(--color-navy)/50 uppercase tracking-widest block mb-2 px-1">Medicines / Advice</label>
                                <textarea 
                                    value={prescriptionText}
                                    onChange={(e) => setPrescriptionText(e.target.value)}
                                    disabled={isCompleted}
                                    className="w-full h-32 p-5 bg-(--color-surface-alt) border-2 border-transparent border-(--color-border-light) rounded-3xl outline-none focus:border-(--color-sage) focus:bg-white text-lg font-medium text-(--color-navy) transition-all resize-none disabled:opacity-60"
                                    placeholder="Write formal prescription and advice here..."
                                />
                            </div>

                            {!isCompleted && (
                                <div>
                                    <label className="text-xs font-black text-(--color-navy)/50 uppercase tracking-widest block mb-2 px-1">Attach Files</label>
                                    <input 
                                        type="file"
                                        multiple
                                        onChange={(e) => {
                                            if (e.target.files) {
                                                setAttachments(Array.from(e.target.files));
                                            }
                                        }}
                                        className="w-full p-4 bg-(--color-surface-alt) border-2 border-transparent border-(--color-border-light) rounded-2xl outline-none focus:border-(--color-sage) focus:bg-white text-md font-bold text-(--color-navy) transition-all disabled:opacity-60"
                                    />
                                    {attachments.length > 0 && (
                                        <p className="mt-2 text-sm text-(--color-sage) font-bold">{attachments.length} files selected.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {!isCompleted ? (
                            <div className="flex items-center gap-4 pt-4 border-t border-(--color-border-light)">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !diagnosis}
                                    className="flex-1 flex items-center justify-center gap-3 py-4 bg-(--color-sage) text-white font-black text-xl rounded-2xl hover:bg-(--color-sage-light) transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-(--color-sage)/20"
                                >
                                    {submitting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-6 h-6" />}
                                    Finalize Assessment
                                </button>
                                <button className="p-4 bg-(--color-surface-alt) text-(--color-navy)/40 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-95">
                                    <MoreVertical className="w-6 h-6" />
                                </button>
                            </div>
                        ) : (
                            <div className="p-8 bg-emerald-50 rounded-[40px] border border-emerald-100 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                                   <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h4 className="text-2xl font-bold text-emerald-900 mb-1">Response Recorded</h4>
                                <p className="text-emerald-700/70 text-sm font-medium mb-6">This assessment was finalized on {new Date(consultation.completed_at || consultation.created_at).toLocaleDateString()}.</p>
                                <button className="px-10 py-3 bg-white border border-emerald-200 text-emerald-700 font-bold rounded-2xl hover:bg-emerald-100 transition-all">
                                   Print Certificate
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* 🔹 Footer Quick Help */}
            <div className="flex items-center justify-center gap-12 py-10 opacity-40">
               <div className="flex items-center gap-2 font-bold text-sm">
                  <span className="w-8 h-8 rounded-full border-2 border-(--color-navy) flex items-center justify-center">1</span> Analyze Screening
               </div>
               <div className="flex items-center gap-2 font-bold text-sm">
                  <span className="w-8 h-8 rounded-full border-2 border-(--color-navy) flex items-center justify-center">2</span> Review History
               </div>
               <div className="flex items-center gap-2 font-bold text-sm">
                  <span className="w-8 h-8 rounded-full bg-(--color-navy) text-white flex items-center justify-center">3</span> Submit Diagnosis
               </div>
            </div>
        </div>
    );
};

export default ConsultationDetail;
