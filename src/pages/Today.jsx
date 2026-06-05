import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import MissionBanner from '@/components/today/MissionBanner';
import TopTasks from '@/components/today/TopTasks';
import HabitChecklist from '@/components/today/HabitChecklist';
import UpcomingDeadlines from '@/components/today/UpcomingDeadlines';
import LuffyCompanion from '@/components/today/LuffyCompanion';

export default function Today() {
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
  const name = 'ABHISHEK';

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="text-[10px] font-mono tracking-widest mb-1" style={{ color: '#00FF87', opacity: 0.6 }}>
          {dateStr}
        </div>
        <h1 className="text-4xl font-black tracking-tighter leading-none glitch"
          style={{ color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>
          {greeting()}, {name}
          <span style={{ color: '#00FF87', textShadow: '0 0 20px #00FF87' }}>.</span>
        </h1>
      </div>

      <LuffyCompanion />

      <MissionBanner />
      <TopTasks />
      <HabitChecklist />
      <UpcomingDeadlines />

      <Link
        to="/focus"
        className="inline-flex items-center gap-2 px-5 py-3 font-mono font-bold text-sm tracking-widest transition-all mt-2 btn-neon-green"
      >
        <Zap className="w-4 h-4" />
        START FOCUS SESSION
      </Link>
    </div>
  );
}
