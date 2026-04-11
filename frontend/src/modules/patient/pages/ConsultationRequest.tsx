import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, Send, CheckCircle2, ChevronLeft, Brain, User, Clock, ArrowRight, Activity } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ScreeningData {
  found: boolean;
  assessment_id?: string;
  completed_at?: string;
  cognitive_score?: number;
  risk_band?: string;
  risk_score?: number;
  recommendation?: string;
  ai_recommendation?: string;
  level_scores?: Record<string, number>;
}

const ConsultationRequest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { doctor_id, doctor_name, specialty } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notes, setNotes] = useState('');
  const [includeScreening, setIncludeScreening] = useState(true);
  const [includeActivities, setIncludeActivities] = useState(true);

  // Auto-fetched screening data
  const [screeningData, setScreeningData] = useState<ScreeningData | null>(null);
  const [screeningLoading, setScreeningLoading] = useState(true);
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);

  // Activity data from localStorage
  const [activityData, setActivityData] = useState<any[]>([]);

  // Date & Slot Selection State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [timeSlot, setTimeSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Generate next 7 days
  const nextDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  // Auto-fetch latest screening result on mount
  useEffect(() => {
    const fetchLatestScreening = async () => {
      setScreeningLoading(true);
      try {
        const token = localStorage.getItem('neurovia_patient_token');
        if (!token) {
          setScreeningData({ found: false });
          return;
        }
        const res = await fetch(`${API_URL}/screening/latest-result`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setScreeningData(data);
        } else {
          setScreeningData({ found: false });
        }
      } catch (err) {
        console.error('Failed to fetch screening data:', err);
        setScreeningData({ found: false });
      } finally {
        setScreeningLoading(false);
      }
    };

    fetchLatestScreening();

    // Load activity data from localStorage
    try {
      const raw = localStorage.getItem('activity_progress_f2');
      if (raw) {
        const parsed = JSON.parse(raw);
        setActivityData(Array.isArray(parsed) ? parsed : []);
      }
    } catch { setActivityData([]); }
  }, []);

  // Fetch time slots
  useEffect(() => {
    const did = doctor_id || 'dummy_doc_id_1';
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const res = await fetch(`${API_URL}/doctors/${did}/slots?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableSlots(data || []);
        } else {
          setAvailableSlots([]);
        }
      } catch (err) {
        console.error(err);
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    setTimeSlot('');
    fetchSlots();
  }, [selectedDate, doctor_id]);

  const hasScreening = screeningData?.found === true;

  // Build the latest few activity scores for summary display
  const recentActivities = activityData.slice(-5).reverse();

  const handleSubmit = async () => {
    if (!timeSlot) {
      alert("Please select a time slot for your consultation.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('neurovia_patient_token');
      const user = JSON.parse(localStorage.getItem('neurovia_patient_user') || '{}');

      const metadata: any = {
        patient_notes: notes,
        doctor_name: doctor_name || 'Auto-Assign',
      };

      // Attach screening data if user has it and opts in
      if (hasScreening && includeScreening) {
        metadata.risk_level = screeningData!.risk_band;
        metadata.cognitive_score = screeningData!.cognitive_score;
        metadata.risk_score = screeningData!.risk_score;
        metadata.recommendation = screeningData!.recommendation;
        metadata.ai_recommendation = screeningData!.ai_recommendation;
        metadata.level_scores = screeningData!.level_scores;
        metadata.summary = screeningData!.recommendation;
      } else {
        metadata.risk_level = 'not_provided';
        metadata.summary = 'Patient did not include screening data with this consultation request.';
      }

      // Attach activity data if opted in
      if (includeActivities && activityData.length > 0) {
        metadata.activity_results = activityData.slice(-10); // Last 10 activities
      }

      const res = await fetch(`${API_URL}/doctors/consult/patient/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patient_id: user.id || 'dummy_patient',
          screening_id: (hasScreening && includeScreening) ? screeningData!.assessment_id : null,
          doctor_id: doctor_id || 'dummy_doc_id_1',
          status: 'pending',
          metadata,
          time_slot: timeSlot
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || 'Consultation booking failed');
      }

      setSuccess(true);
      setTimeout(() => navigate('/patient/dashboard'), 3000);
    } catch (err: any) {
      console.error('Error submitting consultation request:', err);
      alert(`Failed to submit request: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center fade-in">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100/50">
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </div>
        <h2 className="text-4xl font-bold text-(--color-navy) mb-4">Request Received</h2>
        <p className="text-xl text-(--color-navy)/60 mb-10 leading-relaxed px-10">
          A NeuroVia specialist has been notified. You will receive an alert on your dashboard as soon as they review your request.
        </p>
        <button 
          onClick={() => navigate('/patient/dashboard')}
          className="px-10 py-4 bg-(--color-navy) text-white font-bold rounded-2xl hover:bg-(--color-navy-light) transition-all shadow-lg"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const getRiskColor = (band: string) => {
    if (band === 'high') return 'bg-red-50 border-red-100 text-red-700';
    if (band === 'moderate') return 'bg-amber-50 border-amber-100 text-amber-700';
    return 'bg-emerald-50 border-emerald-100 text-emerald-700';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 fade-in py-10">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-(--color-border-light) rounded-xl hover:bg-(--color-surface-alt) transition-all">
          <ChevronLeft className="w-5 h-5 text-(--color-navy)/60" />
        </button>
        <h2 className="text-3xl font-bold text-(--color-navy)">Consult Specialist</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left: Summary Cards */}
        <div className="lg:col-span-2 space-y-6">

          {/* Screening Data Card */}
          {screeningLoading ? (
            <div className="bg-white p-8 rounded-3xl border border-(--color-border-light) shadow-sm flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-(--color-sage)/30 border-t-(--color-sage) rounded-full animate-spin" />
              <span className="ml-3 text-(--color-navy)/40 font-medium">Fetching screening data...</span>
            </div>
          ) : hasScreening ? (
            <div className="bg-white p-8 rounded-3xl border border-(--color-border-light) shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-(--color-sage)/10 rounded-2xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-(--color-sage)" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-(--color-navy)">Latest Screening</h3>
                  <p className="text-xs text-(--color-navy)/40 font-medium">
                    Score: {((screeningData!.cognitive_score || 0) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 border ${getRiskColor(screeningData!.risk_band || 'low')}`}>
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold uppercase tracking-wider text-sm">{screeningData!.risk_band} risk</span>
              </div>

              {screeningData!.recommendation && (
                <p className="text-(--color-navy)/60 text-sm italic border-l-4 border-(--color-border-light) pl-4 py-1 mb-4">
                  "{screeningData!.recommendation}"
                </p>
              )}

              {/* Level breakdown */}
              {screeningData!.level_scores && Object.keys(screeningData!.level_scores).length > 0 && (
                <div className="space-y-2 pt-4 border-t border-(--color-border-light)">
                  <p className="text-[10px] uppercase font-black tracking-widest text-(--color-navy)/30 mb-2">Score Breakdown</p>
                  {Object.entries(screeningData!.level_scores).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-(--color-navy)/50 font-medium capitalize">{key.replace('_', ' ')}</span>
                      <span className="font-bold text-(--color-navy)">{(Number(val) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* No screening - soft suggestion, NOT a blocker */
            !dismissedSuggestion ? (
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Brain className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-amber-800">Screening Recommended</h3>
                </div>
                <p className="text-sm text-amber-700 mb-4 leading-relaxed">
                  Taking a screening test before your consultation helps your doctor understand your cognitive baseline. It's optional, but highly recommended.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => navigate('/screening')}
                    className="flex-1 py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    Take Screening <ArrowRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setDismissedSuggestion(true)}
                    className="py-3 px-5 bg-white text-amber-700 font-bold rounded-xl border border-amber-200 hover:bg-amber-100 transition-all text-sm"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-(--color-border-light) shadow-sm text-center">
                <Brain className="w-10 h-10 text-(--color-navy)/20 mx-auto mb-2" />
                <p className="text-sm text-(--color-navy)/40 font-medium">No screening data attached</p>
              </div>
            )
          )}

          {/* Activity Summary Card */}
          {recentActivities.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-(--color-border-light) shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-violet-500" />
                </div>
                <h3 className="font-bold text-(--color-navy)">Recent Activity Scores</h3>
              </div>
              <div className="space-y-2">
                {recentActivities.map((act: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-(--color-surface-alt)">
                    <span className="text-(--color-navy)/60 font-medium capitalize">{act.type?.replace(/_/g, ' ') || 'Activity'}</span>
                    <span className="font-bold text-(--color-navy)">{act.score ?? act.percentage ?? '—'}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expert matching card */}
          <div className="bg-(--color-navy) p-8 rounded-3xl text-white shadow-xl shadow-(--color-navy)/20">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                   <User className="w-5 h-5" />
                </div>
                <h4 className="font-bold">{doctor_name ? `Dr. ${doctor_name.replace('Dr. ', '')}` : 'Expert Matching'}</h4>
             </div>
             <p className="text-sm opacity-70 leading-relaxed">
               {doctor_name 
                 ? `${specialty || 'Specialist'} — Your screening results and activity history will be shared securely.`
                 : 'We match you with board-certified geriatric specialists available in your region for immediate review.'}
             </p>
          </div>
        </div>

        {/* Right: Submission Form — ALWAYS shown */}
        <div className="lg:col-span-3">
          <div className="bg-white p-8 rounded-3xl border border-(--color-border-light) shadow-sm h-full flex flex-col">
            <div className="mb-8">
               <h3 className="text-2xl font-bold text-(--color-navy) mb-2">Request Professional Review</h3>
               <p className="text-(--color-navy)/40 font-medium">Add any additional notes or concerns you'd like to share with the doctor.</p>
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <label className="text-xs font-black text-(--color-navy)/50 uppercase tracking-widest block mb-3 px-1">Describe symptoms or concerns</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-40 p-6 bg-(--color-surface-alt) border-2 border-transparent border-(--color-border-light) rounded-3xl outline-none focus:border-(--color-sage) focus:bg-white text-lg font-medium text-(--color-navy) transition-all resize-none"
                  placeholder="e.g. Difficulty remembering appointments, increased confusion in evenings..."
                />
              </div>

              <div>
                <label className="text-xs font-black text-(--color-navy)/50 uppercase tracking-widest block mb-4 px-1">Select Consultation Date & Time *</label>
                
                {/* Date Picker (Horizontal Scroll) */}
                <div className="flex gap-3 overflow-x-auto pb-4 mb-2 scrollbar-hide">
                  {nextDays.map(dateStr => {
                    const d = new Date(dateStr);
                    const isSelected = selectedDate === dateStr;
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-2xl border-2 transition-all shrink-0 ${
                          isSelected 
                            ? 'bg-(--color-sage) border-(--color-sage) text-white shadow-lg shadow-[#84A59D]/30' 
                            : 'bg-white border-(--color-border-light) text-(--color-navy) hover:border-(--color-sage)/50'
                        }`}
                      >
                        <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-white/80' : 'text-(--color-navy)/40'}`}>
                          {d.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="text-lg font-black">{d.getDate()}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Slot Grid */}
                <div className="bg-(--color-surface-alt) rounded-3xl p-6 border-2 border-(--color-border-light)">
                  <div className="flex items-center gap-2 mb-4 text-(--color-navy)/60 font-bold text-sm">
                    <Clock className="w-4 h-4" /> Available Slots
                  </div>
                  
                  {slotsLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="w-6 h-6 border-2 border-(--color-sage)/30 border-t-(--color-sage) text-(--color-sage) rounded-full animate-spin" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-6 text-(--color-navy)/40 font-medium bg-white rounded-2xl border border-dashed border-(--color-border-light)">
                      No slots available on this date.<br/>Please select another date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {availableSlots.map(slot => {
                        const timeStr = slot.split('T')[1].substring(0, 5);
                        const [h, m] = timeStr.split(':');
                        const hInt = parseInt(h);
                        const ampm = hInt >= 12 ? 'PM' : 'AM';
                        const displayTime = `${hInt % 12 || 12}:${m} ${ampm}`;
                        const isSelected = timeSlot === slot;
                        
                        return (
                          <button
                            key={slot}
                            onClick={() => setTimeSlot(slot)}
                            className={`py-3 px-2 rounded-xl text-center font-bold text-sm transition-all border-2 ${
                              isSelected
                                ? 'bg-(--color-navy) border-(--color-navy) text-white shadow-md'
                                : 'bg-white border-transparent text-(--color-navy) hover:border-(--color-navy)/20 hover:bg-(--color-navy)/5'
                            }`}
                          >
                            {displayTime}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Data Sharing Options */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-(--color-navy)/40 uppercase tracking-widest px-1">Data to share with doctor</p>
                
                {/* Screening toggle */}
                {hasScreening && (
                  <div className="flex items-center gap-3 bg-(--color-surface-alt) p-4 rounded-xl border border-(--color-border-light) cursor-pointer" onClick={() => setIncludeScreening(!includeScreening)}>
                    <input 
                      type="checkbox" 
                      checked={includeScreening} 
                      onChange={(e) => setIncludeScreening(e.target.checked)} 
                      className="w-5 h-5 accent-blue-600 cursor-pointer" 
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label className="text-sm font-bold text-(--color-navy) cursor-pointer select-none flex-1">
                      Include cognitive screening results ({screeningData!.risk_band} risk — {((screeningData!.cognitive_score || 0) * 100).toFixed(0)}%)
                    </label>
                  </div>
                )}

                {/* Activities toggle */}
                {activityData.length > 0 && (
                  <div className="flex items-center gap-3 bg-(--color-surface-alt) p-4 rounded-xl border border-(--color-border-light) cursor-pointer" onClick={() => setIncludeActivities(!includeActivities)}>
                    <input 
                      type="checkbox" 
                      checked={includeActivities} 
                      onChange={(e) => setIncludeActivities(e.target.checked)} 
                      className="w-5 h-5 accent-violet-600 cursor-pointer" 
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label className="text-sm font-bold text-(--color-navy) cursor-pointer select-none flex-1">
                      Include recent activity performance ({activityData.length} results)
                    </label>
                  </div>
                )}

                {(hasScreening && includeScreening) && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                     <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                     <p className="text-xs text-blue-700 font-semibold leading-relaxed">
                       Your screening results and AI analysis will be securely attached to this request.
                     </p>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-10 py-5 bg-(--color-sage) text-white font-black text-xl rounded-2xl hover:bg-(--color-sage-light) transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-(--color-sage)/20 flex items-center justify-center gap-3"
            >
              {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-6 h-6" />}
              Send Consultation Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationRequest;
