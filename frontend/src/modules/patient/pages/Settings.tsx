import React, { useState, useEffect, useRef } from 'react';
import { User, Bell, Palette, RotateCcw, Save, Check, Mail, Phone, Calendar, Shield, Camera, Upload, Stethoscope, MapPin, Clock, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import VoiceDictation from '@/components/ui/VoiceDictation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Settings = () => {
  const token = localStorage.getItem("token") || "";
  const { t } = useTranslation();
  const getUser = () => {
    // Determine context from URL path
    const isDoctorContext = window.location.pathname.includes('/doctor/settings');
    const stored = isDoctorContext 
      ? localStorage.getItem('neurovia_doctor_user') 
      : localStorage.getItem('neurovia_patient_user');
    return stored ? JSON.parse(stored) : { full_name: '', email: '', phone: '', date_of_birth: '', role: isDoctorContext ? 'doctor' : 'patient' };
  };

  const getSettings = () => {
    const stored = localStorage.getItem('neurovia_settings');
    return stored ? JSON.parse(stored) : { fontSize: 'large', notifications: true, medReminders: true, activityReminders: true, highContrast: false };
  };

  const [user, setUser] = useState(getUser);
  const isDoctor = user?.role?.toLowerCase() === 'doctor';

  const [name, setName] = useState(user.full_name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [dob, setDob] = useState(user.date_of_birth || '');

  // Doctor-specific
  const [specialty, setSpecialty] = useState(user.specialty || '');
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [experience, setExperience] = useState(user.experience || '');
  const [gender, setGender] = useState(user.gender || '');

  // Photo
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState(getSettings);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);



  // Resolve avatar for display
  let displayAvatar = avatarPreview || avatarUrl;
  if (displayAvatar && !displayAvatar.startsWith('http') && !displayAvatar.startsWith('data:')) {
    displayAvatar = `${API_URL}${displayAvatar}`;
  }

  useEffect(() => {
    localStorage.setItem('neurovia_settings', JSON.stringify(settings));
    const root = document.documentElement;
    if (settings.fontSize === 'normal') root.style.fontSize = '14px';
    else if (settings.fontSize === 'large') root.style.fontSize = '16px';
    else root.style.fontSize = '18px';
  }, [settings]);

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileSaved(false);

    let newAvatarUrl = avatarUrl;

    // Upload avatar if a new file was selected
    if (avatarFile) {
      try {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const uploadRes = await fetch(`${API_URL}/doctors/upload/avatar`, {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.url) {
          newAvatarUrl = uploadData.url;
        }
      } catch (err) {
        console.warn('Avatar upload failed:', err);
      }
    }

    const updatedUser = {
      ...user,
      full_name: name,
      email,
      phone,
      date_of_birth: dob,
      avatar_url: newAvatarUrl,
      ...(isDoctor ? { specialty, bio, location, experience, gender } : {}),
    };
    // Persist to role-specific key AND generic key
    if (isDoctor) {
      localStorage.setItem('neurovia_doctor_user', JSON.stringify(updatedUser));
    } else {
      localStorage.setItem('neurovia_patient_user', JSON.stringify(updatedUser));
    }
    setUser(updatedUser);
    setAvatarUrl(newAvatarUrl);

    // Try to update on backend
    const token = (isDoctor ? localStorage.getItem('neurovia_doctor_token') : localStorage.getItem('neurovia_patient_token'));
    if (token && !token.startsWith('demo_token')) {
      try {
        const payload: any = {};
        if (name !== user.full_name) payload.full_name = name;
        if (phone !== user.phone) payload.phone = phone || null;
        if (dob !== user.date_of_birth) payload.date_of_birth = dob || null;
        if (newAvatarUrl !== user.avatar_url) payload.avatar_url = newAvatarUrl;

        if (isDoctor) {
          if (specialty !== user.specialty) payload.specialty = specialty;
          if (bio !== user.bio) payload.bio = bio;
          if (location !== user.location) payload.location = location;
          if (experience !== user.experience) payload.experience = experience;
          if (gender !== user.gender) payload.gender = gender;
        }

        if (Object.keys(payload).length > 0) {
          await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
          });
        }
      } catch (err: any) {
        console.warn('Failed to sync profile to backend:', err);
        alert('Error syncing profile to server: ' + err.message);
      }
    }

    setProfileSaving(false);
    setProfileSaved(true);
    setAvatarFile(null);
    window.dispatchEvent(new Event('neurovia_profile_updated'));
    alert('Profile saved successfully! Changes are now active.');
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleClearData = () => {
    if (confirm('This will reset all your activity progress, medications, and daily logs. Are you sure?')) {
      localStorage.removeItem('activity_progress_f2');
      localStorage.removeItem('neurovia_f2_meds');
      localStorage.removeItem('neurovia_f2_daily_logs');
      localStorage.removeItem('neurovia_f2_family');
      localStorage.removeItem('neurovia_f2_phones');
      localStorage.removeItem('neurovia_settings');
      alert('All data has been cleared.');
      window.location.reload();
    }
  };

  const handleLogoutAllDevices = () => {
    if (confirm('This will sign you out everywhere. Continue?')) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-bold text-(--color-navy)">{t('settings')}</h2>
      </div>

      {/* ═══ Profile Photo & Basic Info ═══ */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-(--color-border-light)">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-(--color-sage)/10 rounded-xl flex items-center justify-center"><User className="w-5 h-5 text-(--color-sage)" /></div>
          <h3 className="text-xl font-bold text-(--color-navy)">{t('profile')}</h3>
          {profileSaved && (
            <span className="ml-auto flex items-center gap-1.5 text-emerald-600 text-sm font-semibold bg-emerald-50 px-3 py-1 rounded-full">
              <Check className="w-4 h-4" /> Saved
            </span>
          )}
        </div>

        {/* Photo Upload */}
        <div className="flex items-center gap-6 mb-6 p-4 bg-(--color-surface-alt) rounded-2xl">
          <div className="shrink-0">
            {displayAvatar ? (
              <img src={displayAvatar} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border-2 border-(--color-sage)/30 shadow-lg" onError={() => { setAvatarUrl(''); setAvatarPreview(''); }} />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-(--color-sage)/15 flex items-center justify-center border-2 border-dashed border-(--color-sage)/30">
                <Camera className="w-8 h-8 text-(--color-sage)/40" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAvatarFile(file);
                  const reader = new FileReader();
                  reader.onloadend = () => setAvatarPreview(reader.result as string);
                  reader.readAsDataURL(file);

                  // AUTO-SAVE: instantly persist image
                  setProfileSaving(true);
                  try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const uploadRes = await fetch(`${API_URL}/doctors/upload/avatar`, {
                      method: 'POST',
                      body: formData,
                    });
                    const uploadData = await uploadRes.json();
                    
                    const updatedUser = { ...user, avatar_url: uploadData.url };
                    if (isDoctor) {
                      localStorage.setItem('neurovia_doctor_user', JSON.stringify(updatedUser));
                    } else {
                      localStorage.setItem('neurovia_patient_user', JSON.stringify(updatedUser));
                    }

                    const token = localStorage.getItem("token") || "";
                    await fetch(`${API_URL}/auth/profile`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ avatar_url: uploadData.url }),
                    });
                    
                    window.dispatchEvent(new Event('neurovia_profile_updated'));
                  } catch (err) {
                    console.error("Auto upload failed", err);
                  } finally {
                    setProfileSaving(false);
                  }
                }
              }} />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl border-2 border-dashed border-(--color-sage)/30 bg-white text-sm font-semibold text-(--color-sage) hover:border-(--color-sage) hover:bg-(--color-sage)/5 transition-all flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {avatarFile ? 'Change Photo' : displayAvatar ? 'Update Photo' : 'Upload Photo'}
            </button>
            {avatarFile && <p className="text-xs text-emerald-600 font-semibold">✓ {avatarFile.name}</p>}
            <p className="text-xs text-(--color-navy)/40">JPG, PNG, WebP or GIF</p>
          </div>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-(--color-navy)/50 uppercase tracking-wider block mb-1.5">{t('full_name')}</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-navy)/30" />
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-(--color-border-light) rounded-xl bg-(--color-surface-alt) outline-none focus:border-(--color-sage) text-(--color-navy) font-medium transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-(--color-navy)/50 uppercase tracking-wider block mb-1.5">{t('email')}</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-navy)/30" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
                className="w-full pl-10 pr-4 py-3 border-2 border-(--color-border-light) rounded-xl bg-(--color-surface-alt) outline-none focus:border-(--color-sage) text-(--color-navy) font-medium transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-(--color-navy)/50 uppercase tracking-wider block mb-1.5">{t('phone')}</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-navy)/30" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="(optional)"
                className="w-full pl-10 pr-4 py-3 border-2 border-(--color-border-light) rounded-xl bg-(--color-surface-alt) outline-none focus:border-(--color-sage) text-(--color-navy) font-medium transition-colors placeholder:text-(--color-navy)/25" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-(--color-navy)/50 uppercase tracking-wider block mb-1.5">{t('date_of_birth')}</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-navy)/30" />
              <input value={dob} onChange={(e) => setDob(e.target.value)} type="date"
                className="w-full pl-10 pr-4 py-3 border-2 border-(--color-border-light) rounded-xl bg-(--color-surface-alt) outline-none focus:border-(--color-sage) text-(--color-navy) font-medium transition-colors" />
            </div>
          </div>
        </div>

        {/* Doctor-specific fields */}
        {isDoctor && (
          <div className="mt-6 pt-6 border-t border-(--color-border-light)">
            <h4 className="text-sm font-black text-(--color-navy)/60 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Stethoscope className="w-4 h-4" /> Doctor Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-(--color-navy)/50 uppercase tracking-wider block mb-1.5">Specialty</label>
                <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Neurologist"
                  className="w-full px-4 py-3 border-2 border-(--color-border-light) rounded-xl bg-(--color-surface-alt) outline-none focus:border-(--color-sage) text-(--color-navy) font-medium transition-colors placeholder:text-(--color-navy)/25" />
              </div>
              <div>
                <label className="text-xs font-bold text-(--color-navy)/50 uppercase tracking-wider block mb-1.5">Clinic / Hospital</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. City General Hospital"
                  className="w-full px-4 py-3 border-2 border-(--color-border-light) rounded-xl bg-(--color-surface-alt) outline-none focus:border-(--color-sage) text-(--color-navy) font-medium transition-colors placeholder:text-(--color-navy)/25" />
              </div>
              <div>
                <label className="text-xs font-bold text-(--color-navy)/50 uppercase tracking-wider block mb-1.5">Experience</label>
                <input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 10 Years"
                  className="w-full px-4 py-3 border-2 border-(--color-border-light) rounded-xl bg-(--color-surface-alt) outline-none focus:border-(--color-sage) text-(--color-navy) font-medium transition-colors placeholder:text-(--color-navy)/25" />
              </div>
              <div>
                <label className="text-xs font-bold text-(--color-navy)/50 uppercase tracking-wider block mb-1.5">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-(--color-border-light) rounded-xl bg-(--color-surface-alt) outline-none focus:border-(--color-sage) text-(--color-navy) font-medium transition-colors appearance-none">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-xs font-bold text-(--color-navy)/50 uppercase tracking-wider">About You</label>
                <VoiceDictation onTranscript={(text) => setBio((prev: string) => prev ? prev + ' ' + text : text)} />
              </div>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell patients about your experience..."
                className="w-full px-4 py-3 border-2 border-(--color-border-light) rounded-xl bg-(--color-surface-alt) outline-none focus:border-(--color-sage) text-(--color-navy) font-medium transition-colors resize-none placeholder:text-(--color-navy)/25" />
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button onClick={handleSaveProfile} disabled={profileSaving}
            className="flex items-center gap-2 px-6 py-3 bg-(--color-navy) text-white font-bold rounded-xl hover:bg-(--color-navy-light) transition-all active:scale-[0.97] disabled:opacity-60 shadow-lg shadow-(--color-navy)/20">
            {profileSaving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {profileSaving ? t('saving') : t('save_profile')}
          </button>
          <span className="text-xs text-(--color-navy)/40">Changes update your dashboard instantly</span>
        </div>
      </div>

      {/* ═══ Accessibility ═══ */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-(--color-border-light)">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><Palette className="w-5 h-5 text-purple-600" /></div>
          <h3 className="text-xl font-bold text-(--color-navy)">{t('accessibility')}</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-(--color-surface-alt) rounded-xl">
            <div>
              <span className="font-medium text-(--color-navy) block">{t('font_size')}</span>
              <span className="text-xs text-(--color-navy)/40">Applies across the entire app</span>
            </div>
            <div className="flex gap-2">
              {(['normal', 'large', 'extra-large'] as const).map(s => (
                <button key={s} onClick={() => updateSetting('fontSize', s)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${settings.fontSize === s ? 'bg-(--color-sage) text-white shadow-md' : 'bg-white text-(--color-navy)/60 border border-(--color-border-light) hover:border-(--color-sage)'}`}>
                  {s === 'normal' ? 'A' : s === 'large' ? 'A+' : 'A++'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-(--color-surface-alt) rounded-xl">
            <div>
              <span className="font-medium text-(--color-navy) block">High Contrast Mode</span>
              <span className="text-xs text-(--color-navy)/40">Increases visual distinction</span>
            </div>
            <button onClick={() => updateSetting('highContrast', !settings.highContrast)}
              className={`w-14 h-7 rounded-full transition-colors relative ${settings.highContrast ? 'bg-(--color-sage)' : 'bg-(--color-border-light)'}`}>
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform absolute top-0.5 ${settings.highContrast ? 'left-7' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Notifications ═══ */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-(--color-border-light)">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><Bell className="w-5 h-5 text-amber-600" /></div>
          <h3 className="text-xl font-bold text-(--color-navy)">{t('notifications')}</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-(--color-surface-alt) rounded-xl">
            <div>
              <span className="font-medium text-(--color-navy) block">{t('med_reminders')}</span>
              <span className="text-xs text-(--color-navy)/40">Get alerts for your scheduled medications</span>
            </div>
            <button onClick={() => updateSetting('medReminders', !settings.medReminders)}
              className={`w-14 h-7 rounded-full transition-colors relative ${settings.medReminders ? 'bg-(--color-sage)' : 'bg-(--color-border-light)'}`}>
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform absolute top-0.5 ${settings.medReminders ? 'left-7' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-(--color-surface-alt) rounded-xl">
            <div>
              <span className="font-medium text-(--color-navy) block">{t('activity_reminders')}</span>
              <span className="text-xs text-(--color-navy)/40">Daily reminders to complete cognitive exercises</span>
            </div>
            <button onClick={() => updateSetting('activityReminders', !settings.activityReminders)}
              className={`w-14 h-7 rounded-full transition-colors relative ${settings.activityReminders ? 'bg-(--color-sage)' : 'bg-(--color-border-light)'}`}>
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform absolute top-0.5 ${settings.activityReminders ? 'left-7' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Security ═══ */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-(--color-border-light)">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Shield className="w-5 h-5 text-blue-600" /></div>
          <h3 className="text-xl font-bold text-(--color-navy)">{t('security')}</h3>
        </div>
        <div className="space-y-3">
          <button onClick={handleLogoutAllDevices}
            className="w-full flex items-center justify-between p-4 bg-(--color-surface-alt) rounded-xl hover:bg-blue-50 transition-colors group text-left">
            <div>
              <span className="font-medium text-(--color-navy) block group-hover:text-blue-700">Sign Out Everywhere</span>
              <span className="text-xs text-(--color-navy)/40">Clears all sessions and local data</span>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full group-hover:bg-blue-100">Sign Out</span>
          </button>
        </div>
      </div>

      {/* ═══ Data Management ═══ */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-red-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><RotateCcw className="w-5 h-5 text-red-500" /></div>
          <h3 className="text-xl font-bold text-(--color-navy)">{t('data_management')}</h3>
        </div>
        <p className="text-(--color-navy)/60 mb-4 text-sm">Clear all locally stored data including activity progress, medications, and daily logs. Your account will not be affected.</p>
        <button onClick={handleClearData}
          className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl border border-red-200 hover:bg-red-100 transition-colors active:scale-[0.97]">
          Reset All Data
        </button>
      </div>
    </div>
  );
};

export default Settings;
