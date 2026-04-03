import React from 'react';
import { UserCircle } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="h-24 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-10 shadow-sm rounded-b-3xl mb-8 border border-(--color-ivory-200)">
      <div>
        <h2 className="text-2xl font-bold text-(--color-navy)">Welcome back, Sarah</h2>
        <p className="text-lg text-(--color-navy)/70">Here is your daily overview</p>
      </div>
      <div className="flex items-center gap-4 cursor-pointer hover:bg-(--color-ivory-100) p-3 rounded-2xl transition-colors">
        <span className="text-xl font-medium text-(--color-navy)">Sarah Jenkins</span>
        <UserCircle className="w-12 h-12 text-(--color-sage)" />
      </div>
    </header>
  );
};

export default Navbar;
