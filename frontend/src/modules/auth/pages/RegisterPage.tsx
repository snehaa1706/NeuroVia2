import { useState, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Brain, Eye, EyeOff, Shield, ArrowRight, Sparkles, User, Mail, Phone, Calendar, Stethoscope, MapPin, FileText, Image, Upload, Camera, Clock, Users, Activity, Heart } from 'lucide-react';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const initialState = (routerLocation.state as any) || {};

  const { t } = useTranslation();
  const [step, setStep] = useState(initialState.googleToken && initialState.role === 'doctor' ? 3 : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Common fields (preserved logic)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(initialState.role || 'user');
  const [googleToken, setGoogleToken] = useState(initialState.googleToken || '');

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

  const fontSans = { fontFamily: "'DM Sans', sans-serif" };
  const fontSerif = { fontFamily: "'Cormorant Garamond', serif" };

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
      const payload: any = googleToken
        ? { token: googleToken, role }
        : {
            email,
            password,
            full_name: fullName,
            role,
          };
      if (!googleToken && phone.trim()) payload.phone = phone;
      if (!googleToken && dob) payload.date_of_birth = dob;

      if (role === 'doctor') {
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
            console.warn('Avatar upload failed:', uploadErr);
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

      const endpoint = googleToken ? `${API_URL}/auth/google` : `${API_URL}/auth/register`;
      const res = await fetch(endpoint, {
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
      
      setSuccess(true);
      const userRole = data.user.role?.toLowerCase() || 'patient';
      if (userRole === 'doctor') {
        localStorage.setItem('neurovia_doctor_token', data.access_token);
        localStorage.setItem('neurovia_doctor_user', JSON.stringify(data.user));
        setTimeout(() => navigate('/doctor/dashboard'), 1500);
      } else {
        localStorage.setItem('neurovia_patient_token', data.access_token);
        localStorage.setItem('neurovia_patient_user', JSON.stringify(data.user));
        setTimeout(() => navigate('/patient/dashboard'), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Google registration failed.');
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
      doSubmit();
    }
  };

  if (success) {
    return (
      <div style={fontSans} className="min-h-screen bg-[#f5f0e8] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-[#6b7c52]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl text-[#6b7c52]">✓</span>
          </div>
          <h1 style={fontSerif} className="text-3xl font-bold text-[#1a2744] mb-3">Welcome to NeuroVia!</h1>
          <p className="text-[#4a5578] text-lg mb-2">Your account has been created successfully.</p>
          <p className="text-[#4a5578]/60 text-sm">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3.5 rounded-[12px] border border-[#d2c8b98c] bg-transparent text-[#1a2744] text-[0.9rem] outline-none focus:border-[#6b7c52] transition-colors placeholder:text-[#4a5578]/50 focus:bg-white/50";
  const labelClass = "block text-[0.68rem] font-bold text-[#2e3f6b] uppercase tracking-[0.08em] mb-2";

  return (
    <div style={fontSans} className="min-h-screen flex bg-[#f5f0e8] text-[#1a2744]">
      {/* Left Panel - Reusing exact layout from LoginPage and Image 1 & 2 */}
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
                    <button onClick={() => navigate('/login')} className="px-[1.1rem] py-[0.44rem] rounded-[8px] text-[0.83rem] font-medium border-[1.5px] border-[#f5f0e873] text-[#f5f0e8] bg-[#ffffff14] backdrop-blur-[10px] transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#ffffff38] hover:-translate-y-[1px]">Login</button>
                    <button className="px-[1.1rem] py-[0.44rem] rounded-[8px] text-[0.83rem] font-medium border-[1.5px] border-[#6b7c52] text-white bg-[#6b7c52] backdrop-blur-[10px] transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#556540] hover:border-[#556540] hover:-translate-y-[1px]">Sign Up</button>
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
                        <div key={idx} className="flex items-center gap-[0.4rem] px-[0.9rem] py-[0.42rem] rounded-[100px] bg-white/10 backdrop-blur-[10px] border border-white/20 text-white/90 text-[0.77rem] transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#ffffff38] hover:-translate-y-[1px]">
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
        <div className="w-full max-w-[420px] animate-[fadeUp_0.5s_cubic-bezier(0.22,1,0.36,1)] overflow-y-auto max-h-screen no-scrollbar pb-8 pt-8">
          
          <h2 style={fontSerif} className="text-[2.2rem] font-medium text-[#1a2744] mb-3 leading-tight">
            {step === 3 ? 'Your Profile' : 'Create your account'}
          </h2>
          <p className="text-[0.9rem] text-[#4a5578] font-light mb-8 leading-[1.6] max-w-[340px]">
            {step === 3 
              ? 'Tell your patients about yourself.'
              : 'Free to start. No credit card. Your health data stays private.'}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-[1.1rem]">
            {step === 1 && (
              <>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className={labelClass}>First & Last Name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" className={inputClass} />
                  </div>
                </div>
                
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Phone <span className="text-[#4a5578]/50 font-normal lowercase">(Optional)</span></label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setRole('user')}
                      className={`py-3 rounded-[12px] border transition-all text-[0.85rem] font-semibold ${role === 'user' ? 'border-[#6b7c52] bg-[#6b7c52]/10 text-[#6b7c52]' : 'border-[#d2c8b98c] bg-transparent text-[#4a5578] hover:border-[#6b7c52]/50'}`}>
                      Patient
                    </button>
                    <button type="button" onClick={() => setRole('doctor')}
                      className={`py-3 rounded-[12px] border transition-all text-[0.85rem] font-semibold ${role === 'doctor' ? 'border-[#6b7c52] bg-[#6b7c52]/10 text-[#6b7c52]' : 'border-[#d2c8b98c] bg-transparent text-[#4a5578] hover:border-[#6b7c52]/50'}`}>
                      Doctor
                    </button>
                  </div>
                </div>

                <button type="button" onClick={handleNext}
                  className="w-full mt-4 py-[0.85rem] bg-[#6b7c52] text-white font-medium text-[0.95rem] rounded-[10px] hover:bg-[#556540] transition-all duration-[280ms] flex items-center justify-center gap-2">
                  Continue to Password <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className={labelClass}>Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" className={inputClass} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4a5578]/60 hover:text-[#6b7c52]">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className={inputClass} />
                </div>

                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 py-[0.85rem] bg-transparent text-[#4a5578] font-medium text-[0.95rem] rounded-[10px] border border-[#d2c8b98c] hover:border-[#6b7c52] transition-colors">
                    Back
                  </button>
                  <button type="button" onClick={handleStep2Next} disabled={loading}
                    className="flex-[2] py-[0.85rem] bg-[#6b7c52] text-white font-medium text-[0.95rem] rounded-[10px] hover:bg-[#556540] transition-all duration-[280ms] flex items-center justify-center gap-2">
                    {loading ? "Creating..." : (role === 'doctor' ? "Next Step" : "Create My Free Account")}
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Doctor Details (kept minimal for styling logic match) */}
            {step === 3 && (
              <>
                <div><label className={labelClass}>Specialty</label><input type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Clinic / Hospital</label><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} className={inputClass} rows={3} /></div>

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

                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => { 
                      if (googleToken) { setGoogleToken(''); setStep(1); } else { setStep(2); }
                      setError(''); 
                    }}
                    className="flex-1 py-[0.85rem] bg-transparent text-[#4a5578] font-medium text-[0.95rem] rounded-[10px] border border-[#d2c8b98c] hover:border-[#6b7c52] transition-colors">
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="flex-[2] py-[0.85rem] bg-[#6b7c52] text-white font-medium text-[0.95rem] rounded-[10px] hover:bg-[#556540] transition-all flex items-center justify-center">
                    {loading ? "Creating..." : "Complete Profile"}
                  </button>
                </div>
              </>
            )}
          </form>

          {step === 1 && (
            <>
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-[#d2c8b98c]" />
                <span className="text-[0.7rem] text-[#4a5578]/60 font-medium tracking-wide">or sign up with</span>
                <div className="flex-1 h-px bg-[#d2c8b98c]" />
              </div>
              <div className="mb-10 w-full overflow-hidden flex justify-center">
                <GoogleLoginButton onSuccess={handleGoogleSuccess} text="signup_with" />
              </div>
              <GoogleLoginButton
                onSuccess={async (credential: string) => {
                  if (role === 'doctor') {
                    setGoogleToken(credential);
                    setStep(3);
                    return;
                  }

                  setLoading(true);
                  setError('');
                  try {
                    const res = await fetch(`${API_URL}/auth/google`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ token: credential, role: 'user' }),
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

          <div className="text-center flex flex-col gap-3 mt-6">
            <p className="text-[0.85rem] text-[#4a5578] font-light">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#6b7c52] hover:text-[#556540] transition-colors">
                Sign in
              </Link>
            </p>
            <Link to="/" className="text-[0.85rem] font-semibold text-[#6b7c52] hover:text-[#556540] transition-colors inline-block mx-auto mb-6">
              ← Back to home
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 text-[#4a5578]/50 text-[0.6rem] font-bold uppercase tracking-widest mt-auto pb-4">
            <Shield className="w-3 h-3" />
            <span>We will never share your data with third parties</span>
          </div>

        </div>
      </div>
    </div>
  );
}
