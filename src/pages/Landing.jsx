import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { 
  Zap, 
  Terminal, 
  Flame, 
  FolderOpen, 
  Calendar, 
  BarChart3, 
  ArrowRight, 
  ShieldCheck, 
  Github, 
  Lock, 
  UserPlus,
  Sparkles,
  Heart
} from 'lucide-react';

const SARCASTIC_LINES = [
  "⚠️ Stop doomscrolling reels. Your future self is judging you right now.",
  "⚡ Built for people who actually study, not people who spend 14 hours customizing Notion templates.",
  "💀 Close your 47 open tabs. None of them are going to write that code for you.",
  "🔥 Motivation is a myth. Lock in, drink water, and get to work.",
  "🚀 You didn't come this far to only come this far. Stop procrastinating.",
  "🧠 Reading the textbook title for 20 minutes is not 'deep focus'."
];

export default function Landing() {
  const { user } = useAuth();
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  // Rotate sarcastic focus quotes with animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % SARCASTIC_LINES.length);
        setIsFading(false);
      }, 300);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Terminal,
      title: 'TODAY HORIZON',
      desc: 'Lock in on daily top-3 priorities, active missions, and daily habit checklists.',
      color: '#00FF87',
      tag: '01'
    },
    {
      icon: Zap,
      title: 'CYBER FOCUS TIMER',
      desc: 'Pomodoro and deep-work intervals with electric visual feedback and ambient sound.',
      color: '#FF006E',
      tag: '02'
    },
    {
      icon: FolderOpen,
      title: 'PROJECT MATRIX',
      desc: 'Track academic courses, research, and coding projects with subtask progress bars.',
      color: '#00FF87',
      tag: '03'
    },
    {
      icon: Flame,
      title: 'HABIT STREAKS',
      desc: 'Build unbreakable daily consistency with visual streak counters and instant check-ins.',
      color: '#FF006E',
      tag: '04'
    },
    {
      icon: Calendar,
      title: 'TIMELINE & DEADLINES',
      desc: 'Countdown clocks for high-stakes exams, university admissions, and assignments.',
      color: '#00FF87',
      tag: '05'
    },
    {
      icon: BarChart3,
      title: 'WEEKLY INTELLIGENCE',
      desc: 'Review weekly focus hour heatmaps, habit compliance rates, and debriefs.',
      color: '#FF006E',
      tag: '06'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#00FF87] selection:text-black relative overflow-x-hidden font-sans flex flex-col justify-between">
      {/* Scanline overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-30" 
        style={{
          background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)'
        }} 
      />

      {/* Grid background */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-15 z-0" 
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(0, 255, 135, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 255, 135, 0.1) 1px, transparent 1px)',
          backgroundSize: '36px 36px'
        }} 
      />

      {/* Navigation Header */}
      <header className="relative z-20 border-b border-[#00FF87]/30 bg-black/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-black border border-[#00FF87] flex items-center justify-center font-mono font-bold text-xs text-[#00FF87] shadow-[2px_2px_0px_#FF006E] group-hover:shadow-[3px_3px_0px_#00FF87] transition-all">
              ⚡
            </div>
            <div className="font-mono font-black text-lg tracking-widest" style={{ color: '#00FF87', textShadow: '0 0 10px rgba(0,255,135,0.5)' }}>
              STUDY<span style={{ color: '#FF006E', textShadow: '0 0 10px rgba(255,0,110,0.5)' }}>OS</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/today"
                className="px-4 py-2 text-xs font-mono font-bold tracking-widest btn-neon-green flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>OPEN OS</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-mono font-bold tracking-widest text-[#00FF87] border border-[#00FF87]/40 hover:bg-[#00FF87]/10 hover:border-[#00FF87] transition-all flex items-center gap-1.5"
                >
                  <Lock className="w-3 h-3" />
                  <span>SIGN IN</span>
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-mono font-bold tracking-widest btn-neon-green flex items-center gap-1.5"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>REGISTER</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-14">
        
        {/* HERO SECTION */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#00FF87] bg-black shadow-[2px_2px_0px_#00FF87]">
            <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse" />
            <span className="font-mono text-[11px] font-bold tracking-widest text-[#00FF87]">
              {'100% FREE & OPEN SOURCE // ZERO PAYWALLS'}
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-none font-sans">
            THE CYBERPUNK <br />
            <span className="text-[#00FF87]" style={{ textShadow: '0 0 25px rgba(0,255,135,0.5)' }}>
              STUDY OPERATING SYSTEM
            </span>
          </h1>

          <p className="text-sm sm:text-base font-mono text-neutral-300 max-w-xl mx-auto leading-relaxed">
            A fast, distraction-free productivity cockpit for students and developers. 
            Track daily targets, run deep work focus timers, build habits, and crush academic deadlines.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {user ? (
              <Link
                to="/today"
                className="w-full sm:w-auto px-8 py-3.5 text-xs font-mono font-bold tracking-widest btn-neon-green flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>LAUNCH YOUR COCKPIT</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-7 py-3.5 text-xs font-mono font-bold tracking-widest btn-neon-green flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-black" />
                  <span>GET STARTED [100% FREE]</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-7 py-3.5 text-xs font-mono font-bold tracking-widest text-[#FF006E] border border-[#FF006E] bg-black hover:bg-[#FF006E] hover:text-black transition-all flex items-center justify-center gap-2 shadow-[3px_3px_0px_#00FF87]"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>SIGN IN</span>
                </Link>
              </>
            )}
          </div>

          {/* Key Value Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-mono text-xs text-neutral-400 pt-2">
            <span className="flex items-center gap-1.5 text-white">
              <span className="text-[#00FF87]">✓</span> 100% Free Forever
            </span>
            <span className="flex items-center gap-1.5 text-white">
              <span className="text-[#00FF87]">✓</span> Open Source (MIT)
            </span>
            <span className="flex items-center gap-1.5 text-white">
              <span className="text-[#00FF87]">✓</span> Supabase Postgres RLS
            </span>
            <span className="flex items-center gap-1.5 text-white">
              <span className="text-[#00FF87]">✓</span> Zero Ads or Tracking
            </span>
          </div>
        </section>

        {/* WHAT YOU CAN DO (CORE MODULES) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="font-mono text-xs font-bold text-[#00FF87] tracking-widest">
              {'// WHAT YOU CAN DO IN STUDYOS'}
            </div>
            <div className="font-mono text-[10px] text-neutral-500 font-bold">
              6 CORE MODULES
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx}
                  className="p-5 border bg-black transition-all group"
                  style={{
                    borderColor: item.color,
                    boxShadow: `3px 3px 0px ${item.color}`
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div 
                      className="w-9 h-9 border flex items-center justify-center"
                      style={{ borderColor: item.color, color: item.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-[10px] text-neutral-500 font-bold">
                      {item.tag}
                    </span>
                  </div>

                  <h2 className="font-sans font-bold text-sm tracking-wide text-white uppercase mb-1.5">
                    {item.title}
                  </h2>
                  <p className="font-mono text-xs text-neutral-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* FREE & OPEN SOURCE SUMMARY BOX */}
        <section className="p-6 border border-[#00FF87] bg-black shadow-[4px_4px_0px_#FF006E] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-mono text-[11px] font-bold text-[#FF006E]">
              {'// OPEN SOURCE PHILOSOPHY'}
            </div>
            <h2 className="font-sans font-bold text-lg text-white">
              No Subscriptions. No Paywalls. Full Data Ownership.
            </h2>
            <p className="font-mono text-xs text-neutral-400 max-w-xl">
              StudyOS is built with React 18, Vite, Tailwind CSS, and Supabase. You can use it online for free or self-host your own instance.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <a
              href="https://github.com/codewithabhiishek/Study-OS"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-xs font-mono font-bold tracking-wider text-neutral-300 border border-neutral-700 hover:border-[#00FF87] hover:text-[#00FF87] transition-all flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              <span>GITHUB</span>
            </a>
            
            <Link
              to={user ? "/today" : "/register"}
              className="px-4 py-2 text-xs font-mono font-bold tracking-wider btn-neon-green flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{user ? "ENTER OS" : "START FREE"}</span>
            </Link>
          </div>
        </section>

        {/* ANIMATED SARCASTIC FOCUS BANNER */}
        <section className="border border-[#FF006E]/60 bg-black p-4 sm:p-5 shadow-[4px_4px_0px_#00FF87] relative overflow-hidden group">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF006E] animate-ping flex-shrink-0" />
              <span className="font-mono text-xs font-bold tracking-widest text-[#FF006E] uppercase">
                {'[FOCUS_DISCIPLINE_FEED]'}
              </span>
            </div>
            
            <div className={`font-mono text-xs sm:text-sm font-semibold text-neutral-200 transition-opacity duration-300 flex-1 px-2 ${isFading ? 'opacity-0 scale-98' : 'opacity-100 scale-100'}`}>
              {SARCASTIC_LINES[quoteIndex]}
            </div>

            <div className="flex-shrink-0 font-mono text-[10px] text-neutral-500 uppercase tracking-wider">
              AUTO-SYNCING <span className="blink">_</span>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER WITH ANIMATED SIGNATURE & MOTIVATION */}
      <footer className="relative z-20 border-t border-neutral-800 bg-black/95 py-8 px-4 sm:px-6 font-mono text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          {/* Brand & MIT License */}
          <div className="space-y-1">
            <div className="font-bold text-white tracking-widest flex items-center justify-center md:justify-start gap-2">
              <span className="text-[#00FF87]">STUDY</span>
              <span className="text-[#FF006E]">OS</span>
              <span className="text-[10px] text-neutral-500 font-normal">{'// 100% FREE & OPEN-SOURCE (MIT)'}</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Stop overthinking. Start executing.
            </p>
          </div>

          {/* Center: Dynamic Animated "Built by Abhishek" Pill */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-950 border border-[#00FF87] shadow-[3px_3px_0px_#FF006E] hover:shadow-[5px_5px_0px_#00FF87] hover:-translate-y-0.5 transition-all duration-200 cursor-default">
              <Sparkles className="w-3.5 h-3.5 text-[#00FF87] animate-spin" style={{ animationDuration: '4s' }} />
              <span className="font-mono text-xs font-bold tracking-wider text-neutral-200">
                BUILT WITH <Zap className="w-3 h-3 inline text-[#00FF87] fill-[#00FF87] mx-0.5" /> BY{' '}
                <span className="text-[#00FF87] font-black glitch hover:text-[#FF006E] transition-colors" style={{ textShadow: '0 0 10px rgba(0,255,135,0.7)' }}>
                  ABHISHEK
                </span>
              </span>
            </div>
            <div className="text-[10px] font-mono text-neutral-500 tracking-tight">
              ⚡ Congrats, you reached the footer. Now go study.
            </div>
          </div>

          {/* Right Links */}
          <div className="flex items-center gap-4 text-neutral-400">
            <Link to="/login" className="hover:text-[#00FF87] transition-colors font-bold">SIGN IN</Link>
            <span>{'//'}</span>
            <Link to="/register" className="hover:text-[#00FF87] transition-colors font-bold">REGISTER</Link>
            <span>{'//'}</span>
            <a href="https://github.com/codewithabhiishek/Study-OS" target="_blank" rel="noreferrer" className="hover:text-[#00FF87] transition-colors flex items-center gap-1">
              <Github className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      </footer>
    </div>
  );
}
