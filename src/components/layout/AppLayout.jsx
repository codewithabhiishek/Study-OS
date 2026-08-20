import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '@/lib/AuthContext';
import { LogOut } from 'lucide-react';

export default function AppLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isWidePage = location.pathname.includes('calendar');

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#00FF87] selection:text-black">
      {/* Global scanline overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-40" style={{
        background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)'
      }} />

      {/* Mobile top header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-black/95 backdrop-blur-md border-b border-[#00FF87]/30 sticky top-0 z-30 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <Link to="/" className="font-mono font-black text-sm tracking-widest flex items-center gap-1.5 group">
          <span className="w-5 h-5 bg-black border border-[#00FF87] flex items-center justify-center text-[10px] text-[#00FF87] shadow-[2px_2px_0px_#FF006E]">
            ⚡
          </span>
          <span style={{ color: '#00FF87', textShadow: '0 0 10px rgba(0,255,135,0.6)' }}>
            STUDY<span style={{ color: '#FF006E', textShadow: '0 0 10px rgba(255,0,110,0.6)' }}>OS</span>
          </span>
        </Link>
        {user?.email && (
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-mono font-bold text-[#00FF87] truncate max-w-[130px] sm:max-w-[200px]" title={user.email}>
              {user.user_metadata?.full_name || `@${user.email.split('@')[0]}`}
            </span>
            <button
              onClick={logout}
              className="text-[#FF006E] hover:text-[#FF006E]/80 transition-colors p-1 border border-[#FF006E]/40 active:scale-95"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </header>

      <Sidebar />
      <main className="md:ml-52 min-h-screen pb-28 md:pb-12 relative z-10">
        <div className={`mx-auto px-3.5 sm:px-6 py-5 sm:py-8 ${isWidePage ? 'max-w-6xl' : 'max-w-3xl'} transition-all duration-300`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}