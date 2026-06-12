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
const TIMER_STATE_KEY = 'studyos.focus.timer.v1';

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadTimerState() {
  try {
    const raw = localStorage.getItem(TIMER_STATE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    
    // If it was running when tab closed, subtract elapsed time
    if (data.running && data.targetEndTime) {
      const remaining = Math.round((data.targetEndTime - Date.now()) / 1000);
      if (remaining > 0) {
        return { ...data, seconds: remaining };
      } else {
        return { ...data, seconds: 0, running: false, completedWhileAway: data.phase === 'work' };
      }
    }
    return data;
  } catch {
    return null;
  }
}

export function FocusProvider({ children }) {
  const initialSettings = loadSettings();
  const initialTimer = loadTimerState();

  const [preset, setPreset] = useState(() => {
    if (initialTimer?.presetLabel) {
      const match = PRESETS.find(p => p.label === initialTimer.presetLabel);
      if (match) return match;
    }
    return PRESETS[0];
  });
  const [customWork, setCustomWork] = useState(initialTimer?.customWork ?? 30);
  const [isCustom, setIsCustom] = useState(initialTimer?.isCustom ?? false);
  const [seconds, setSeconds] = useState(() => {
    if (initialTimer) return initialTimer.seconds;
    return PRESETS[0].work * 60;
  });
  const [running, setRunning] = useState(initialTimer?.running ?? false);
  const [selectedProject, setSelectedProject] = useState(initialTimer?.selectedProject ?? null);
  const [phase, setPhase] = useState(initialTimer?.phase ?? 'work');
  
  const [pomodoroEnabled, setPomodoroEnabled] = useState(initialSettings?.pomodoroEnabled ?? false);
  const [soundEnabled, setSoundEnabled] = useState(initialSettings?.soundEnabled ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialSettings?.notificationsEnabled ?? false);
  
  const intervalRef = useRef(null);
  const isFirstMount = useRef(true);
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

  // Persist current timer state
  useEffect(() => {
    try {
      const targetEndTime = running ? Date.now() + seconds * 1000 : null;
      localStorage.setItem(TIMER_STATE_KEY, JSON.stringify({
        seconds,
        running,
        phase,
        targetEndTime,
        isCustom,
        customWork,
        presetLabel: preset.label,
        selectedProject,
      }));
    } catch {
      // ignore
    }
  }, [seconds, running, phase, isCustom, customWork, preset, selectedProject]);

  const getLocalDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const today = getLocalDateStr();

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
          session_date: getLocalDateStr(),
          type: isCustom ? 'custom' : 'pomodoro',
        });
      }
    }
    setRunning(false);
    setPhase('work');
    setSeconds(workMinutes * 60);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [workMinutes, phase, seconds, selectedProject, isCustom, logMutation]);

  // Handle logging for focus sessions completed while tab was closed
  useEffect(() => {
    if (initialTimer?.completedWhileAway) {
      const duration = initialTimer.isCustom
        ? initialTimer.customWork
        : (PRESETS.find((p) => p.label === initialTimer.presetLabel)?.work || 25);
      logMutation.mutate({
        project_id: initialTimer.selectedProject?.id || null,
        project_name: initialTimer.selectedProject?.title || 'Unassigned',
        duration_minutes: duration,
        session_date: getLocalDateStr(),
        type: initialTimer.isCustom ? 'custom' : 'pomodoro',
      });
      // Clear flag to avoid double-triggering
      try {
        localStorage.setItem(
          TIMER_STATE_KEY,
          JSON.stringify({
            ...initialTimer,
            completedWhileAway: false,
          })
        );
      } catch {
        // ignore
      }
    }
  }, [logMutation]);

  // When the phase or duration changes (e.g. preset change), reset the visible timer.
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
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
            session_date: getLocalDateStr(),
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
