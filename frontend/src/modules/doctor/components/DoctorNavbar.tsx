import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const DEFAULT_AVATAR = ''; // empty means we show the initial-letter fallback

function resolveAvatar(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('data:')) return url;
  return `${API_URL}${url}`;
}

const DoctorNavbar = () => {
  const stored = localStorage.getItem('neurovia_doctor_user');
  const user = stored ? JSON.parse(stored) : null;
  const fullName = user?.full_name || 'Specialist';
  const prefixName = fullName.startsWith('Dr.') ? fullName : `Dr. ${fullName}`;

  const [avatarSrc, setAvatarSrc] = useState(resolveAvatar(user?.avatar_url));
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Listen for local updates to instantly refresh avatar
  useEffect(() => {
    const handleProfileUpdate = () => {
      const freshStored = localStorage.getItem('neurovia_doctor_user');
      if (freshStored) {
        const freshUser = JSON.parse(freshStored);
        if (freshUser.avatar_url) {
          setAvatarSrc(resolveAvatar(freshUser.avatar_url));
          setAvatarFailed(false);
        }
      }
    };
    window.addEventListener('neurovia_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('neurovia_profile_updated', handleProfileUpdate);
  }, []);

  // Fetch fresh avatar from backend ONLY if localStorage is missing avatar_url
  useEffect(() => {
    if (user?.avatar_url) return; // already have it locally

    const token = localStorage.getItem('neurovia_doctor_token') || localStorage.getItem('consult_token');
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const profile = await res.json();
        if (profile.avatar_url) {
          // Update localStorage so we don't fetch again
          const updatedUser = { ...user, avatar_url: profile.avatar_url };
          localStorage.setItem('neurovia_doctor_user', JSON.stringify(updatedUser));
          setAvatarSrc(resolveAvatar(profile.avatar_url));
        }
      } catch (err) {
        // Silent fail — we still show the initial letter fallback
      }
    };
    fetchProfile();
  }, []);

  const showFallback = !avatarSrc || avatarFailed;

  return (
    <header className="h-24 bg-white sticky top-0 z-10 flex items-center justify-between px-10 shadow-md rounded-b-3xl mb-8 border-b-2 border-(--color-border)">
      <div>
        <h2 className="text-2xl font-black text-(--color-navy) flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-(--color-sage)" /> 
          NeuroVia Specialist Portal
        </h2>
        <p className="text-sm font-bold text-(--color-navy)/50 tracking-wider uppercase mt-1">Clinical Management Interface</p>
      </div>
      <Link to="/doctor/settings" className="flex items-center gap-4 cursor-pointer hover:bg-(--color-surface-alt) p-3 rounded-2xl transition-colors">
        <span className="text-xl font-bold text-(--color-navy)">{prefixName}</span>
        {!showFallback ? (
          <img
            src={avatarSrc}
            alt={fullName}
            className="w-12 h-12 rounded-full object-cover border-2 border-(--color-sage)"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-(--color-sage) to-(--color-navy) rounded-full flex items-center justify-center border-2 border-white shadow-md">
            <span className="text-xl font-black text-white">{fullName.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </Link>
    </header>
  );
};

export default DoctorNavbar;
