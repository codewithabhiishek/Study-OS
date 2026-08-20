import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, FolderOpen, Timer, BarChart3, Calendar, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { path: '/today', label: 'TODAY', icon: CalendarDays },
  { path: '/projects', label: 'PROJECTS', icon: FolderOpen },

  { path: '/calendar', label: 'CALENDAR', icon: Calendar },
  { path: '/focus', label: 'FOCUS', icon: Timer },
  { path: '/review', label: 'REVIEW', icon: BarChart3 },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { data: missions = [] } = useQuery({
    queryKey: ['active-mission'],
    queryFn: () => supabaseClient.entities.Deadline.filter({ category: 'mission' }),
  });
  const activeMission = missions[0] || null;

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
          <Link to="/" className="block group">
            <div className="font-mono font-bold text-lg tracking-widest group-hover:opacity-90 transition-opacity" style={{ color: '#00FF87', textShadow: '0 0 15px #00FF87' }}>
              STUDY<span style={{ color: '#FF006E', textShadow: '0 0 15px #FF006E' }}>OS</span>
            </div>
          </Link>
          <div className="flex items-center justify-between text-[10px] font-mono mt-1" style={{ color: '#00FF87', opacity: 0.6 }}>
            <span>GRINDING... <span className="blink">_</span></span>
            <span className="text-[9px] px-1 border border-[#00FF87]/40 text-[#00FF87]">v1.0.1</span>
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
                  "flex items-center gap-3 px-3 py-2.5 text-[12px] font-mono font-bold tracking-widest transition-all duration-150 relative group cursor-pointer",
                  active
                    ? "text-black"
                    : "text-[#00FF87] hover:text-[#00FF87] md:hover:text-black"
                )}
                style={active ? {
                  background: '#00FF87',
                  boxShadow: '3px 3px 0 #FF006E',
                } : {}}
              >
                {!active && (
                  <span className="absolute inset-0 opacity-0 md:group-hover:opacity-100 transition-opacity"
                    style={{ background: '#00FF87', boxShadow: '3px 3px 0 #FF006E' }} />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10 flex-shrink-0" />
                <span className="relative z-10">{label}</span>
                {active && <span className="ml-auto relative z-10 text-[10px]">▶</span>}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-[#00FF87]/30 relative z-10 space-y-3">
          {user?.email && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#00FF87]" title={user.email}>
              <User className="w-3.5 h-3.5 flex-shrink-0 text-[#00FF87]" />
              <span className="font-bold tracking-wide break-all">
                {user.user_metadata?.full_name || `@${user.email.split('@')[0]}`}
              </span>
            </div>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-mono font-bold tracking-widest text-[#FF006E] border border-[#FF006E]/40 hover:bg-[#FF006E] hover:text-black transition-all cursor-pointer group"
            style={{ boxShadow: '0 0 10px rgba(255,0,110,0.15)' }}
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>LOGOUT</span>
          </button>

          <div className="text-[10px] font-mono uppercase pt-2 border-t border-[#00FF87]/15 text-center tracking-wider truncate" style={{ color: '#FF006E' }}>
            {activeMission ? `MISSION: ${activeMission.title}` : 'MISSION: [NOT SET]'}
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-[#00FF87] pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
        style={{ boxShadow: '0 -4px 20px rgba(0,255,135,0.15)' }}>
        <div className="grid grid-cols-6 items-center px-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className="flex flex-col items-center justify-center py-2 text-[9px] font-mono font-bold tracking-tight transition-all active:scale-95"
                style={{ color: active ? '#00FF87' : '#666' }}
              >
                <Icon className="w-4 h-4 mb-0.5" style={active ? { filter: 'drop-shadow(0 0 5px #00FF87)' } : {}} />
                <span className="truncate max-w-[50px]">{label}</span>
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="flex flex-col items-center justify-center py-2 text-[9px] font-mono font-bold tracking-tight text-[#FF006E] transition-all active:scale-95 cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4 mb-0.5" style={{ filter: 'drop-shadow(0 0 5px #FF006E)' }} />
            <span className="truncate max-w-[50px]">EXIT</span>
          </button>
        </div>
      </nav>
    </>
  );
}
