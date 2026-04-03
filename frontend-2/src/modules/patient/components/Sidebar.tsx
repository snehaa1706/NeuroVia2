import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Brain, Pill, Bell } from 'lucide-react';

const Sidebar = () => {
  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Activities', path: '/activities', icon: Brain },
    { name: 'Medications', path: '/medications', icon: Pill },
    { name: 'Alerts', path: '/alerts', icon: Bell },
  ];

  return (
    <aside className="w-72 bg-white h-screen shadow-lg flex flex-col pt-6 rounded-r-2xl">
      <div className="px-8 pb-8">
        <h1 className="text-3xl font-bold text-(--color-navy) tracking-tight">NeuroVia</h1>
      </div>
      <nav className="flex-1 px-4 space-y-3">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-6 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-(--color-sage) text-white shadow-md'
                    : 'text-(--color-navy) hover:bg-(--color-ivory-200) hover:translate-x-1'
                }`
              }
            >
              <Icon className="w-7 h-7" />
              {link.name}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-6">
        <div className="bg-(--color-ivory-100) rounded-2xl p-6 text-center text-(--color-navy)">
          <p className="text-xl font-medium">Have a great day!</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
