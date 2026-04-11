import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Brain, Home } from 'lucide-react';

export default function ConsultSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { doctor_name } = location.state || {};

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="w-28 h-28 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-200/50">
          <CheckCircle2 className="w-14 h-14 text-emerald-600" />
        </div>

        <h1 className="text-5xl font-black text-[#0D2B45] mb-4 tracking-tight">
          Booking Confirmed<span className="text-[#8C9A86]">!</span>
        </h1>

        <p className="text-xl text-slate-400 leading-relaxed mb-4">
          Your consultation request has been sent to{' '}
          <span className="font-bold text-[#0D2B45]">{doctor_name || 'a specialist'}</span>.
        </p>
        <p className="text-base text-slate-400 mb-12">
          The doctor will review your submission and you will be contacted with next steps within 24-48 hours.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/consult/patient/doctors')}
            className="px-8 py-4 bg-[#0D2B45] text-white font-bold rounded-2xl hover:bg-[#1a3a55] transition-all shadow-lg flex items-center justify-center gap-2 group"
          >
            Book Another
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-white text-[#0D2B45] font-bold rounded-2xl border-2 border-[#E5E5E0] hover:border-[#8C9A86] transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        </div>

        <div className="mt-14 flex items-center justify-center gap-3">
          <Brain className="w-5 h-5 text-[#8C9A86]" />
          <span className="text-sm text-slate-400 font-semibold">NeuroVia Consultation Portal</span>
        </div>
      </div>
    </div>
  );
}
