import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Settings, LogOut, Activity, Calendar } from 'lucide-react';

const DoctorSidebar = () => {
  const navigate = useNavigate();
  const links = [
    { name: 'Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
    { name: 'Patients', path: '/doctor/patients', icon: Users },
    { name: 'Consultations', path: '/doctor/consultations', icon: MessageSquare },
    { name: 'Schedule', path: '/doctor/schedule', icon: Calendar },
  ];

  return (
    <aside className="w-72 bg-(--color-navy) h-screen shadow-2xl flex flex-col pt-6 shrink-0 z-50">
      <div className="px-8 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-(--color-sage) rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">NeuroPortal</h1>
        </div>
        <p className="text-white/30 text-[10px] font-black uppercase tracking-[3px] mt-2 px-1">Healthcare Specialist</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-6 py-4 rounded-2xl text-lg font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-(--color-sage) text-white shadow-lg shadow-[#84A59D]/30'
                    : 'text-white/60 hover:bg-white/10 hover:text-white hover:translate-x-1'
                }`
              }
            >
              <Icon className="w-6 h-6" />
              {link.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom: Settings & Logout */}
      <div className="px-4 pb-6 space-y-1 border-t border-white/5 pt-6">
        <NavLink
          to="/doctor/settings"
          className={({ isActive }) =>
            `flex items-center gap-4 px-6 py-3 rounded-2xl text-lg font-semibold transition-all duration-300 ${
              isActive
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:bg-white/10 hover:text-white/80'
            }`
          }
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
        <button
          onClick={() => {
            localStorage.removeItem('neurovia_doctor_token');
            localStorage.removeItem('consult_token');
            localStorage.removeItem('consult_role');
            localStorage.removeItem('consult_user');
            navigate('/login');
          }}
          className="flex items-center gap-4 px-6 py-3 rounded-2xl text-lg font-semibold text-red-400/50 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 w-full"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default DoctorSidebar;
