import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Navbar = () => {
  const { t } = useTranslation();
  const stored = localStorage.getItem('neurovia_patient_user');
  const user = stored ? JSON.parse(stored) : null;
  const fullName = user?.full_name || 'User';
  const firstName = fullName.split(' ')[0];
  const [imgError, setImgError] = useState(false);

  // Resolve avatar URL
  let avatarUrl = user?.avatar_url || '';
  if (avatarUrl && !avatarUrl.startsWith('http')) {
    avatarUrl = `${API_URL}${avatarUrl}`;
  }

  const showFallback = !avatarUrl || imgError;

  return (
    <header className="h-[4.5rem] bg-transparent relative flex items-center justify-between px-6 shadow-sm rounded-b-[24px] mb-6 border-b border-[#d2c8b9]/60">
      <div>
        <h2 className="text-[1.2rem] font-bold text-[--color-navy] tracking-wide">{t('welcome_back')}, {firstName}</h2>
        <p className="text-[0.8rem] mt-0.5 text-[--color-navy]/60">{t('daily_overview')}</p>
      </div>
      <div className="flex items-center gap-3 cursor-pointer hover:bg-white/30 backdrop-blur-sm p-2 rounded-[16px] transition-colors">
        <span className="text-[0.95rem] font-bold text-[--color-navy]">{fullName}</span>
        {!showFallback ? (
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-10 h-10 rounded-full object-cover border border-[--color-sage]/50"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-10 h-10 bg-[--color-sage]/15 rounded-full flex items-center justify-center border border-[--color-sage]/50">
            <span className="text-[1.1rem] font-bold text-[--color-sage]">{fullName.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
