import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, FolderOpen, GraduationCap, Timer, BarChart3, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'TODAY', icon: CalendarDays },
  { path: '/projects', label: 'PROJECTS', icon: FolderOpen },
  { path: '/universities', label: 'UNIV', icon: GraduationCap },
  { path: '/calendar', label: 'CALENDAR', icon: Calendar },
  { path: '/focus', label: 'FOCUS', icon: Timer },
  { path: '/review', label: 'REVIEW', icon: BarChart3 },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 h-screen fixed left-0 top-0 z-30 bg-black border-r border-[#00FF87] overflow-hidden"
        style={{ boxShadow: '4px 0 20px rgba(0,255,135,0.15)' }}>
        {/* Scanlines overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,255,135,0.02) 3px, rgba(0,255,135,0.02) 4px)'
        }} />

        <div className="px-5 pt-7 pb-5 relative z-10">
          <div className="font-mono font-bold text-lg tracking-widest" style={{ color: '#00FF87', textShadow: '0 0 15px #00FF87' }}>
            STUDY<span style={{ color: '#FF006E', textShadow: '0 0 15px #FF006E' }}>OS</span>
          </div>
          <div className="text-[10px] font-mono mt-1" style={{ color: '#00FF87', opacity: 0.5 }}>
            GRINDING... <span className="blink">_</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 relative z-10">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-[12px] font-mono font-bold tracking-widest transition-all duration-150 relative group",
                  active
                    ? "text-black"
                    : "text-[#00FF87] hover:text-black"
                )}
                style={active ? {
                  background: '#00FF87',
                  boxShadow: '3px 3px 0 #FF006E',
                } : {}}
              >
                {!active && (
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: '#00FF87', boxShadow: '3px 3px 0 #FF006E' }} />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10 flex-shrink-0" />
                <span className="relative z-10">{label}</span>
                {active && <span className="ml-auto relative z-10 text-[10px]">▶</span>}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-[#00FF87]/30 relative z-10">
          <div className="text-[10px] font-mono" style={{ color: '#FF006E' }}>
            MISSION: DE 2027
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-[#00FF87]"
        style={{ boxShadow: '0 -4px 20px rgba(0,255,135,0.2)' }}>
        <div className="flex items-center justify-around">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className="flex flex-col items-center gap-0.5 px-3 py-2.5 text-[9px] font-mono font-bold tracking-wider transition-all"
                style={{ color: active ? '#00FF87' : '#666' }}
              >
                <Icon className="w-4 h-4" style={active ? { filter: 'drop-shadow(0 0 4px #00FF87)' } : {}} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
