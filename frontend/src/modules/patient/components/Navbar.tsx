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
    <header className="h-24 bg-white sticky top-0 z-10 flex items-center justify-between px-10 shadow-md rounded-b-3xl mb-8 border-b-2 border-(--color-border)">
      <div>
        <h2 className="text-2xl font-bold text-(--color-navy)">{t('welcome_back')}, {firstName}</h2>
        <p className="text-lg text-(--color-navy)/60">{t('daily_overview')}</p>
      </div>
      <div className="flex items-center gap-4 cursor-pointer hover:bg-(--color-surface-alt) p-3 rounded-2xl transition-colors">
        <span className="text-xl font-semibold text-(--color-navy)">{fullName}</span>
        {!showFallback ? (
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-12 h-12 rounded-full object-cover border-2 border-(--color-sage)/30"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-12 h-12 bg-(--color-sage)/15 rounded-full flex items-center justify-center border-2 border-(--color-sage)/30">
            <span className="text-xl font-bold text-(--color-sage)">{fullName.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
