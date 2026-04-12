import React, { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Activity, LayoutDashboard, MessageSquare, Users, LogOut } from 'lucide-react';
import { getConsultDoctorAuth } from '../../../utils/sessionBridge';

/**
 * Standalone Doctor view within the consultation module.
 * Uses session bridging to accept both consult_token and main app auth.
 */
export default function ConsultDoctorView() {
  const navigate = useNavigate();

  // Session bridging: check consult auth OR main doctor auth
  const auth = getConsultDoctorAuth();
  const consultUser = auth?.user || {};

  useEffect(() => {
    if (!auth) {
      navigate('/consult/login/doctor', { replace: true });
    }
  }, [auth]);

  const handleLogout = () => {
    localStorage.removeItem('consult_token');
    localStorage.removeItem('consult_role');
    localStorage.removeItem('consult_user');
    navigate('/consult');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/consult/doctor/dashboard', icon: LayoutDashboard },
    { name: 'Consultations', path: '/consult/doctor/consultations', icon: MessageSquare },
    { name: 'Patients', path: '/consult/doctor/patients', icon: Users },
  ];

  const currentPath = window.location.pathname;

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col font-sans" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Consult Doctor Header */}
      <header className="bg-[#f5f0e8] text-[#1a2744] px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm border-b border-[#E5E5E0]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/consult/doctor/consultations')}>
            <div className="w-8 h-8 bg-[#6b7c52] rounded-[8px] flex items-center justify-center transition-transform group-hover:rotate-3 shadow-md">
                <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-[#1a2744] uppercase" style={{ fontFamily: "'DM Sans', sans-serif" }}>NeuroPortal</span>
          </div>
          <div className="h-6 w-px bg-[#1a2744]/10" />
          <nav className="flex items-center gap-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = currentPath.startsWith(link.path);
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[0.95rem] font-bold transition-all shadow-sm ${
                    isActive
                      ? 'bg-[#6b7c52] text-white shadow-md'
                      : 'bg-[#ede7d9] text-[#1a2744]/60 hover:text-[#1a2744] hover:bg-[#e2dcd0] border border-[#d2c8b98c]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#ede7d9] rounded-2xl flex items-center justify-center text-[#1a2744] text-[1.1rem] font-bold shadow-sm border border-[#d2c8b98c]">
              {(consultUser.full_name || 'D')[0].toUpperCase()}
            </div>
            <span className="text-[0.9rem] font-bold text-[#1a2744]">{consultUser.full_name || 'Doctor'}</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 hover:text-red-700 font-bold transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Doctor Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-8 py-8">
        <Outlet />
      </div>
    </div>
  );
}
