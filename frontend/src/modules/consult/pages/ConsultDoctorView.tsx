import React, { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Brain, LayoutDashboard, MessageSquare, Users, LogOut } from 'lucide-react';
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
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col">
      {/* Consult Doctor Header */}
      <header className="bg-[#0D2B45] text-white px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/consult/doctor/consultations')}>
            <Brain className="w-6 h-6 text-[#8C9A86]" />
            <span className="text-lg font-bold tracking-wide">NeuroPortal</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <nav className="flex items-center gap-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = currentPath.startsWith(link.path);
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[#8C9A86] text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/10'
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
            <div className="w-8 h-8 bg-[#8C9A86]/20 rounded-full flex items-center justify-center text-[#8C9A86] text-sm font-bold">
              {(consultUser.full_name || 'D')[0].toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-white/80">{consultUser.full_name || 'Doctor'}</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-400/70 hover:text-red-400 font-bold transition-colors">
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
