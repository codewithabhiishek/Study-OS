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
    <div className="min-h-screen bg-black">
      {/* Global scanline overlay */}
      <div className="fixed inset-0 pointer-events-none z-50" style={{
        background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)'
      }} />

      {/* Mobile top header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-black border-b border-[#00FF87]/30 sticky top-0 z-30">
        <Link to="/" className="font-mono font-bold text-sm tracking-widest" style={{ color: '#00FF87', textShadow: '0 0 10px #00FF87' }}>
          STUDY<span style={{ color: '#FF006E', textShadow: '0 0 10px #FF006E' }}>OS</span>
        </Link>
        {user?.email && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-[#00FF87]/80 truncate max-w-[150px]" title={user.email}>
              {user.email}
            </span>
            <button
              onClick={logout}
              className="text-[#FF006E] hover:text-[#FF006E]/80 transition-colors p-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      <Sidebar />
      <main className="md:ml-52 min-h-screen pb-20 md:pb-0 relative z-10">
        <div className={`mx-auto px-5 py-8 ${isWidePage ? 'max-w-6xl' : 'max-w-2xl'} transition-all duration-300`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}