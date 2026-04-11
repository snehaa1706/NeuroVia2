import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, Eye, EyeOff, Shield, ArrowRight, Sparkles, User, Mail, Phone, Calendar, Stethoscope, MapPin, FileText, Image, Upload, Camera, Clock, Users } from 'lucide-react';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Common fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('user');

  // Doctor-specific fields
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [experience, setExperience] = useState('');
  const [gender, setGender] = useState('');

  const totalSteps = role === 'doctor' ? 3 : 2;

  const validateStep1 = () => {
    if (!fullName.trim()) { setError('Full name is required'); return false; }
    if (!email.trim()) { setError('Email is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email'); return false; }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!password) { setError('Password is required'); return false; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return false; }
    if (password !== confirmPassword) { setError("Passwords don't match"); return false; }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleStep2Next = () => {
    if (validateStep2()) {
      if (role === 'doctor') {
        setStep(3);
      } else {
        doSubmit();
      }
    }
  };

  const doSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const payload: any = {
        email,
        password,
        full_name: fullName,
        role,
      };
      if (phone.trim()) payload.phone = phone;
      if (dob) payload.date_of_birth = dob;

      // Doctor-specific fields
      if (role === 'doctor') {
        // Upload avatar image first if selected
        if (avatarFile) {
          setUploading(true);
          try {
            const formData = new FormData();
            formData.append('file', avatarFile);
            const uploadRes = await fetch(`${API_URL}/doctors/upload/avatar`, {
              method: 'POST',
              body: formData,
            });
            const uploadData = await uploadRes.json();
            if (uploadRes.ok && uploadData.url) {
              payload.avatar_url = uploadData.url;
            }
          } catch (uploadErr) {
            console.warn('Avatar upload failed, continuing without it:', uploadErr);
          } finally {
            setUploading(false);
          }
        }
        if (specialty.trim()) payload.specialty = specialty;
        if (bio.trim()) payload.bio = bio;
        if (location.trim()) payload.location = location;
        if (experience.trim()) payload.experience = experience;
        if (gender.trim()) payload.gender = gender;
      }

      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');

      setSuccess(true);
      const userRole = data.user.role?.toLowerCase() || 'patient';
      if (userRole === 'doctor') {
        localStorage.setItem('neurovia_doctor_token', data.access_token);
        localStorage.setItem('neurovia_doctor_user', JSON.stringify(data.user));
      } else {
        localStorage.setItem('neurovia_patient_token', data.access_token);
        localStorage.setItem('neurovia_patient_user', JSON.stringify(data.user));
      }

      const redirectPath = userRole === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard';
      setTimeout(() => navigate(redirectPath), 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 2 && role !== 'doctor') {
      if (!validateStep2()) return;
      doSubmit();
    } else if (step === 3) {
      // Step 3 is doctor profile — no required fields, just submit
      doSubmit();
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-3xl font-bold text-[#0D2B45] mb-3">Welcome to NeuroVia!</h1>
          <p className="text-slate-500 text-lg mb-2">Your account has been created successfully.</p>
          <p className="text-slate-400 text-sm">Redirecting to your dashboard...</p>
          <div className="mt-6 flex justify-center">
            <div className="w-8 h-8 border-3 border-[#8C9A86]/30 border-t-[#8C9A86] rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Hero */}
      <div className="hidden lg:flex w-[48%] bg-gradient-to-br from-[#0D2B45] via-[#143350] to-[#0a1f33] text-white flex-col justify-between p-14 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-[#8C9A86]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-[#8C9A86]/6 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#8C9A86]/3 rounded-full blur-[100px]" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#8C9A86]/20 rounded-xl flex items-center justify-center border border-[#8C9A86]/30 group-hover:bg-[#8C9A86]/30 transition-colors">
              <Brain className="w-5 h-5 text-[#8C9A86]" />
            </div>
            <span className="text-xl font-bold tracking-wide">NeuroVia</span>
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center -mt-10">
          <div className="inline-flex items-center gap-2 bg-[#8C9A86]/10 border border-[#8C9A86]/20 rounded-full px-4 py-1.5 w-fit mb-8">
            <Sparkles className="w-3.5 h-3.5 text-[#8C9A86]" />
            <span className="text-[#8C9A86] text-xs font-bold uppercase tracking-widest">Join Thousands</span>
          </div>
          <h1 className="text-5xl xl:text-6xl font-serif text-white mb-6 leading-[1.1]">
            {step === 3 ? (
              <>Build Your<br />Profile<span className="text-[#8C9A86]">.</span></>
            ) : (
              <>Start Your<br />Journey<span className="text-[#8C9A86]">.</span></>
            )}
          </h1>
          <p className="text-lg text-slate-400 max-w-sm leading-relaxed mb-10">
            {step === 3
              ? 'Tell patients about your expertise, where they can find you, and upload a professional photo.'
              : 'Create a free account to access cognitive screening, daily exercises, and personalized health insights.'}
          </p>

          {/* Step indicators */}
          <div className="flex items-center gap-3">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${step === s ? 'bg-[#8C9A86] text-white' : step > s ? 'bg-[#8C9A86]/30 text-[#8C9A86]' : 'bg-[#8C9A86]/10 text-[#8C9A86]'}`}>
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">{s}</span>
                  {s === 1 ? 'Your Info' : s === 2 ? 'Security' : 'Profile'}
                </div>
                {s < totalSteps && <div className="w-8 h-0.5 bg-slate-600" />}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-slate-500 text-sm">
          © 2026 NeuroVia Health Technologies
        </div>
      </div>

      {/* Right Panel — Register Form */}
      <div className="flex-1 bg-[#FAFAF7] flex flex-col justify-center items-center px-6">
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <Link to="/" className="flex items-center gap-3 mb-8 lg:hidden">
            <Brain className="w-7 h-7 text-[#8C9A86]" />
            <span className="text-xl font-bold text-[#0D2B45]">NeuroVia</span>
          </Link>

          <h2 className="text-3xl font-bold text-[#0D2B45] mb-2">
            {step === 3 ? 'Your Doctor Profile' : 'Create an account'}
          </h2>
          <p className="text-slate-500 mb-6">
            {step === 1 ? 'Start with your basic information' : step === 2 ? 'Set up your password to secure your account' : 'Tell your patients about yourself'}
          </p>

          {/* Mobile step indicator */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= i + 1 ? 'bg-[#8C9A86]' : 'bg-[#E5E5E0]'}`} />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium mb-5 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#0D2B45] mb-2">Full name *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe"
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-[#E5E5E0] bg-white text-[#0D2B45] text-base outline-none focus:border-[#8C9A86] focus:ring-4 focus:ring-[#8C9A86]/10 transition-all placeholder:text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0D2B45] mb-2">Email address *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-[#E5E5E0] bg-white text-[#0D2B45] text-base outline-none focus:border-[#8C9A86] focus:ring-4 focus:ring-[#8C9A86]/10 transition-all placeholder:text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0D2B45] mb-2">Phone number <span className="text-slate-400 font-normal">(optional)</span></label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000"
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-[#E5E5E0] bg-white text-[#0D2B45] text-base outline-none focus:border-[#8C9A86] focus:ring-4 focus:ring-[#8C9A86]/10 transition-all placeholder:text-slate-400" />
                  </div>
                </div>

                {/* Role selector */}
                <div className="pt-2">
                  <label className="block text-sm font-semibold text-[#0D2B45] mb-3">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setRole('user')}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${role === 'user' ? 'border-[#8C9A86] bg-[#8C9A86]/5 ring-4 ring-[#8C9A86]/10' : 'border-[#E5E5E0] bg-white hover:border-[#8C9A86]/30'}`}>
                      <User className={`w-6 h-6 ${role === 'user' ? 'text-[#8C9A86]' : 'text-slate-400'}`} />
                      <span className={`text-xs font-bold ${role === 'user' ? 'text-[#0D2B45]' : 'text-slate-500'}`}>Patient</span>
                    </button>
                    <button type="button" onClick={() => setRole('doctor')}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${role === 'doctor' ? 'border-[#8C9A86] bg-[#8C9A86]/5 ring-4 ring-[#8C9A86]/10' : 'border-[#E5E5E0] bg-white hover:border-[#8C9A86]/30'}`}>
                      <Stethoscope className={`w-6 h-6 ${role === 'doctor' ? 'text-[#8C9A86]' : 'text-slate-400'}`} />
                      <span className={`text-xs font-bold ${role === 'doctor' ? 'text-[#0D2B45]' : 'text-slate-500'}`}>Doctor</span>
                    </button>
                  </div>
                </div>

                <button type="button" onClick={handleNext}
                  className="w-full py-4 bg-[#0D2B45] text-white font-bold text-base rounded-2xl hover:bg-[#1a3a55] transition-all shadow-lg shadow-[#0D2B45]/20 hover:shadow-xl hover:shadow-[#0D2B45]/30 active:scale-[0.98] flex items-center justify-center gap-2 group mt-2">
                  Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {/* STEP 2: Password */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Summary card */}
                <div className="bg-white border-2 border-[#E5E5E0] rounded-2xl p-4 flex items-center gap-4 mb-2">
                  <div className="w-11 h-11 bg-[#8C9A86]/10 rounded-xl flex items-center justify-center shrink-0">
                    {role === 'doctor' ? <Stethoscope className="w-5 h-5 text-[#8C9A86]" /> : <User className="w-5 h-5 text-[#8C9A86]" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#0D2B45] text-sm truncate">{fullName}</p>
                    <p className="text-slate-400 text-xs truncate">{email} · {role === 'doctor' ? 'Doctor' : 'Patient'}</p>
                  </div>
                  <button type="button" onClick={() => setStep(1)} className="ml-auto text-xs text-[#8C9A86] font-semibold hover:text-[#6D8274] transition-colors shrink-0">Edit</button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0D2B45] mb-2">Password *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters"
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E5E5E0] bg-white text-[#0D2B45] text-base outline-none focus:border-[#8C9A86] focus:ring-4 focus:ring-[#8C9A86]/10 transition-all pr-12 placeholder:text-slate-400" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0D2B45] transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 flex gap-1">
                        <div className={`h-1 flex-1 rounded-full ${password.length >= 6 ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <div className={`h-1 flex-1 rounded-full ${password.length >= 8 ? 'bg-emerald-400' : 'bg-[#E5E5E0]'}`} />
                        <div className={`h-1 flex-1 rounded-full ${password.length >= 10 && /[^a-zA-Z0-9]/.test(password) ? 'bg-emerald-400' : 'bg-[#E5E5E0]'}`} />
                      </div>
                      <span className="text-xs text-slate-400">
                        {password.length < 6 ? 'Too short' : password.length < 8 ? 'Fair' : password.length >= 10 && /[^a-zA-Z0-9]/.test(password) ? 'Strong' : 'Good'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0D2B45] mb-2">Confirm password *</label>
                  <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password"
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E5E5E0] bg-white text-[#0D2B45] text-base outline-none focus:border-[#8C9A86] focus:ring-4 focus:ring-[#8C9A86]/10 transition-all placeholder:text-slate-400" />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">Passwords don't match</p>
                  )}
                </div>

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => { setStep(1); setError(''); }}
                    className="flex-1 py-4 bg-white text-[#0D2B45] font-bold text-base rounded-2xl border-2 border-[#E5E5E0] hover:border-[#8C9A86] transition-all active:scale-[0.98]">
                    Back
                  </button>
                  <button type="button" onClick={handleStep2Next} disabled={loading}
                    className="flex-[2] py-4 bg-[#0D2B45] text-white font-bold text-base rounded-2xl hover:bg-[#1a3a55] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#0D2B45]/20 hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 group">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…
                      </span>
                    ) : (
                      <>{role === 'doctor' ? 'Next: Your Profile' : 'Create Account'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Doctor Profile (only for doctors) */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Profile Photo Upload */}
                <div>
                  <label className="block text-sm font-semibold text-[#0D2B45] mb-2">
                    Profile Photo <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="w-24 h-24 rounded-2xl object-cover border-2 border-[#8C9A86]/30 shadow-lg" />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-[#8C9A86]/10 border-2 border-dashed border-[#8C9A86]/30 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-[#8C9A86]/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAvatarFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => setAvatarPreview(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-dashed border-[#8C9A86]/30 bg-[#FAFAF7] text-sm font-semibold text-[#8C9A86] hover:border-[#8C9A86] hover:bg-[#8C9A86]/5 transition-all flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4" />
                        {avatarFile ? 'Change Photo' : 'Upload Photo'}
                      </button>
                      {avatarFile && (
                        <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          ✓ {avatarFile.name}
                        </p>
                      )}
                      <p className="text-xs text-slate-400">JPG, PNG, WebP or GIF — max 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Specialty */}
                <div>
                  <label className="block text-sm font-semibold text-[#0D2B45] mb-2">Specialty *</label>
                  <div className="relative">
                    <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Cognitive Neuroscientist, Neurologist"
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-[#E5E5E0] bg-white text-[#0D2B45] text-base outline-none focus:border-[#8C9A86] focus:ring-4 focus:ring-[#8C9A86]/10 transition-all placeholder:text-slate-400" />
                  </div>
                </div>

                {/* Clinic / Location */}
                <div>
                  <label className="block text-sm font-semibold text-[#0D2B45] mb-2">Clinic / Hospital</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. City General Hospital, Room 204"
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-[#E5E5E0] bg-white text-[#0D2B45] text-base outline-none focus:border-[#8C9A86] focus:ring-4 focus:ring-[#8C9A86]/10 transition-all placeholder:text-slate-400" />
                  </div>
                </div>

                {/* Experience & Gender row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#0D2B45] mb-2">Experience</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input type="text" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 10 Years"
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-[#E5E5E0] bg-white text-[#0D2B45] text-base outline-none focus:border-[#8C9A86] focus:ring-4 focus:ring-[#8C9A86]/10 transition-all placeholder:text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#0D2B45] mb-2">Gender</label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <select value={gender} onChange={(e) => setGender(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-[#E5E5E0] bg-white text-[#0D2B45] text-base outline-none focus:border-[#8C9A86] focus:ring-4 focus:ring-[#8C9A86]/10 transition-all appearance-none">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bio / Description */}
                <div>
                  <label className="block text-sm font-semibold text-[#0D2B45] mb-2">About You</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                    placeholder="Tell patients about your experience, specialization, and approach to care..."
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E5E5E0] bg-white text-[#0D2B45] text-base outline-none focus:border-[#8C9A86] focus:ring-4 focus:ring-[#8C9A86]/10 transition-all resize-none placeholder:text-slate-400" />
                </div>

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => { setStep(2); setError(''); }}
                    className="flex-1 py-4 bg-white text-[#0D2B45] font-bold text-base rounded-2xl border-2 border-[#E5E5E0] hover:border-[#8C9A86] transition-all active:scale-[0.98]">
                    Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-[2] py-4 bg-[#8C9A86] text-white font-bold text-base rounded-2xl hover:bg-[#7a8c7a] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#8C9A86]/20 hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 group">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…
                      </span>
                    ) : (
                      <>Create Doctor Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </button>
                </div>

                <p className="text-center text-xs text-slate-400 mt-1">
                  You can update these details anytime from your dashboard settings.
                </p>
              </div>
            )}
          </form>

          {step === 1 && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-[#E5E5E0]" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('or')}</span>
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
                      body: JSON.stringify({ token: credential }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.detail || 'Google sign-up failed');
                    const userRole = data.user.role?.toLowerCase() || 'patient';
                    if (userRole === 'doctor') {
                      localStorage.setItem('neurovia_doctor_token', data.access_token);
                      localStorage.setItem('neurovia_doctor_user', JSON.stringify(data.user));
                      navigate('/doctor/dashboard');
                    } else {
                      localStorage.setItem('neurovia_patient_token', data.access_token);
                      localStorage.setItem('neurovia_patient_user', JSON.stringify(data.user));
                      navigate('/patient/dashboard');
                    }
                  } catch (err: any) {
                    setError(err.message || 'Google sign-up failed.');
                  } finally {
                    setLoading(false);
                  }
                }}
                text="signup_with"
              />
            </>
          )}

          <div className="mt-8 text-center">
            <p className="text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#8C9A86] hover:text-[#6D8274] transition-colors">
                Sign in
              </Link>
            </p>
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
