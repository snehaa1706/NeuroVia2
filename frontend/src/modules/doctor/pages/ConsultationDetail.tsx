import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Brain, Calendar, Info, AlertCircle, FileText, CheckCircle2, Save, XCircle, Activity, User, MessageSquare } from 'lucide-react';
import { doctorApi } from '../services/doctorApi';
import VoiceDictation from '@/components/ui/VoiceDictation';

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
    const [errorMsg, setErrorMsg] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);

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
        setErrorMsg('');
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
                attachments: attachments.map(f => f.name),
                follow_up_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });
            alert('Consultation response submitted successfully!');
            navigate('/doctor/consultations');
        } catch (err: any) {
            console.error('Error submitting response:', err);
            setErrorMsg(err.message || 'Failed to submit consultation response. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async () => {
        if (!id) return;
        setCancelling(true);
        setErrorMsg('');
        try {
            await doctorApi.cancelConsultation(id);
            alert('Consultation has been cancelled.');
            navigate('/doctor/consultations');
        } catch (err: any) {
            console.error('Error cancelling consultation:', err);
            setErrorMsg(err.message || 'Failed to cancel consultation.');
        } finally {
            setCancelling(false);
            setShowCancelModal(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Loading consultation...</div>;
    if (!consultation) return <div className="p-12 text-center text-red-500">Consultation record not found.</div>;

    const isCompleted = consultation.status === 'completed';
    const isCancelled = consultation.status === 'cancelled';
    const isFinalized = isCompleted || isCancelled;
    const canCancel = consultation.status === 'pending' || consultation.status === 'accepted';

    return (
        <div className="max-w-5xl mx-auto space-y-8 fade-in pb-20">
            {/* Header Section */}
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
                <div className={`p-4 rounded-2xl flex items-center gap-3 border shadow-sm ${
                    consultation.status === 'pending' ? 'bg-amber-50 border-amber-100 text-amber-600' : 
                    consultation.status === 'cancelled' ? 'bg-red-50 border-red-100 text-red-600' :
                    consultation.status === 'accepted' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                    'bg-emerald-50 border-emerald-100 text-emerald-600'
                }`}>
                    {consultation.status === 'pending' ? <AlertCircle className="w-6 h-6" /> : 
                     consultation.status === 'cancelled' ? <XCircle className="w-6 h-6" /> :
                     <CheckCircle2 className="w-6 h-6" />}
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">Session Status</div>
                        <div className="font-bold leading-none">{consultation.status.toUpperCase()}</div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="font-medium text-sm">{errorMsg}</p>
                    <button onClick={() => setErrorMsg('')} className="ml-auto text-red-400 hover:text-red-600">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Patient Summary */}
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

                {/* Right Column: Action Form */}
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
                                    disabled={isFinalized}
                                    className="w-full p-4 bg-(--color-surface-alt) border-2 border-transparent border-(--color-border-light) rounded-2xl outline-none focus:border-(--color-sage) focus:bg-white text-lg font-bold text-(--color-navy) transition-all disabled:opacity-60"
                                    placeholder="e.g. Mild Cognitive Impairment (Early Stage)"
                                />
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2 px-1">
                                  <label className="text-xs font-black text-(--color-navy)/50 uppercase tracking-widest">Clinical Observations & Notes</label>
                                  {!isFinalized && <VoiceDictation onTranscript={(text) => setNotes(prev => prev ? prev + ' ' + text : text)} />}
                                </div>
                                <textarea 
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    disabled={isFinalized}
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
                                        disabled={isFinalized}
                                        className="w-full p-4 bg-(--color-surface-alt) border-2 border-transparent border-(--color-border-light) rounded-2xl outline-none focus:border-(--color-sage) focus:bg-white text-md font-bold text-(--color-navy) transition-all disabled:opacity-60"
                                        placeholder="e.g. 120/80"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-(--color-navy)/50 uppercase tracking-widest block mb-2 px-1">Heart Rate</label>
                                    <input 
                                        value={heartRate}
                                        onChange={(e) => setHeartRate(e.target.value)}
                                        disabled={isFinalized}
                                        className="w-full p-4 bg-(--color-surface-alt) border-2 border-transparent border-(--color-border-light) rounded-2xl outline-none focus:border-(--color-sage) focus:bg-white text-md font-bold text-(--color-navy) transition-all disabled:opacity-60"
                                        placeholder="e.g. 75 bpm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-(--color-navy)/50 uppercase tracking-widest block mb-2 px-1">Temp</label>
                                    <input 
                                        value={temperature}
                                        onChange={(e) => setTemperature(e.target.value)}
                                        disabled={isFinalized}
                                        className="w-full p-4 bg-(--color-surface-alt) border-2 border-transparent border-(--color-border-light) rounded-2xl outline-none focus:border-(--color-sage) focus:bg-white text-md font-bold text-(--color-navy) transition-all disabled:opacity-60"
                                        placeholder="e.g. 98.6 F"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2 px-1">
                                  <label className="text-xs font-black text-(--color-navy)/50 uppercase tracking-widest">Medicines / Advice</label>
                                  {!isFinalized && <VoiceDictation onTranscript={(text) => setPrescriptionText(prev => prev ? prev + ' ' + text : text)} />}
                                </div>
                                <textarea 
                                    value={prescriptionText}
                                    onChange={(e) => setPrescriptionText(e.target.value)}
                                    disabled={isFinalized}
                                    className="w-full h-32 p-5 bg-(--color-surface-alt) border-2 border-transparent border-(--color-border-light) rounded-3xl outline-none focus:border-(--color-sage) focus:bg-white text-lg font-medium text-(--color-navy) transition-all resize-none disabled:opacity-60"
                                    placeholder="Write formal prescription and advice here..."
                                />
                            </div>

                            {!isFinalized && (
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

                        {!isFinalized ? (
                            <div className="flex items-center gap-4 pt-4 border-t border-(--color-border-light)">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !diagnosis}
                                    className="flex-1 flex items-center justify-center gap-3 py-4 bg-(--color-sage) text-white font-black text-xl rounded-2xl hover:bg-(--color-sage-light) transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-(--color-sage)/20"
                                >
                                    {submitting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-6 h-6" />}
                                    Finalize Assessment
                                </button>
                                {canCancel && (
                                    <button 
                                        onClick={() => setShowCancelModal(true)}
                                        className="p-4 bg-red-50 text-red-500 border border-red-200 rounded-2xl hover:bg-red-100 transition-all active:scale-95 flex items-center gap-2 font-bold"
                                    >
                                        <XCircle className="w-6 h-6" />
                                        Cancel
                                    </button>
                                )}
                            </div>
                        ) : isCancelled ? (
                            <div className="p-8 bg-red-50 rounded-[40px] border border-red-100 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-red-500/20">
                                   <XCircle className="w-10 h-10" />
                                </div>
                                <h4 className="text-2xl font-bold text-red-900 mb-1">Consultation Cancelled</h4>
                                <p className="text-red-700/70 text-sm font-medium">This consultation was cancelled and can no longer be modified.</p>
                            </div>
                        ) : (
                            <div className="p-8 bg-emerald-50 rounded-[40px] border border-emerald-100 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                                   <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h4 className="text-2xl font-bold text-emerald-900 mb-1">Response Recorded</h4>
                                <p className="text-emerald-700/70 text-sm font-medium mb-6">This assessment was finalized on {new Date(consultation.completed_at || consultation.updated_at || consultation.created_at).toLocaleDateString()}.</p>
                                <button className="px-10 py-3 bg-white border border-emerald-200 text-emerald-700 font-bold rounded-2xl hover:bg-emerald-100 transition-all">
                                   Print Certificate
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Footer Quick Help */}
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

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-(--color-navy) text-center mb-2">Cancel Consultation?</h3>
                        <p className="text-(--color-navy)/50 text-center text-sm mb-8">
                            Are you sure you want to cancel this consultation? <strong>This action cannot be undone.</strong> The patient will be notified.
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-4 bg-(--color-surface-alt) text-(--color-navy) font-bold rounded-2xl hover:bg-(--color-border-light) transition-all"
                            >
                                Go Back
                            </button>
                            <button 
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-red-500/20"
                            >
                                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultationDetail;
