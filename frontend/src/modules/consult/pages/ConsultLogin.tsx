import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Brain, Eye, EyeOff, Shield, ArrowRight, User, Stethoscope } from 'lucide-react';
import GoogleLoginButton from '../../../components/auth/GoogleLoginButton';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface ConsultLoginProps {
  role: 'patient' | 'doctor';
}

export default function ConsultLogin({ role }: ConsultLoginProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const screeningState = location.state || {};

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isDoctor = role === 'doctor';
  const RoleIcon = isDoctor ? Stethoscope : User;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');

      // Store in SEPARATE consultation storage — NOT the main app's storage
      localStorage.setItem('consult_token', data.access_token);
      localStorage.setItem('consult_role', role);
      localStorage.setItem('consult_user', JSON.stringify(data.user));

      // Route based on selected role
      if (role === 'doctor') {
        window.location.href = '/consult/doctor/consultations';
      } else {
        window.location.href = '/consult/patient/doctors';
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[48%] bg-gradient-to-br from-[#0D2B45] via-[#143350] to-[#0a1f33] text-white flex-col justify-between p-14 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8C9A86]/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#8C9A86]/8 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10">
          <Link to="/consult" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#8C9A86]/20 rounded-xl flex items-center justify-center border border-[#8C9A86]/30">
              <Brain className="w-5 h-5 text-[#8C9A86]" />
            </div>
            <span className="text-xl font-bold tracking-wide">NeuroVia</span>
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center -mt-10">
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 w-fit mb-8 border ${isDoctor ? 'bg-[#8C9A86]/10 border-[#8C9A86]/20' : 'bg-[#8C9A86]/10 border-[#8C9A86]/20'}`}>
            <RoleIcon className="w-3.5 h-3.5 text-[#8C9A86]" />
            <span className="text-[#8C9A86] text-xs font-bold uppercase tracking-widest">
              {isDoctor ? 'Doctor Portal' : 'Patient Access'}
            </span>
          </div>
          <h1 className="text-5xl xl:text-6xl font-serif text-white mb-6 leading-[1.1]">
            {isDoctor ? (
              <>Manage<br />Consultations<span className="text-[#8C9A86]">.</span></>
            ) : (
              <>Find Your<br />Specialist<span className="text-[#8C9A86]">.</span></>
            )}
          </h1>
          <p className="text-lg text-slate-400 max-w-sm leading-relaxed">
            {isDoctor
              ? 'Review patient screening results, manage consultation requests, and provide clinical feedback.'
              : 'Browse qualified medical specialists and book a professional cognitive health consultation.'}
          </p>
        </div>

        <div className="relative z-10 text-slate-500 text-sm">
          © 2026 NeuroVia Health Technologies
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 bg-[#FAFAF7] flex flex-col justify-center items-center px-6">
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <Link to="/consult" className="flex items-center gap-3 mb-10 lg:hidden">
            <Brain className="w-7 h-7 text-[#8C9A86]" />
            <span className="text-xl font-bold text-[#0D2B45]">NeuroVia</span>
          </Link>

          {/* Role badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${isDoctor ? 'bg-[#0D2B45]/10 text-[#0D2B45]' : 'bg-[#8C9A86]/10 text-[#8C9A86]'}`}>
            <RoleIcon className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">
              {isDoctor ? 'Doctor Login' : 'Patient Login'}
            </span>
          </div>

          <h2 className="text-3xl font-bold text-[#0D2B45] mb-2">Sign in to consult</h2>
          <p className="text-slate-500 mb-8">
            {isDoctor
              ? 'Access your consultation dashboard'
              : 'Find and book a specialist consultation'}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium mb-6 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#0D2B45] mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E5E5E0] bg-white text-[#0D2B45] text-base outline-none focus:border-[#8C9A86] focus:ring-4 focus:ring-[#8C9A86]/10 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0D2B45] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E5E5E0] bg-white text-[#0D2B45] text-base outline-none focus:border-[#8C9A86] focus:ring-4 focus:ring-[#8C9A86]/10 transition-all pr-12 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0D2B45] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 font-bold text-base rounded-2xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 group ${
                isDoctor
                  ? 'bg-[#0D2B45] text-white hover:bg-[#1a3a55] shadow-[#0D2B45]/20'
                  : 'bg-[#8C9A86] text-white hover:bg-[#7a8c7a] shadow-[#8C9A86]/20'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <>
                  {isDoctor ? 'Enter Doctor Portal' : 'Continue to Specialists'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Demo Login */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#E5E5E0]" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-[#E5E5E0]" />
            </div>
            <button
              type="button"
              onClick={() => {
                const demoUser = isDoctor
                  ? { id: 'demo-doctor-1', email: 'dr.demo@neurovia.com', full_name: 'Dr. Sarah Chen', role: 'doctor' }
                  : { id: 'demo-patient-1', email: 'patient.demo@neurovia.com', full_name: 'Alex Johnson', role: 'user' };
                localStorage.setItem('consult_token', 'demo_token_' + Date.now());
                localStorage.setItem('consult_role', role);
                localStorage.setItem('consult_user', JSON.stringify(demoUser));
                if (role === 'doctor') {
                  window.location.href = '/consult/doctor/consultations';
                } else {
                  window.location.href = '/consult/patient/doctors';
                }
              }}
              className="w-full py-4 bg-white text-[#0D2B45] font-bold text-base rounded-2xl border-2 border-[#E5E5E0] hover:border-[#8C9A86] hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              ✨ Try Demo Account
            </button>
            <p className="text-center text-xs text-slate-400 mt-2">
              {isDoctor ? 'Sign in as Dr. Sarah Chen' : 'Sign in as Alex Johnson (Patient)'}
            </p>
          </div>

          {/* Google Login */}
          <div className="mt-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#E5E5E0]" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">or use</span>
              <div className="flex-1 h-px bg-[#E5E5E0]" />
            </div>
            <GoogleLoginButton
              onSuccess={async (credential: string) => {
                setLoading(true);
                setError('');
                try {
                  const res = await fetch(`${API_URL}/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: credential, role }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.detail || 'Google login failed');
                  // Store in consultation storage
                  localStorage.setItem('consult_token', data.access_token);
                  localStorage.setItem('consult_role', role);
                  localStorage.setItem('consult_user', JSON.stringify(data.user));
                  // Also store in main app storage
                  if (role === 'doctor') {
                    localStorage.setItem('neurovia_doctor_token', data.access_token);
                    localStorage.setItem('neurovia_doctor_user', JSON.stringify(data.user));
                    window.location.href = '/consult/doctor/consultations';
                  } else {
                    localStorage.setItem('neurovia_patient_token', data.access_token);
                    localStorage.setItem('neurovia_patient_user', JSON.stringify(data.user));
                    window.location.href = '/consult/patient/doctors';
                  }
                } catch (err: any) {
                  if (err.message === 'Doctor profile details required') {
                    navigate('/register', { state: { role: 'doctor', googleToken: credential } });
                  } else {
                    setError(err.message || 'Google login failed.');
                  }
                } finally {
                  setLoading(false);
                }
              }}
              text="continue_with"
            />
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-[#8C9A86] hover:text-[#6D8274] transition-colors">
                Create one
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <span
              onClick={() => navigate('/consult')}
              className="text-sm text-slate-400 font-semibold cursor-pointer hover:text-[#0D2B45] transition-colors"
            >
              ← Back to role selection
            </span>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <Shield className="w-3.5 h-3.5" />
            <span>256-bit AES encryption · HIPAA compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
