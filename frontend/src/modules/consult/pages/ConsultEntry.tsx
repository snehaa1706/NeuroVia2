import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, Brain, User, Stethoscope, ArrowRight, Shield, Sparkles } from 'lucide-react';

export default function ConsultEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  // Preserve any screening state passed in
  const screeningState = location.state || {};

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col font-sans" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-[#6b7c52] rounded-[10px] flex items-center justify-center transition-transform group-hover:rotate-3 shadow-sm">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black text-[#1a2744] tracking-tight uppercase">NeuroVia</span>
        </div>
        <div className="flex items-center gap-2 text-[#4a5578]/60 font-bold text-xs uppercase tracking-widest">
          <Shield className="w-3.5 h-3.5" />
          <span>HIPAA Compliant</span>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-10">
        <div className="text-center mb-16 animate-[fadeUp_0.5s_ease-out]">
          <div className="inline-flex items-center gap-2 bg-[#6b7c52]/10 border border-[#6b7c52]/20 rounded-full px-5 py-2 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-[#6b7c52]" />
            <span className="text-[#6b7c52] text-[0.7rem] font-bold uppercase tracking-[0.13em]">Consultation Portal</span>
          </div>
          <h1 className="text-[clamp(3rem,6vw,4.5rem)] font-semibold text-[#1a2744] mb-4 tracking-tight leading-[1.05]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            How can we help<span className="text-[#6b7c52] italic">?</span>
          </h1>
          <p className="text-lg md:text-xl text-[#4a5578]/80 font-light max-w-lg mx-auto leading-relaxed">
            Connect with board-certified specialists for professional cognitive health consultations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Patient Card */}
          <button
            onClick={() => navigate('/consult/login/patient', { state: screeningState })}
            className="group relative bg-[#ede7d9] rounded-[2rem] border border-[#d2c8b98c] p-10 text-left hover:bg-[#f5f0e8] hover:border-[#6b7c52] hover:shadow-xl hover:shadow-[#6b7c52]/10 transition-all duration-500 hover:-translate-y-2 flex flex-col"
          >
            <div className="absolute top-6 right-6 w-10 h-10 bg-[#6b7c52]/0 group-hover:bg-[#6b7c52] rounded-xl flex items-center justify-center transition-all duration-500">
              <ArrowRight className="w-5 h-5 text-[#6b7c52] group-hover:text-white transition-colors" />
            </div>

            <div className="w-20 h-20 bg-[#f5f0e8] border border-[#d2c8b98c] shadow-sm group-hover:border-[#6b7c52]/30 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
              <User className="w-10 h-10 text-[#6b7c52]" />
            </div>

            <h3 className="text-[1.8rem] font-semibold text-[#1a2744] mb-3 group-hover:text-[#6b7c52] transition-colors" style={{ fontFamily: "'Cormorant Garamond', serif" }}>I'm a Patient</h3>
            <p className="text-[#4a5578]/80 leading-relaxed font-light mb-8 flex-1">
              Browse qualified specialists and book a professional cognitive health consultation.
            </p>

            <div className="flex flex-wrap gap-2 mt-auto">
              {['Browse Doctors', 'Book Appointment', 'Share Reports'].map(tag => (
                <span key={tag} className="px-3.5 py-1.5 bg-[#f5f0e8] border border-[#d2c8b98c] group-hover:border-[#6b7c52]/30 group-hover:bg-white/50 rounded-lg text-[0.65rem] font-bold text-[#1a2744]/70 uppercase tracking-widest transition-colors">
                  {tag}
                </span>
              ))}
            </div>
          </button>

          {/* Doctor Card */}
          <button
            onClick={() => navigate('/consult/login/doctor')}
            className="group relative bg-[#ede7d9] rounded-[2rem] border border-[#d2c8b98c] p-10 text-left hover:bg-[#f5f0e8] hover:border-[#1a2744] hover:shadow-xl hover:shadow-[#1a2744]/10 transition-all duration-500 hover:-translate-y-2 flex flex-col"
          >
            <div className="absolute top-6 right-6 w-10 h-10 bg-[#1a2744]/0 group-hover:bg-[#1a2744] rounded-xl flex items-center justify-center transition-all duration-500">
              <ArrowRight className="w-5 h-5 text-[#1a2744] group-hover:text-white transition-colors" />
            </div>

            <div className="w-20 h-20 bg-[#f5f0e8] border border-[#d2c8b98c] shadow-sm group-hover:border-[#1a2744]/30 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
              <Stethoscope className="w-10 h-10 text-[#1a2744]" />
            </div>

            <h3 className="text-[1.8rem] font-semibold text-[#1a2744] mb-3 group-hover:text-[#1a2744] transition-colors" style={{ fontFamily: "'Cormorant Garamond', serif" }}>I'm a Doctor</h3>
            <p className="text-[#4a5578]/80 leading-relaxed font-light mb-8 flex-1">
              Access your patient queue, review consultation requests, and respond with clinical notes.
            </p>

            <div className="flex flex-wrap gap-2 mt-auto">
              {['View Patients', 'Manage Requests', 'Clinical Notes'].map(tag => (
                <span key={tag} className="px-3.5 py-1.5 bg-[#f5f0e8] border border-[#d2c8b98c] group-hover:border-[#1a2744]/30 group-hover:bg-white/50 rounded-lg text-[0.65rem] font-bold text-[#1a2744]/70 uppercase tracking-widest transition-colors">
                  {tag}
                </span>
              ))}
            </div>
          </button>
        </div>

        <p className="mt-14 text-[#4a5578]/70 text-[0.9rem] font-light">
          Need a cognitive screening first?{' '}
          <span onClick={() => navigate('/screening')} className="font-semibold text-[#6b7c52] cursor-pointer hover:text-[#556540] transition-colors underline underline-offset-4 decoration-[#6b7c52]/30 hover:decoration-[#6b7c52]">
            Take our free assessment
          </span>
        </p>
      </div>
    </div>
  );
}
