import React from 'react';
import { Stethoscope } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const DoctorNavbar = () => {
  const stored = localStorage.getItem('neurovia_doctor_user');
  const user = stored ? JSON.parse(stored) : null;
  const fullName = user?.full_name || 'Specialist';
  const prefixName = fullName.startsWith('Dr.') ? fullName : `Dr. ${fullName}`;

  // Resolve avatar URL
  let avatarUrl = user?.avatar_url || '';
  if (avatarUrl && !avatarUrl.startsWith('http')) {
    avatarUrl = `${API_URL}${avatarUrl}`;
  }

  return (
    <header className="h-24 bg-white sticky top-0 z-10 flex items-center justify-between px-10 shadow-md rounded-b-3xl mb-8 border-b-2 border-(--color-border)">
      <div>
        <h2 className="text-2xl font-black text-(--color-navy) flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-(--color-sage)" /> 
          NeuroVia Specialist Portal
        </h2>
        <p className="text-sm font-bold text-(--color-navy)/50 tracking-wider uppercase mt-1">Clinical Management Interface</p>
      </div>
      <div className="flex items-center gap-4 cursor-pointer hover:bg-(--color-surface-alt) p-3 rounded-2xl transition-colors">
        <span className="text-xl font-bold text-(--color-navy)">{prefixName}</span>
        {avatarUrl ? (
          <img src={avatarUrl} alt={fullName} className="w-12 h-12 rounded-full object-cover border-2 border-(--color-sage)" />
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-(--color-sage) to-(--color-navy) rounded-full flex items-center justify-center border-2 border-white shadow-md">
            <span className="text-xl font-black text-white">{fullName.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default DoctorNavbar;
