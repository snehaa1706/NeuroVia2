import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Brain, Eye, EyeOff, Shield, ArrowRight, User, Stethoscope, Activity, Heart, Users } from 'lucide-react';
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

  const fontSans = { fontFamily: "'DM Sans', sans-serif" };
  const fontSerif = { fontFamily: "'Cormorant Garamond', serif" };

  return (
    <div style={fontSans} className="min-h-screen flex bg-[#f5f0e8] text-[#1a2744]">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col relative flex-[0_0_58%] overflow-hidden p-8 lg:p-[4rem_5rem]">
        <img src="https://images.unsplash.com/photo-1576765608866-5b51046452be?auto=format&fit=crop&w=1400&q=80" 
             alt="Background" 
             className="absolute inset-0 w-full h-full object-cover object-[center_30%] brightness-[0.88] saturate-[0.88] opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1628a6] via-[#14230f59] to-[#0a0f081a]" />
        
        <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between w-full">
                <Link to="/" className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-[#6b7c52] rounded-[8px] flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[1.15rem] font-semibold text-white">NeuroVia</span>
                </Link>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/consult')} className="px-[1.1rem] py-[0.44rem] rounded-[8px] text-[0.83rem] font-medium border-[1.5px] border-[#f5f0e873] text-[#f5f0e8] bg-[#ffffff14] backdrop-blur-[10px] transition-all duration-[280ms] hover:bg-[#ffffff38] hover:border-[#ffffffbf] hover:-translate-y-[1px]">Change Role</button>
                    <button onClick={() => navigate('/register')} className="px-[1.1rem] py-[0.44rem] rounded-[8px] text-[0.83rem] font-medium border-[1.5px] border-[#6b7c52] text-white bg-[#6b7c52] backdrop-blur-[10px] transition-all duration-[280ms] hover:bg-[#556540] hover:border-[#556540] hover:-translate-y-[1px]">Sign Up</button>
                </div>
            </div>

            <div className="mt-auto pb-4">
                <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-white/70 uppercase mb-4">
                    AI-Powered Care Intelligence
                </p>
                <h1 style={fontSerif} className="text-[clamp(2.6rem,4.5vw,4rem)] font-semibold text-[#f5f0e8] leading-[1.08]">
                    Empowering <br />
                    <span className="italic block text-[#b8d49e]">Better Care</span>
                </h1>
                <p className="mt-[1.3rem] text-[0.92rem] font-light text-white/82 leading-[1.65] max-w-[380px]">
                    AI-powered dementia screening and caregiver monitoring — helping families detect early, act faster, and give doctors the clarity they need to help.
                </p>
                <div className="flex flex-wrap gap-[0.6rem] mt-[2rem]">
                    {[
                      { l: 'Early Detection', i: Activity }, 
                      { l: 'Real-Time Monitoring', i: Heart }, 
                      { l: 'Caregiver Support', i: Users }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-[0.4rem] px-[0.9rem] py-[0.42rem] rounded-[100px] bg-white/10 backdrop-blur-[10px] border border-white/20 text-white/90 text-[0.77rem] transition-all duration-[280ms] hover:bg-[#ffffff38] hover:-translate-y-[1px]">
                            <item.i className="w-[13px] h-[13px] text-white/75" />
                            {item.l}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 text-[0.72rem] text-white/35">
                © 2026 NeuroVia Health Technologies. All rights reserved.
            </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-[#f5f0e8]">
        <div className="w-full max-w-[420px] animate-[fadeUp_0.5s_cubic-bezier(0.22,1,0.36,1)]">
          <Link to="/consult" className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-[#6b7c52] rounded-[8px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1a2744]">NeuroVia</span>
          </Link>

          <h2 style={fontSerif} className="text-[2.2rem] font-medium text-[#1a2744] mb-3 leading-tight">
            Sign in to consult
          </h2>
          <p className="text-[0.9rem] text-[#4a5578] font-light mb-8 flex items-center justify-between">
            <span>{isDoctor ? 'Access your consultation dashboard' : 'Find and book a specialist consultation'}</span>
            <span className="text-[0.68rem] font-bold text-[#6b7c52] tracking-wider uppercase px-2 py-0.5 bg-[#6b7c52]/10 rounded-full">{isDoctor ? 'Doctor' : 'Patient'}</span>
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-[1.1rem]">
            <div>
              <label className="block text-[0.68rem] font-bold text-[#2e3f6b] uppercase tracking-[0.08em] mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3.5 rounded-[12px] border border-[#d2c8b98c] bg-transparent text-[#1a2744] text-[0.9rem] outline-none focus:border-[#6b7c52] transition-colors placeholder:text-[#4a5578]/50 focus:bg-white/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[0.68rem] font-bold text-[#2e3f6b] uppercase tracking-[0.08em]">Password</label>
                <a href="#" className="text-[0.75rem] text-[#6b7c52] hover:text-[#556540] font-medium transition-colors">Reset password</a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3.5 rounded-[12px] border border-[#d2c8b98c] bg-transparent text-[#1a2744] text-[0.9rem] outline-none focus:border-[#6b7c52] transition-colors pr-12 placeholder:text-[#4a5578]/50 focus:bg-white/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4a5578]/60 hover:text-[#6b7c52] transition-colors flex items-center justify-center p-1"
                >
                  {showPassword ? <EyeOff className="w-[1.2rem] h-[1.2rem]" /> : <Eye className="w-[1.2rem] h-[1.2rem]" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-[0.85rem] mt-4 bg-[#6b7c52] text-white font-medium text-[0.95rem] rounded-[10px] hover:bg-[#556540] transition-all duration-[280ms] disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(107,124,82,0.15)] outline-none focus:ring-4 focus:ring-[#6b7c52]/20 shadow-sm"
            >
              {loading ? "Signing in..." : (isDoctor ? "Enter Doctor Portal" : "Continue to Specialists")}
            </button>
          </form>

          {/* Demo Login */}
          <div className="mt-4">
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
              className="w-full py-[0.85rem] bg-transparent text-[#1a2744] font-medium text-[0.95rem] rounded-[10px] border border-[#d2c8b98c] hover:border-[#6b7c52] hover:bg-white/40 transition-all duration-[280ms] flex items-center justify-center gap-2"
            >
              <span className="text-[#6b7c52]">✨</span> Try Demo Account
            </button>
            <p className="text-center text-[0.7rem] text-[#4a5578]/70 mt-2">
              Sign in as {isDoctor ? 'Dr. Sarah Chen' : 'Alex Johnson'}
            </p>
          </div>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#d2c8b98c]" />
            <span className="text-[0.7rem] text-[#4a5578]/60 font-medium tracking-wide uppercase">or use</span>
            <div className="flex-1 h-px bg-[#d2c8b98c]" />
          </div>

          <div className="mb-8 w-full overflow-hidden flex justify-center">
            <GoogleLoginButton
              onSuccess={async (credential: string) => {
                setLoading(true);
                setError('');
                try {
                  const res = await fetch(`${API_URL}/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: credential }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.detail || 'Google login failed');
                  localStorage.setItem('consult_token', data.access_token);
                  localStorage.setItem('consult_role', role);
                  localStorage.setItem('consult_user', JSON.stringify(data.user));
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
                  setError(err.message || 'Google login failed.');
                } finally {
                  setLoading(false);
                }
              }}
              text="continue_with"
            />
          </div>

          <div className="text-center flex flex-col gap-3">
            <p className="text-[0.85rem] text-[#4a5578] font-light">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-[#6b7c52] hover:text-[#556540] transition-colors">
                Create one
              </Link>
            </p>
            <Link to="/consult" className="text-[0.85rem] font-semibold text-[#6b7c52] hover:text-[#556540] transition-colors inline-block mx-auto mb-6">
              ← Back to role selection
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 text-[#4a5578]/50 text-[0.6rem] font-bold uppercase tracking-widest mt-4">
            <Shield className="w-3 h-3" />
            <span>256-bit AES encryption · HIPAA compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
