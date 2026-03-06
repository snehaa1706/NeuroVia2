import { Bell, Settings, Search, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../../types';

interface NavbarProps {
    user: User;
    onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
    const navigate = useNavigate();
    const initials = user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    const roleColors: Record<string, string> = {
        patient: 'bg-blue-100 text-blue-700',
        caregiver: 'bg-teal-100 text-teal-700',
        doctor: 'bg-purple-100 text-purple-700',
    };
    const roleColor = roleColors[user.role] || 'bg-slate-100 text-slate-600';

    return (
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 sticky top-0 z-40 shadow-sm">

            {/* Search */}
            <div className="flex-1 max-w-sm">
                <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search patients, screenings, activities..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">

                {/* Notification Bell */}
                <button
                    onClick={() => navigate('/alerts')}
                    className="relative w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
                    aria-label="Notifications"
                >
                    <Bell className="w-[18px] h-[18px] text-slate-500" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                </button>

                {/* Emoji placeholder for AI status */}
                <button className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500 text-base" aria-label="AI Status">
                    e
                </button>

                <button className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors" aria-label="Settings">
                    <Settings className="w-[18px] h-[18px] text-slate-500" />
                </button>

                <div className="w-px h-6 bg-slate-200 mx-1" />

                {/* User Profile */}
                <button
                    onClick={onLogout}
                    className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl hover:bg-slate-50 transition-colors group"
                    title="Click to sign out"
                >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0">
                        {initials}
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                        <span className="text-sm font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                            {user.full_name}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize leading-tight mt-0.5 ${roleColor}`}>
                            ● {user.role}
                        </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
                </button>
            </div>
        </header>
    );
}
