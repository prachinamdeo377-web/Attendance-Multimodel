import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  UserCheck,
  Mic,
  Video,
  Activity,
  History,
  Settings as SettingsIcon,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  onSeedDemo: () => void;
  isSeeding: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSeedDemo, isSeeding }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/live', label: 'Live Session', icon: Radio },
    { to: '/attendance', label: 'Attendance', icon: UserCheck },
    { to: '/audio', label: 'Audio Analysis', icon: Mic },
    { to: '/video', label: 'Video Analysis', icon: Video },
    { to: '/engagement', label: 'Engagement', icon: Activity },
    { to: '/history', label: 'Session History', icon: History },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 select-none shadow-xl">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-none">
                Multimodal Agent
              </h1>
              <span className="text-[11px] text-blue-400 font-medium tracking-wide uppercase mt-1 block">
                Classroom AI Platform
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions & Status */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        {/* Demo Quick Action */}
        <button
          onClick={onSeedDemo}
          disabled={isSeeding}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold text-blue-200 bg-blue-950/70 border border-blue-800/50 hover:bg-blue-900/60 transition cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>{isSeeding ? 'Seeding Data...' : 'Initialize Demo Data'}</span>
        </button>

        {/* Privacy badge */}
        <div className="bg-slate-800/50 rounded-lg p-2.5 flex items-center gap-2 border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-[11px] leading-tight">
            <div className="text-slate-200 font-medium">Local Processing</div>
            <div className="text-slate-500">Consent-based verification</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
