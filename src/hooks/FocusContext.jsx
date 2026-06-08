import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const FocusContext = createContext(null);

export const PRESETS = [
  { label: '25/5', work: 25, rest: 5 },
  { label: '50/10', work: 50, rest: 10 },
];

function playAlarm() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const beep = (freq, start, dur) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur + 0.02);
    };
    beep(880, 0, 0.18);
    beep(1175, 0.22, 0.18);
    beep(1568, 0.44, 0.32);
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {
    // ignore
  }
}

function notify(title, body) {
  try {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      // eslint-disable-next-line no-new
      new Notification(title, { body });
    }
  } catch {
    // ignore
  }
}

const SETTINGS_KEY = 'studyos.focus.settings.v1';

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function FocusProvider({ children }) {
  const initial = loadSettings();
  const [preset, setPreset] = useState(PRESETS[0]);
  const [customWork, setCustomWork] = useState(30);
  const [isCustom, setIsCustom] = useState(false);
  const [seconds, setSeconds] = useState(PRESETS[0].work * 60);
  const [running, setRunning] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [phase, setPhase] = useState('work'); // 'work' | 'break'
  const [pomodoroEnabled, setPomodoroEnabled] = useState(initial?.pomodoroEnabled ?? false);
  const [soundEnabled, setSoundEnabled] = useState(initial?.soundEnabled ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(initial?.notificationsEnabled ?? false);
  const intervalRef = useRef(null);
  const queryClient = useQueryClient();

  const workMinutes = isCustom ? customWork : preset.work;
  const breakMinutes = isCustom ? Math.max(1, Math.round(customWork / 5)) : preset.rest;
  const phaseMinutes = phase === 'work' ? workMinutes : breakMinutes;

  // Persist user settings
  useEffect(() => {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ pomodoroEnabled, soundEnabled, notificationsEnabled })
      );
    } catch {
      // ignore
    }
  }, [pomodoroEnabled, soundEnabled, notificationsEnabled]);

  const today = new Date().toISOString().split('T')[0];

  const logMutation = useMutation({
    mutationFn: (data) => base44.entities.FocusSession.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus_sessions', today] });
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
    },
  });

  const reset = useCallback(() => {
    if (phase === 'work') {
      const elapsedSeconds = workMinutes * 60 - seconds;
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      if (elapsedMinutes >= 1) {
        logMutation.mutate({
          project_id: selectedProject?.id || null,
          project_name: selectedProject?.title || 'Unassigned',
          duration_minutes: elapsedMinutes,
          session_date: new Date().toISOString().split('T')[0],
          type: isCustom ? 'custom' : 'pomodoro',
        });
      }
    }
    setRunning(false);
    setPhase('work');
    setSeconds(workMinutes * 60);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [workMinutes, phase, seconds, selectedProject, isCustom, logMutation]);

  // When the phase or duration changes (e.g. preset change), reset the visible timer.
  useEffect(() => {
    setSeconds(phaseMinutes * 60);
  }, [phaseMinutes]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return undefined;
    }
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s > 1) return s - 1;
        // Tick reached zero — handle phase completion.
        clearInterval(intervalRef.current);
        if (soundEnabled) playAlarm();
        if (phase === 'work') {
          if (notificationsEnabled) {
            notify('Focus session complete', 'Great job! Time for a break.');
          }
          logMutation.mutate({
            project_id: selectedProject?.id || null,
            project_name: selectedProject?.title || 'Unassigned',
            duration_minutes: workMinutes,
            session_date: new Date().toISOString().split('T')[0],
            type: isCustom ? 'custom' : 'pomodoro',
          });
          if (pomodoroEnabled) {
            setPhase('break');
            setSeconds(breakMinutes * 60);
            // keep running through the break
            return breakMinutes * 60;
          }
          setRunning(false);
          return 0;
        }
        // break finished
        if (notificationsEnabled) notify('Break over', 'Back to focus.');
        setPhase('work');
        setRunning(false);
        return workMinutes * 60;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, phase, soundEnabled, notificationsEnabled, workMinutes, breakMinutes, pomodoroEnabled, selectedProject, isCustom, logMutation]);

  return (
    <FocusContext.Provider
      value={{
        preset,
        setPreset,
        customWork,
        setCustomWork,
        isCustom,
        setIsCustom,
        seconds,
        setSeconds,
        running,
        setRunning,
        selectedProject,
        setSelectedProject,
        phase,
        setPhase,
        pomodoroEnabled,
        setPomodoroEnabled,
        soundEnabled,
        setSoundEnabled,
        notificationsEnabled,
        setNotificationsEnabled,
        reset,
        workMinutes,
        breakMinutes,
        phaseMinutes,
        logMutation,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
}
