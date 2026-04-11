import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Brain, User, Stethoscope, ArrowRight, Shield, Sparkles } from 'lucide-react';

export default function ConsultEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  // Preserve any screening state passed in
  const screeningState = location.state || {};

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-[#0D2B45] rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-[#8C9A86]" />
          </div>
          <span className="text-xl font-bold text-[#0D2B45] tracking-wide">NeuroVia</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <Shield className="w-3.5 h-3.5" />
          <span>HIPAA Compliant</span>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-[#8C9A86]/10 border border-[#8C9A86]/20 rounded-full px-5 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-[#8C9A86]" />
            <span className="text-[#8C9A86] text-xs font-black uppercase tracking-widest">Consultation Portal</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-[#0D2B45] mb-4 tracking-tight">
            How can we help<span className="text-[#8C9A86]">?</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-lg mx-auto leading-relaxed">
            Connect with board-certified specialists for professional cognitive health consultations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          {/* Patient Card */}
          <button
            onClick={() => navigate('/consult/login/patient', { state: screeningState })}
            className="group relative bg-white rounded-3xl border-2 border-[#E5E5E0] p-10 text-left hover:border-[#8C9A86] hover:shadow-2xl hover:shadow-[#8C9A86]/10 transition-all duration-500 hover:-translate-y-2"
          >
            <div className="absolute top-6 right-6 w-10 h-10 bg-[#8C9A86]/0 group-hover:bg-[#8C9A86] rounded-xl flex items-center justify-center transition-all duration-500">
              <ArrowRight className="w-5 h-5 text-[#8C9A86] group-hover:text-white transition-colors" />
            </div>

            <div className="w-20 h-20 bg-gradient-to-br from-[#8C9A86]/10 to-[#8C9A86]/5 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
              <User className="w-10 h-10 text-[#8C9A86]" />
            </div>

            <h3 className="text-2xl font-black text-[#0D2B45] mb-3">I'm a Patient</h3>
            <p className="text-slate-400 leading-relaxed font-medium">
              Browse qualified specialists and book a professional cognitive health consultation.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {['Browse Doctors', 'Book Appointment', 'Share Reports'].map(tag => (
                <span key={tag} className="px-3 py-1.5 bg-[#FAFAF7] border border-[#E5E5E0] rounded-lg text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          </button>

          {/* Doctor Card */}
          <button
            onClick={() => navigate('/consult/login/doctor')}
            className="group relative bg-white rounded-3xl border-2 border-[#E5E5E0] p-10 text-left hover:border-[#0D2B45] hover:shadow-2xl hover:shadow-[#0D2B45]/10 transition-all duration-500 hover:-translate-y-2"
          >
            <div className="absolute top-6 right-6 w-10 h-10 bg-[#0D2B45]/0 group-hover:bg-[#0D2B45] rounded-xl flex items-center justify-center transition-all duration-500">
              <ArrowRight className="w-5 h-5 text-[#0D2B45] group-hover:text-white transition-colors" />
            </div>

            <div className="w-20 h-20 bg-gradient-to-br from-[#0D2B45]/10 to-[#0D2B45]/5 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
              <Stethoscope className="w-10 h-10 text-[#0D2B45]" />
            </div>

            <h3 className="text-2xl font-black text-[#0D2B45] mb-3">I'm a Doctor</h3>
            <p className="text-slate-400 leading-relaxed font-medium">
              Access your patient queue, review consultation requests, and respond with clinical notes.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {['View Patients', 'Manage Requests', 'Clinical Notes'].map(tag => (
                <span key={tag} className="px-3 py-1.5 bg-[#FAFAF7] border border-[#E5E5E0] rounded-lg text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          </button>
        </div>

        <p className="mt-12 text-slate-400 text-sm">
          Need a cognitive screening first?{' '}
          <span onClick={() => navigate('/screening')} className="font-bold text-[#8C9A86] cursor-pointer hover:text-[#6D8274] transition-colors underline underline-offset-4">
            Take our free assessment
          </span>
        </p>
      </div>
    </div>
  );
}
