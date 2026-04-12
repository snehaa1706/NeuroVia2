import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Brain, Pill, Bell, Settings, LogOut, MessageSquare, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../components/LanguageSwitcher';

const Sidebar = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const links = [
    { name: t('dashboard'), path: '/patient/dashboard', icon: LayoutDashboard },
    { name: t('activities'), path: '/activities', icon: Brain },
    { name: t('medications'), path: '/medications', icon: Pill },
    { name: t('consultations'), path: '/patient/doctors', icon: MessageSquare },
    { name: t('alerts'), path: '/alerts', icon: Bell },
  ];

  return (
    <aside className="w-[15rem] bg-[#1a2744] h-screen shadow-2xl flex flex-col pt-6 font-sans transition-all">
      <div className="px-6 pb-6">
        <NavLink to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-[#6b7c52] rounded-[8px] flex items-center justify-center transition-transform duration-300 group-hover:rotate-6">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#f5f0e8] tracking-wide font-serif hover:scale-105 transition-transform origin-left">NeuroVia</h1>
        </NavLink>
      </div>
      <nav className="flex-1 px-3 space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-[0.9rem] font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-[--color-sage] text-white shadow-md'
                    : 'text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-[2px]'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {link.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom: Language, Settings & Logout */}
      <div className="px-3 pb-4 space-y-2 border-t border-white/10 pt-4">
        <div className="px-4 py-1.5">
          <LanguageSwitcher variant="dark" />
        </div>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-[0.9rem] font-medium transition-all duration-300 ${
              isActive
                ? 'bg-white/15 text-white'
                : 'text-white/50 hover:bg-white/10 hover:text-white/80'
            }`
          }
        >
          <Settings className="w-4 h-4" />
          {t('settings')}
        </NavLink>
        <button
          onClick={() => {
            localStorage.removeItem('neurovia_patient_token');
            localStorage.removeItem('consult_token');
            localStorage.removeItem('consult_role');
            localStorage.removeItem('consult_user');
            navigate('/login');
          }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-[0.9rem] font-medium text-red-400/80 hover:bg-red-500/15 hover:text-red-400 transition-all duration-300 w-full"
        >
          <LogOut className="w-4 h-4" />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
