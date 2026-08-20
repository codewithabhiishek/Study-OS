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
  Sparkles
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
      hoverShadow: '#FF006E',
      tag: '01'
    },
    {
      icon: Zap,
      title: 'CYBER FOCUS TIMER',
      desc: 'Pomodoro and deep-work intervals with electric visual feedback and ambient sound.',
      color: '#FF006E',
      hoverShadow: '#00FF87',
      tag: '02'
    },
    {
      icon: FolderOpen,
      title: 'PROJECT MATRIX',
      desc: 'Track academic courses, research, and coding projects with subtask progress bars.',
      color: '#00FF87',
      hoverShadow: '#FF006E',
      tag: '03'
    },
    {
      icon: Flame,
      title: 'HABIT STREAKS',
      desc: 'Build unbreakable daily consistency with visual streak counters and instant check-ins.',
      color: '#FF006E',
      hoverShadow: '#00FF87',
      tag: '04'
    },
    {
      icon: Calendar,
      title: 'TIMELINE & DEADLINES',
      desc: 'Countdown clocks for high-stakes exams, university admissions, and assignments.',
      color: '#00FF87',
      hoverShadow: '#FF006E',
      tag: '05'
    },
    {
      icon: BarChart3,
      title: 'WEEKLY INTELLIGENCE',
      desc: 'Review weekly focus hour heatmaps, habit compliance rates, and debriefs.',
      color: '#FF006E',
      hoverShadow: '#00FF87',
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
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group">
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-black border border-[#00FF87] flex items-center justify-center font-mono font-bold text-[10px] sm:text-xs text-[#00FF87] shadow-[2px_2px_0px_#FF006E] group-hover:shadow-[3px_3px_0px_#00FF87] group-hover:-translate-y-0.5 transition-all duration-200">
              ⚡
            </div>
            <div className="font-mono font-black text-base sm:text-lg tracking-wider sm:tracking-widest group-hover:opacity-90 transition-opacity" style={{ color: '#00FF87', textShadow: '0 0 10px rgba(0,255,135,0.5)' }}>
              STUDY<span style={{ color: '#FF006E', textShadow: '0 0 10px rgba(255,0,110,0.5)' }}>OS</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link
                to="/today"
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-mono font-bold tracking-wider sm:tracking-widest btn-neon-green flex items-center gap-1 sm:gap-1.5 hover:-translate-y-0.5 transition-all"
              >
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>OPEN OS</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-mono font-bold tracking-wider text-[#00FF87] border border-[#00FF87]/40 hover:bg-[#00FF87]/15 hover:border-[#00FF87] hover:shadow-[2px_2px_0px_#00FF87] hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  <span>SIGN IN</span>
                </Link>
                <Link
                  to="/register"
                  className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-mono font-bold tracking-wider btn-neon-green flex items-center gap-1 hover:-translate-y-0.5 transition-all"
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
      <main className="relative z-10 max-w-6xl mx-auto px-3.5 sm:px-6 py-8 sm:py-14 space-y-10 sm:space-y-14">
        
        {/* HERO SECTION */}
        <section className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 border border-[#00FF87] bg-black shadow-[2px_2px_0px_#00FF87] hover:shadow-[3px_3px_0px_#FF006E] hover:-translate-y-0.5 transition-all duration-200 cursor-default max-w-full">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00FF87] animate-pulse flex-shrink-0" />
            <span className="font-mono text-[9px] sm:text-[11px] font-bold tracking-wider sm:tracking-widest text-[#00FF87] truncate">
              {'100% FREE & OPEN SOURCE // ZERO PAYWALLS'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-[1.08] font-sans">
            THE CYBERPUNK <br />
            <span className="text-[#00FF87] glitch hover:text-white transition-colors" style={{ textShadow: '0 0 25px rgba(0,255,135,0.5)' }}>
              STUDY OPERATING SYSTEM
            </span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base font-mono text-neutral-300 max-w-xl mx-auto leading-relaxed px-1">
            A fast, distraction-free productivity cockpit for students and developers. 
            Track daily targets, run deep work focus timers, build habits, and crush academic deadlines.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
            {user ? (
              <Link
                to="/today"
                className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 text-xs font-mono font-bold tracking-widest btn-neon-green flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#FF006E] transition-all duration-200"
              >
                <Zap className="w-4 h-4 fill-black group-hover:scale-110 transition-transform" />
                <span>LAUNCH YOUR COCKPIT</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="group w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 text-xs font-mono font-bold tracking-widest btn-neon-green flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#FF006E] transition-all duration-200"
                >
                  <Zap className="w-4 h-4 fill-black group-hover:scale-110 transition-transform" />
                  <span>GET STARTED [100% FREE]</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link
                  to="/login"
                  className="group w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 text-xs font-mono font-bold tracking-widest text-[#FF006E] border border-[#FF006E] bg-black hover:bg-[#FF006E] hover:text-black transition-all duration-200 flex items-center justify-center gap-2 shadow-[2px_2px_0px_#00FF87] hover:shadow-[4px_4px_0px_#00FF87] hover:-translate-y-1"
                >
                  <Lock className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>SIGN IN</span>
                </Link>
              </>
            )}
          </div>

          {/* Key Value Badges */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-3 font-mono text-[10px] sm:text-xs text-neutral-400 pt-2">
            {[
              '100% Free Forever',
              'Open Source (MIT)',
              'Supabase Postgres RLS',
              'Zero Ads or Tracking'
            ].map((badge, bIdx) => (
              <span 
                key={bIdx}
                className="flex items-center justify-center gap-1 text-neutral-300 px-2 py-1 border border-neutral-800 bg-neutral-950/80 hover:border-[#00FF87] hover:text-white hover:shadow-[2px_2px_0px_#00FF87] hover:-translate-y-0.5 transition-all duration-200 cursor-default"
              >
                <span className="text-[#00FF87] font-bold">✓</span> <span className="truncate">{badge}</span>
              </span>
            ))}
          </div>
        </section>

        {/* WHAT YOU CAN DO (CORE MODULES) */}
        <section className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5 sm:pb-3">
            <div className="font-mono text-[11px] sm:text-xs font-bold text-[#00FF87] tracking-wider sm:tracking-widest flex items-center gap-1.5 sm:gap-2">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#00FF87] inline-block" />
              {'// WHAT YOU CAN DO IN STUDYOS'}
            </div>
            <div className="font-mono text-[9px] sm:text-[10px] text-neutral-500 font-bold">
              6 CORE MODULES
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx}
                  className="p-4 sm:p-5 border bg-black transition-all duration-200 group cursor-pointer hover:-translate-y-1.5 hover:translate-x-0.5 relative overflow-hidden"
                  style={{
                    borderColor: item.color,
                    boxShadow: `3px 3px 0px ${item.color}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `5px 5px 0px ${item.hoverShadow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `3px 3px 0px ${item.color}`;
                  }}
                >
                  {/* Subtle hover gradient flare */}
                  <div 
                    className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none blur-xl"
                    style={{ background: item.color }}
                  />

                  <div className="flex items-center justify-between mb-2.5 sm:mb-3 relative z-10">
                    <div 
                      className="w-8 h-8 sm:w-9 sm:h-9 border flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
                      style={{ 
                        borderColor: item.color, 
                        color: item.color,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200" />
                    </div>
                    <span 
                      className="font-mono text-[9px] sm:text-[10px] text-neutral-500 font-bold transition-colors group-hover:text-white"
                    >
                      {item.tag}
                    </span>
                  </div>

                  <h2 
                    className="font-sans font-bold text-xs sm:text-sm tracking-wide text-white uppercase mb-1 sm:mb-1.5 transition-colors duration-200 relative z-10"
                    style={{ 
                      textShadow: '0 0 1px rgba(255,255,255,0.1)' 
                    }}
                  >
                    {item.title}
                  </h2>
                  <p className="font-mono text-[11px] sm:text-xs text-neutral-400 group-hover:text-neutral-300 leading-relaxed transition-colors duration-200 relative z-10">
                    {item.desc}
                  </p>

                  <div className="mt-2.5 sm:mt-3 pt-2 border-t border-neutral-900 flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-neutral-500 group-hover:text-[#00FF87] transition-colors relative z-10">
                    <span>STATUS: OPERATIONAL</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">EXPLORE →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FREE & OPEN SOURCE SUMMARY BOX */}
        <section className="p-4 sm:p-6 border border-[#00FF87] bg-black shadow-[3px_3px_0px_#FF006E] sm:shadow-[4px_4px_0px_#FF006E] hover:shadow-[5px_5px_0px_#00FF87] hover:-translate-y-0.5 sm:hover:-translate-y-1 transition-all duration-200 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 group">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-mono text-[10px] sm:text-[11px] font-bold text-[#FF006E]">
              {'// OPEN SOURCE PHILOSOPHY'}
            </div>
            <h2 className="font-sans font-bold text-base sm:text-lg text-white group-hover:text-[#00FF87] transition-colors">
              No Subscriptions. No Paywalls. Full Data Ownership.
            </h2>
            <p className="font-mono text-[11px] sm:text-xs text-neutral-400 max-w-xl">
              StudyOS is built with React 18, Vite, Tailwind CSS, and Supabase. You can use it online for free or self-host your own instance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
            <a
              href="https://github.com/codewithabhiishek/Study-OS"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-xs font-mono font-bold tracking-wider text-neutral-300 border border-neutral-700 hover:border-[#00FF87] hover:text-[#00FF87] hover:shadow-[2px_2px_0px_#00FF87] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Github className="w-4 h-4" />
              <span>GITHUB</span>
            </a>
            
            <Link
              to={user ? "/today" : "/register"}
              className="px-4 py-2 text-xs font-mono font-bold tracking-wider btn-neon-green flex items-center justify-center gap-1.5 hover:-translate-y-0.5 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{user ? "ENTER OS" : "START FREE"}</span>
            </Link>
          </div>
        </section>

        {/* ANIMATED SARCASTIC FOCUS BANNER */}
        <section className="border border-[#FF006E]/60 bg-black p-3.5 sm:p-5 shadow-[3px_3px_0px_#00FF87] sm:shadow-[4px_4px_0px_#00FF87] hover:shadow-[5px_5px_0px_#FF006E] hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FF006E] animate-ping flex-shrink-0" />
              <span className="font-mono text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-widest text-[#FF006E] uppercase group-hover:text-white transition-colors">
                {'[FOCUS_DISCIPLINE_FEED]'}
              </span>
            </div>
            
            <div className={`font-mono text-xs sm:text-sm font-semibold text-neutral-200 transition-opacity duration-300 flex-1 px-1 sm:px-2 ${isFading ? 'opacity-0 scale-98' : 'opacity-100 scale-100'}`}>
              {SARCASTIC_LINES[quoteIndex]}
            </div>

            <div className="flex-shrink-0 font-mono text-[9px] sm:text-[10px] text-neutral-500 uppercase tracking-wider">
              AUTO-SYNCING <span className="blink">_</span>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER WITH ANIMATED SIGNATURE & MOTIVATION */}
      <footer className="relative z-20 border-t border-neutral-800 bg-black/95 py-6 sm:py-8 px-4 sm:px-6 font-mono text-xs pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 text-center md:text-left">
          
          {/* Brand & MIT License */}
          <div className="space-y-1">
            <div className="font-bold text-white tracking-widest flex items-center justify-center md:justify-start gap-2">
              <span className="text-[#00FF87]">STUDY</span>
              <span className="text-[#FF006E]">OS</span>
              <span className="text-[10px] text-neutral-500 font-normal">{'// 100% FREE & OPEN-SOURCE (MIT)'}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-neutral-500">
              Stop overthinking. Start executing.
            </p>
          </div>

          {/* Center: Dynamic Animated "Built by Abhishek" Pill */}
          <div className="flex flex-col items-center gap-1 max-w-full">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-neutral-950 border border-[#00FF87] shadow-[2px_2px_0px_#FF006E] sm:shadow-[3px_3px_0px_#FF006E] hover:shadow-[4px_4px_0px_#00FF87] hover:-translate-y-0.5 transition-all duration-200 cursor-default max-w-full">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#00FF87] animate-spin flex-shrink-0" style={{ animationDuration: '4s' }} />
              <span className="font-mono text-[11px] sm:text-xs font-bold tracking-wider text-neutral-200 truncate">
                BUILT WITH <Zap className="w-3 h-3 inline text-[#00FF87] fill-[#00FF87] mx-0.5" /> BY{' '}
                <span className="text-[#00FF87] font-black glitch hover:text-[#FF006E] transition-colors" style={{ textShadow: '0 0 10px rgba(0,255,135,0.7)' }}>
                  ABHISHEK
                </span>
              </span>
            </div>
            <div className="text-[9px] sm:text-[10px] font-mono text-neutral-500 tracking-tight">
              ⚡ Congrats, you reached the footer. Now go study.
            </div>
          </div>

          {/* Right Links */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 text-neutral-400 text-[11px] sm:text-xs">
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
