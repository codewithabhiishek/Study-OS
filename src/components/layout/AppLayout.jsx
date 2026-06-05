import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-black">
      {/* Global scanline overlay */}
      <div className="fixed inset-0 pointer-events-none z-50" style={{
        background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)'
      }} />
      <Sidebar />
      <main className="md:ml-52 min-h-screen pb-20 md:pb-0 relative z-10">
        <div className="max-w-2xl mx-auto px-5 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}