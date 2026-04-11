import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, Eye, EyeOff, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const storeAndRedirect = (data: any) => {
    const role = data.user.role?.toLowerCase() || 'patient';
    if (role === 'doctor') {
      localStorage.setItem('neurovia_doctor_token', data.access_token);
      localStorage.setItem('neurovia_doctor_user', JSON.stringify(data.user));
      navigate('/doctor/dashboard');
    } else {
      localStorage.setItem('neurovia_patient_token', data.access_token);
      localStorage.setItem('neurovia_patient_user', JSON.stringify(data.user));
      navigate('/patient/dashboard');
    }
  };

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
      storeAndRedirect(data);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
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
      storeAndRedirect(data);
    } catch (err: any) {
      setError(err.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Hero */}
      <div className="hidden lg:flex w-[48%] bg-gradient-to-br from-[#0D2B45] via-[#143350] to-[#0a1f33] text-white flex-col justify-between p-14 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8C9A86]/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#8C9A86]/8 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#8C9A86]/20 rounded-xl flex items-center justify-center border border-[#8C9A86]/30 group-hover:bg-[#8C9A86]/30 transition-colors">
              <Brain className="w-5 h-5 text-[#8C9A86]" />
            </div>
            <span className="text-xl font-bold tracking-wide">NeuroVia</span>
          </Link>
          <LanguageSwitcher variant="dark" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center -mt-10">
          <div className="inline-flex items-center gap-2 bg-[#8C9A86]/10 border border-[#8C9A86]/20 rounded-full px-4 py-1.5 w-fit mb-8">
            <Sparkles className="w-3.5 h-3.5 text-[#8C9A86]" />
            <span className="text-[#8C9A86] text-xs font-bold uppercase tracking-widest">AI-Powered Care</span>
          </div>
          <h1 className="text-5xl xl:text-6xl font-serif text-white mb-6 leading-[1.1]">
            {t('welcome_back')}<span className="text-[#8C9A86]">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-sm leading-relaxed mb-10">
            Continue your cognitive health journey with personalized insights and daily exercises.
          </p>

          <div className="flex flex-col gap-4">
            {[
              { label: 'Track daily cognitive exercises', icon: '🧠' },
              { label: 'Monitor wellness trends over time', icon: '📊' },
              { label: 'AI-powered health recommendations', icon: '✨' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-slate-300">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-slate-500 text-sm">
          © 2026 NeuroVia Health Technologies
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 bg-[#FAFAF7] flex flex-col justify-center items-center px-6">
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo + Language */}
          <div className="flex items-center justify-between mb-10 lg:hidden">
            <Link to="/" className="flex items-center gap-3">
              <Brain className="w-7 h-7 text-[#8C9A86]" />
              <span className="text-xl font-bold text-[#0D2B45]">NeuroVia</span>
            </Link>
            <LanguageSwitcher variant="light" />
          </div>

          <h2 className="text-3xl font-bold text-[#0D2B45] mb-2">{t('sign_in_title')}</h2>
          <p className="text-slate-500 mb-8">{t('sign_in_subtitle')}</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium mb-6 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#0D2B45] mb-2">{t('email_label')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E5E5E0] bg-white text-[#0D2B45] text-base outline-none focus:border-[#8C9A86] focus:ring-4 focus:ring-[#8C9A86]/10 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-[#0D2B45]">{t('password_label')}</label>
                <a href="#" className="text-xs text-[#8C9A86] hover:text-[#6D8274] font-semibold transition-colors">{t('forgot_password')}</a>
              </div>
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
              className="w-full py-4 bg-[#0D2B45] text-white font-bold text-base rounded-2xl hover:bg-[#1a3a55] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#0D2B45]/20 hover:shadow-xl hover:shadow-[#0D2B45]/30 active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('signing_in')}
                </span>
              ) : (
                <>
                  {t('sign_in')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#E5E5E0]" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('or')}</span>
            <div className="flex-1 h-px bg-[#E5E5E0]" />
          </div>

          {/* Google Login */}
          <GoogleLoginButton onSuccess={handleGoogleSuccess} />

          <div className="mt-8 text-center">
            <p className="text-slate-500">
              {t('no_account')}{' '}
              <Link to="/register" className="font-bold text-[#8C9A86] hover:text-[#6D8274] transition-colors">
                {t('create_one')}
              </Link>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <Shield className="w-3.5 h-3.5" />
            <span>{t('encryption_notice')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
