import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabaseClient } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Pause, RotateCcw, Maximize2, Minimize2, Bell, BellOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

import { useFocus, PRESETS } from '@/hooks/FocusContext';

export default function Focus() {
  const {
    preset,
    setPreset,
    customWork,
    setCustomWork,
    isCustom,
    setIsCustom,
    seconds,
    running,
    setRunning,
    selectedProject,
    setSelectedProject,
    phase,
    pomodoroEnabled,
    setPomodoroEnabled,
    soundEnabled,
    setSoundEnabled,
    notificationsEnabled,
    setNotificationsEnabled,
    reset,
    workMinutes,
    phaseMinutes,
    logMutation,
    offlineQueue,
  } = useFocus();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => supabaseClient.entities.Project.list(),
  });

  const localNow = new Date();
  const today = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, '0')}-${String(localNow.getDate()).padStart(2, '0')}`;
  const { data: todaySessions = [] } = useQuery({
    queryKey: ['focus_sessions', today],
    queryFn: () => supabaseClient.entities.FocusSession.filter({ session_date: today }),
  });

  const stats = useMemo(() => {
    const offlineToday = offlineQueue.filter(s => s.session_date === today);
    const merged = [...todaySessions, ...offlineToday];
    const count = merged.length;
    const minutes = merged.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    return { count, minutes };
  }, [todaySessions, offlineQueue, today]);

  // Fullscreen change listener
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Prevent background scrolling when simulated fullscreen is active
  useEffect(() => {
    if (isFullscreen && !document.fullscreenElement) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const enterFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    // If we are currently in simulated fullscreen (isFullscreen is true but no native fullscreen element exists),
    // toggle it off directly.
    if (isFullscreen && !document.fullscreenElement) {
      setIsFullscreen(false);
      return;
    }

    if (el.requestFullscreen) {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else {
          await el.requestFullscreen();
        }
        return;
      } catch (err) {
        console.warn("Native fullscreen failed, falling back to simulated fullscreen:", err);
      }
    }

    // Fallback: toggle simulated fullscreen state
    setIsFullscreen((prev) => !prev);
  }, [isFullscreen]);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      setNotificationsEnabled((v) => !v);
      return;
    }
    if (Notification.permission !== 'denied') {
      const res = await Notification.requestPermission();
      setNotificationsEnabled(res === 'granted');
    }
  }, [setNotificationsEnabled]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setRunning((r) => !r);
      } else if (e.key === 'r' || e.key === 'R') {
        reset();
      } else if (e.key === 'f' || e.key === 'F') {
        enterFullscreen();
      } else if (e.key === 'Escape') {
        if (isFullscreen && !document.fullscreenElement) {
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [reset, enterFullscreen, setRunning, isFullscreen]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = 1 - seconds / (phaseMinutes * 60);
  const circumference = 2 * Math.PI * 45;

  const isCompleted = seconds === 0 && phase === 'work';
  const accent = isCompleted ? '#00FF87' : (phase === 'break' ? '#FF006E' : '#00FF87');

  const timerContent = (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 flex flex-col items-center justify-center min-h-screen bg-black px-6'
          : 'flex flex-col items-center min-h-[70vh] pt-4'
      }
    >
      {!isFullscreen && (
        <h1 className="text-4xl font-black tracking-tighter mb-8 self-start">
          <span style={{ color: '#00FF87', textShadow: '0 0 20px #00FF87' }}>FOCUS</span>
          <span style={{ color: '#fff' }}>.</span>
        </h1>
      )}

      {/* Project selector */}
      {!isFullscreen && (
        <div className="flex flex-wrap gap-2 mb-10 self-start">
          {isLoadingProjects ? (
            [...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-7 w-24 bg-primary/10 border border-[#222]" />
            ))
          ) : (
            projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(selectedProject?.id === p.id ? null : p)}
                className="px-3 py-1.5 text-[11px] font-mono font-bold tracking-wider transition-all"
                style={{
                  border: selectedProject?.id === p.id ? '1px solid #FF006E' : '1px solid #222',
                  color: selectedProject?.id === p.id ? '#000' : '#555',
                  background: selectedProject?.id === p.id ? '#FF006E' : 'transparent',
                  boxShadow: selectedProject?.id === p.id ? '3px 3px 0 #00FF87' : 'none',
                }}
              >
                {p.emoji} {p.title.toUpperCase()}
              </button>
            ))
          )}
        </div>
      )}

      {isFullscreen && selectedProject && (
        <div className="mb-6 font-mono text-xs tracking-widest" style={{ color: '#555' }}>
          {selectedProject.emoji} {selectedProject.title.toUpperCase()}
        </div>
      )}

      {/* Phase label */}
      <div className="mb-3 font-mono text-[10px] tracking-[0.3em]" style={{ color: accent }}>
        {isCompleted ? 'COMPLETE' : phase === 'work' ? 'FOCUS' : 'BREAK'}
      </div>

      {/* Timer ring */}
      <div
        className="relative mb-8"
        style={{ width: isFullscreen ? 360 : 220, height: isFullscreen ? 360 : 220 }}
      >
        <div
          className={`absolute inset-0 rounded-full ${isCompleted ? 'complete-glow' : ''}`}
          style={{
            boxShadow: isCompleted
              ? '0 0 40px #00FF87, 0 0 80px rgba(0, 255, 135, 0.4)'
              : running
                ? `0 0 40px ${accent}55, 0 0 80px ${accent}33`
                : 'none',
            transition: 'box-shadow 0.5s ease',
            borderRadius: '50%',
          }}
        />
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#111" strokeWidth="2" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={accent}
            strokeWidth="2"
            strokeLinecap="square"
            strokeDasharray={`${progress * circumference} ${circumference}`}
            style={{ filter: `drop-shadow(0 0 4px ${accent})`, transition: 'stroke-dasharray 1s linear' }}
          />
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
            const x1 = 50 + 42 * Math.cos(angle);
            const y1 = 50 + 42 * Math.sin(angle);
            const x2 = 50 + 39 * Math.cos(angle);
            const y2 = 50 + 39 * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={accent}
                strokeWidth="1"
                opacity="0.4"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono font-bold tabular-nums"
            style={{
              fontSize: isFullscreen ? '5.5rem' : '3rem',
              lineHeight: 1,
              color: isCompleted ? '#00FF87' : running ? accent : '#fff',
              textShadow: isCompleted 
                ? '0 0 20px #00FF87, 0 0 40px #00FF87' 
                : running 
                  ? `0 0 20px ${accent}, 0 0 40px ${accent}` 
                  : 'none',
              transition: 'all 0.3s',
            }}
          >
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
          <span
            className="text-[10px] font-mono tracking-widest mt-1"
            style={{ color: isCompleted ? '#00FF87' : '#333', textShadow: isCompleted ? '0 0 8px #00FF87' : 'none' }}
          >
            {isCompleted ? 'SUCCESS' : running ? 'RUNNING' : 'PAUSED'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={reset}
          aria-label="Reset timer"
          className="w-10 h-10 flex items-center justify-center border border-[#333] transition-all hover:border-[#00FF87] hover:text-[#00FF87]"
          style={{ color: '#444' }}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setRunning(!running)}
          aria-label={running ? 'Pause' : 'Start'}
          className="w-16 h-16 flex items-center justify-center font-bold transition-all"
          style={
            running
              ? {
                  background: 'transparent',
                  border: '2px solid #FF006E',
                  color: '#FF006E',
                  boxShadow: '0 0 20px rgba(255,0,110,0.4)',
                }
              : {
                  background: '#00FF87',
                  border: '2px solid #00FF87',
                  color: '#000',
                  boxShadow: '4px 4px 0 #FF006E',
                }
          }
        >
          {running ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>
        <button
          onClick={enterFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="w-10 h-10 flex items-center justify-center border border-[#333] transition-all hover:border-[#00FF87] hover:text-[#00FF87]"
          style={{ color: '#444' }}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Presets */}
      {!isFullscreen && (
        <>
          <div className="flex gap-2 mb-4">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setPreset(p);
                  setIsCustom(false);
                }}
                className="px-4 py-2 text-[11px] font-mono font-bold tracking-widest transition-all"
                style={
                  !isCustom && preset.label === p.label
                    ? {
                        background: '#00FF87',
                        color: '#000',
                        border: '1px solid #00FF87',
                        boxShadow: '3px 3px 0 #FF006E',
                      }
                    : { background: 'transparent', color: '#444', border: '1px solid #222' }
                }
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setIsCustom(true)}
              className="px-4 py-2 text-[11px] font-mono font-bold tracking-widest transition-all"
              style={
                isCustom
                  ? {
                      background: '#FF006E',
                      color: '#000',
                      border: '1px solid #FF006E',
                      boxShadow: '3px 3px 0 #00FF87',
                    }
                  : { background: 'transparent', color: '#444', border: '1px solid #222' }
              }
            >
              CUSTOM
            </button>
          </div>

          {isCustom && (
            <div className="flex items-center gap-3 mb-6">
              <input
                type="number"
                value={customWork}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setCustomWork('');
                  } else {
                    const parsed = parseInt(val, 10);
                    setCustomWork(isNaN(parsed) ? '' : Math.min(230, parsed));
                  }
                }}
                onBlur={() => {
                  const parsed = parseInt(customWork, 10);
                  if (isNaN(parsed) || parsed < 1) {
                    setCustomWork(1);
                  } else if (parsed > 230) {
                    setCustomWork(230);
                  }
                }}
                className="w-16 text-center text-sm font-mono bg-black py-2 outline-none"
                style={{ border: '1px solid #00FF87', color: '#00FF87', caretColor: '#00FF87' }}
                min="1"
                max="230"
              />
              <span className="text-[11px] font-mono" style={{ color: '#444' }}>
                MIN
              </span>
            </div>
          )}

          {/* Toggles */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <button
              onClick={() => setPomodoroEnabled((v) => !v)}
              className="px-3 py-2 text-[10px] font-mono font-bold tracking-widest transition-all"
              style={
                pomodoroEnabled
                  ? { background: '#00FF87', color: '#000', border: '1px solid #00FF87' }
                  : { background: 'transparent', color: '#444', border: '1px solid #222' }
              }
            >
              POMODORO
            </button>
            <button
              onClick={() => setSoundEnabled((v) => !v)}
              className="px-3 py-2 text-[10px] font-mono font-bold tracking-widest transition-all flex items-center gap-1.5"
              style={
                soundEnabled
                  ? { background: '#00FF87', color: '#000', border: '1px solid #00FF87' }
                  : { background: 'transparent', color: '#444', border: '1px solid #222' }
              }
            >
              {soundEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
              SOUND
            </button>
            <button
              onClick={requestNotificationPermission}
              className="px-3 py-2 text-[10px] font-mono font-bold tracking-widest transition-all"
              style={
                notificationsEnabled
                  ? { background: '#00FF87', color: '#000', border: '1px solid #00FF87' }
                  : { background: 'transparent', color: '#444', border: '1px solid #222' }
              }
            >
              NOTIFY
            </button>
          </div>

          {/* Today's stats */}
          <div className="flex gap-8 font-mono text-[10px] tracking-widest mb-4" style={{ color: '#555' }}>
            <div>
              SESSIONS TODAY{' '}
              <span style={{ color: '#00FF87' }}>{stats.count}</span>
            </div>
            <div>
              MINUTES{' '}
              <span style={{ color: '#00FF87' }}>{stats.minutes}</span>
            </div>
          </div>

          <div className="font-mono text-[9px] tracking-widest text-center" style={{ color: '#2a2a2a' }}>
            SPACE PAUSE · R RESET · F FULLSCREEN · ESC EXIT
          </div>
        </>
      )}

      {seconds === 0 && !running && phase === 'work' && (
        <div
          className="mt-8 px-6 py-3 font-mono font-bold text-sm tracking-widest"
          style={{
            border: '1px solid #00FF87',
            color: '#00FF87',
            boxShadow: '4px 4px 0 #FF006E',
            background: 'rgba(0,255,135,0.05)',
          }}
        >
          ✓ SESSION LOGGED
        </div>
      )}
    </div>
  );

  if (isFullscreen && !document.fullscreenElement) {
    return createPortal(timerContent, document.body);
  }

  return timerContent;
}
