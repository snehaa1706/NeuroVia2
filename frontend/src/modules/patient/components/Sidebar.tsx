import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Brain, Pill, Bell, Settings, LogOut, MessageSquare } from 'lucide-react';
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
    { name: 'Notifications', path: '/alerts', icon: Bell },
  ];

  return (
    <aside className="w-72 bg-(--color-navy) h-screen shadow-2xl flex flex-col pt-6">
      <div className="px-8 pb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">NeuroVia</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-6 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-(--color-sage) text-white shadow-lg shadow-[#84A59D]/30'
                    : 'text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1'
                }`
              }
            >
              <Icon className="w-6 h-6" />
              {link.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom: Language, Settings & Logout */}
      <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-4">
        <div className="px-6 py-2">
          <LanguageSwitcher variant="dark" />
        </div>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-4 px-6 py-3 rounded-2xl text-lg font-semibold transition-all duration-300 ${
              isActive
                ? 'bg-white/15 text-white'
                : 'text-white/50 hover:bg-white/10 hover:text-white/80'
            }`
          }
        >
          <Settings className="w-5 h-5" />
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
          className="flex items-center gap-4 px-6 py-3 rounded-2xl text-lg font-semibold text-red-400/70 hover:bg-red-500/15 hover:text-red-400 transition-all duration-300 w-full"
        >
          <LogOut className="w-5 h-5" />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
