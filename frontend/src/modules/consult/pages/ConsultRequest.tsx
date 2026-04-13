import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, CheckCircle2, ChevronLeft, Brain, User, AlertCircle, Calendar, FileText, Stethoscope, Clock } from 'lucide-react';
import VoiceDictation from '@/components/ui/VoiceDictation';
import { getConsultPatientAuth } from '../../../utils/sessionBridge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ConsultRequest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { screening_id, risk_level, summary, doctor_id, doctor_name, specialty } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [timeSlot, setTimeSlot] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Date & Slot Selection State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Generate next 7 days
  const nextDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    // Fallback ID if auto-assign is used
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

  // Pre-fill from consult auth or main app auth (session bridge)
  const auth = getConsultPatientAuth();
  const consultUser = auth?.user || {};
  const [nameValue] = useState(consultUser.full_name || '');

  const handleSubmit = async () => {
    if (!fullName.trim() && !nameValue.trim()) {
      alert('Please enter your full name');
      return;
    }
    if (!timeSlot) {
      alert('Please select a time slot for your consultation.');
      return;
    }
    setLoading(true);
    try {
      const token = auth?.token || localStorage.getItem('consult_token');

      const res = await fetch(`${API_URL}/doctors/consult/patient/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patient_id: consultUser.id,
          screening_id: screening_id || null,
          doctor_id: doctor_id || null,
          status: 'pending',
          metadata: {
            risk_level: risk_level || 'not_screened',
            summary: summary || '',
            patient_notes: notes,
            patient_name: fullName || nameValue,
            patient_age: age,
            patient_phone: phone,
            doctor_name: doctor_name || 'Auto-Assign',
            specialty: specialty || 'General'
          },
          time_slot: timeSlot
        })
      });

      if (!res.ok) throw new Error('Failed to submit request');
      navigate('/consult/patient/success', { state: { doctor_name: doctor_name || 'a specialist' } });
    } catch (err) {
      console.error('Error submitting consultation request:', err);
      alert('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('consult_token');
    localStorage.removeItem('consult_role');
    localStorage.removeItem('consult_user');
    navigate('/consult');
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E0] px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <span onClick={() => navigate('/consult')} className="text-xl font-bold text-[#0D2B45] cursor-pointer">NeuroVia</span>
          <span className="text-xs font-black text-[#8C9A86] uppercase tracking-widest bg-[#8C9A86]/10 px-3 py-1 rounded-full">Booking</span>
        </div>
        <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-600 font-bold transition-colors">
          Sign Out
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-[#E5E5E0] rounded-xl hover:bg-[#FAFAF7] transition-all">
            <ChevronLeft className="w-5 h-5 text-[#0D2B45]/60" />
          </button>
          <h2 className="text-3xl font-black text-[#0D2B45]">Book Consultation</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Left Column: Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Doctor */}
            {doctor_name && (
              <div className="bg-white p-6 rounded-3xl border border-[#E5E5E0] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#0D2B45]/10 rounded-2xl flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-[#0D2B45]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0D2B45]">{doctor_name}</h3>
                    <p className="text-sm text-[#8C9A86] font-semibold">{specialty}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Screening Data (if available) */}
            {risk_level && (
              <div className="bg-white p-6 rounded-3xl border border-[#E5E5E0] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#8C9A86]/10 rounded-2xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-[#8C9A86]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0D2B45]">Screening Attached</h3>
                </div>
                <div className={`p-3 rounded-xl flex items-center gap-2 border text-sm font-bold ${
                  risk_level === 'high' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                }`}>
                  <AlertCircle className="w-4 h-4" />
                  {risk_level.toUpperCase()} RISK
                </div>
                {summary && (
                  <p className="mt-4 text-[#0D2B45]/50 text-sm italic border-l-4 border-[#E5E5E0] pl-4">
                    "{summary}"
                  </p>
                )}
              </div>
            )}

            {/* Info card */}
            <div className="bg-[#0D2B45] p-6 rounded-3xl text-white shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-[#8C9A86]" />
                <h4 className="font-bold text-sm">What happens next?</h4>
              </div>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-[#8C9A86] mt-0.5">1.</span>
                  Your request is sent to the specialist
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#8C9A86] mt-0.5">2.</span>
                  Doctor reviews your screening data
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#8C9A86] mt-0.5">3.</span>
                  You receive a response with clinical notes
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-3">
            <div className="bg-white p-8 rounded-3xl border border-[#E5E5E0] shadow-sm">
              <h3 className="text-2xl font-bold text-[#0D2B45] mb-2">Your Details</h3>
              <p className="text-[#0D2B45]/40 font-medium mb-8">Fill in your information to complete the booking.</p>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-black text-[#0D2B45]/50 uppercase tracking-widest block mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={fullName || nameValue}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-5 py-4 bg-[#FAFAF7] border-2 border-[#E5E5E0] rounded-2xl outline-none focus:border-[#8C9A86] focus:bg-white text-[#0D2B45] font-semibold text-base transition-all placeholder:text-[#0D2B45]/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-[#0D2B45]/50 uppercase tracking-widest block mb-2">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="65"
                      className="w-full px-5 py-4 bg-[#FAFAF7] border-2 border-[#E5E5E0] rounded-2xl outline-none focus:border-[#8C9A86] focus:bg-white text-[#0D2B45] font-semibold text-base transition-all placeholder:text-[#0D2B45]/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-[#0D2B45]/50 uppercase tracking-widest block mb-2">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-5 py-4 bg-[#FAFAF7] border-2 border-[#E5E5E0] rounded-2xl outline-none focus:border-[#8C9A86] focus:bg-white text-[#0D2B45] font-semibold text-base transition-all placeholder:text-[#0D2B45]/20"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-xs font-black text-[#0D2B45]/50 uppercase tracking-widest">Describe symptoms or concerns</label>
                    <VoiceDictation onTranscript={(text) => setNotes(prev => prev ? prev + ' ' + text : text)} />
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-40 p-5 bg-[#FAFAF7] border-2 border-[#E5E5E0] rounded-2xl outline-none focus:border-[#8C9A86] focus:bg-white text-base font-medium text-[#0D2B45] transition-all resize-none placeholder:text-[#0D2B45]/20"
                    placeholder="e.g. Difficulty remembering appointments, increased confusion in evenings..."
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-[#0D2B45]/50 uppercase tracking-widest block mb-4">Select Consultation Date & Time *</label>
                  
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
                              ? 'bg-[#8C9A86] border-[#8C9A86] text-white shadow-lg shadow-[#8C9A86]/30' 
                              : 'bg-white border-[#E5E5E0] text-[#0D2B45] hover:border-[#8C9A86]/50'
                          }`}
                        >
                          <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-white/80' : 'text-[#0D2B45]/40'}`}>
                            {d.toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          <span className="text-lg font-black">{d.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Slot Grid */}
                  <div className="bg-[#FAFAF7] rounded-3xl p-6 border-2 border-[#E5E5E0]">
                    <div className="flex items-center gap-2 mb-4 text-[#0D2B45]/60 font-bold text-sm">
                      <Clock className="w-4 h-4" /> Available Slots
                    </div>
                    
                    {slotsLoading ? (
                      <div className="flex justify-center py-6">
                        <div className="w-6 h-6 border-2 border-[#8C9A86]/30 border-t-[#8C9A86] text-[#8C9A86] rounded-full animate-spin" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-6 text-[#0D2B45]/40 font-medium bg-white rounded-2xl border border-dashed border-[#E5E5E0]">
                        No slots available on this date.<br/>Please select another date.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {availableSlots.map(slot => {
                          const timeStr = slot.split('T')[1].substring(0, 5); // HH:MM
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
                                  ? 'bg-[#0D2B45] border-[#0D2B45] text-white shadow-md'
                                  : 'bg-white border-transparent text-[#0D2B45] hover:border-[#0D2B45]/20 hover:bg-[#0D2B45]/5'
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

                <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shrink-0 text-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-blue-700 font-semibold leading-relaxed">
                    {risk_level
                      ? 'Your screening results and AI analysis will be securely attached to this request automatically.'
                      : 'You can take a free cognitive screening to attach clinical data to your request.'}
                  </p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full mt-4 py-5 bg-[#8C9A86] text-white font-black text-xl rounded-2xl hover:bg-[#7a8c7a] transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-[#8C9A86]/20 flex items-center justify-center gap-3"
                >
                  {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-6 h-6" />}
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultRequest;
