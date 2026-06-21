import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabaseClient } from '@/api/supabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const FocusContext = createContext(null);

export const PRESETS = [
  { label: '25/5', work: 25, rest: 5 },
  { label: '50/10', work: 50, rest: 10 },
];

let sharedAudioContext = null;

const OFFLINE_QUEUE_KEY = 'studyos.focus.offline_queue.v1';

function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function unlockAudioContext() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!sharedAudioContext) {
      sharedAudioContext = new AC();
    }
    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {});
    }
  } catch (e) {
    console.warn("Failed to unlock AudioContext:", e);
  }
}

function playAlarm() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!sharedAudioContext) {
      sharedAudioContext = new AC();
    }
    const ctx = sharedAudioContext;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
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
    
    // If it was running when tab closed, load it as paused
    if (data.running) {
      return { ...data, running: false };
    }
    return data;
  } catch {
    return null;
  }
}

export function FocusProvider({ children }) {
  const initialSettings = useMemo(() => loadSettings(), []);
  const initialTimer = useMemo(() => loadTimerState(), []);

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
  
  const [offlineQueue, setOfflineQueue] = useState([]);

  useEffect(() => {
    setOfflineQueue(getOfflineQueue());
  }, []);

  const intervalRef = useRef(null);
  const targetEndTimeRef = useRef(null);
  const isFirstMount = useRef(true);
  const isSyncingRef = useRef(false);
  const queryClient = useQueryClient();

  const addToOfflineQueue = useCallback((sessionData) => {
    const session = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...sessionData,
    };
    const queue = getOfflineQueue();
    queue.push(session);
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn("Failed to save offline queue to localStorage:", e);
    }
    setOfflineQueue(queue);
  }, []);

  const removeFromOfflineQueue = useCallback((tempId) => {
    const queue = getOfflineQueue();
    const updated = queue.filter(s => s.id !== tempId);
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to remove from offline queue:", e);
    }
    setOfflineQueue(updated);
  }, []);

  const syncOfflineQueue = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      const queue = getOfflineQueue();
      if (queue.length === 0) return;

      console.log(`Attempting to sync ${queue.length} offline focus sessions...`);
      for (const session of queue) {
        try {
          const { id, ...dataToSync } = session;
          await supabaseClient.entities.FocusSession.create(dataToSync);
          removeFromOfflineQueue(session.id);
          queryClient.invalidateQueries({ queryKey: ['focus_sessions'] });
          queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
        } catch (err) {
          console.error("Failed to sync session, stopping offline queue sync:", err);
          break;
        }
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [removeFromOfflineQueue, queryClient]);

  // Sync on mount
  useEffect(() => {
    syncOfflineQueue();
  }, [syncOfflineQueue]);

  // Sync when online event triggers
  useEffect(() => {
    const handleOnline = () => {
      syncOfflineQueue();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncOfflineQueue]);

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

  const getLocalDateStr = (timestamp) => {
    const d = timestamp ? new Date(timestamp) : new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const today = getLocalDateStr();

  const logMutation = useMutation({
    mutationFn: (data) => supabaseClient.entities.FocusSession.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus_sessions', today] });
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
    },
  });

  const logFocusSession = useCallback((sessionData) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      addToOfflineQueue(sessionData);
      return;
    }

    logMutation.mutate(sessionData, {
      onError: (err) => {
        console.warn("Server sync failed, queueing session offline:", err);
        addToOfflineQueue(sessionData);
      }
    });
  }, [logMutation, addToOfflineQueue]);

  const reset = useCallback(() => {
    unlockAudioContext();
    if (phase === 'work' && seconds > 0) {
      const elapsedSeconds = workMinutes * 60 - seconds;
      const elapsedMinutes = Math.round(elapsedSeconds / 60);
      if (elapsedMinutes >= 1) {
        logFocusSession({
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
  }, [workMinutes, phase, seconds, selectedProject, isCustom, logFocusSession]);


  // When the phase or duration changes (e.g. preset change), reset the visible timer.
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setSeconds(phaseMinutes * 60);
  }, [phaseMinutes]);

  // Initialize targetEndTimeRef when running state changes
  useEffect(() => {
    if (running) {
      targetEndTimeRef.current = Date.now() + seconds * 1000;
    } else {
      targetEndTimeRef.current = null;
    }
  }, [running]);

  // Handle visibility changes to update seconds if the tab was suspended/throttled
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && running && targetEndTimeRef.current) {
        const remaining = Math.max(0, Math.round((targetEndTimeRef.current - Date.now()) / 1000));
        setSeconds(remaining);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [running]);

  const sessionLoggedRef = useRef(false);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return undefined;
    }

    // Reset log guard when a new work session starts and we are running
    if (phase === 'work' && seconds > 0) {
      sessionLoggedRef.current = false;
    }

    intervalRef.current = setInterval(() => {
      if (!targetEndTimeRef.current) return;

      const remaining = Math.max(0, Math.round((targetEndTimeRef.current - Date.now()) / 1000));
      setSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        if (soundEnabled) playAlarm();
        if (phase === 'work') {
          if (notificationsEnabled) {
            notify('Focus session complete', 'Great job! Time for a break.');
          }
          if (!sessionLoggedRef.current) {
            sessionLoggedRef.current = true;
            logFocusSession({
              project_id: selectedProject?.id || null,
              project_name: selectedProject?.title || 'Unassigned',
              duration_minutes: workMinutes,
              session_date: getLocalDateStr(),
              type: isCustom ? 'custom' : 'pomodoro',
            });
          }
          if (pomodoroEnabled) {
            setPhase('break');
            setSeconds(breakMinutes * 60);
            targetEndTimeRef.current = Date.now() + breakMinutes * 60 * 1000;
            return;
          }
          setRunning(false);
          return;
        }
        // break finished
        if (notificationsEnabled) notify('Break over', 'Back to focus.');
        setPhase('work');
        setRunning(false);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, phase, soundEnabled, notificationsEnabled, workMinutes, breakMinutes, pomodoroEnabled, selectedProject, isCustom, logMutation]);

  // Update document title with remaining time
  useEffect(() => {
    if (running) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      const phaseLabel = phase === 'work' ? 'FOCUS' : 'BREAK';
      document.title = `(${timeStr}) ${phaseLabel} | StudyOS`;
    } else {
      document.title = 'StudyOS';
    }
  }, [seconds, running, phase]);

  const toggleRunning = useCallback((valOrFunc) => {
    unlockAudioContext();
    setRunning((prev) => {
      const next = typeof valOrFunc === 'function' ? valOrFunc(prev) : valOrFunc;
      if (next && seconds <= 0) {
        return false;
      }
      return next;
    });
  }, [seconds]);

  const toggleSoundEnabled = useCallback((valOrFunc) => {
    unlockAudioContext();
    setSoundEnabled(valOrFunc);
  }, []);

  const handleSetPreset = useCallback((p) => {
    if (running && phase === 'work') {
      const elapsedSeconds = workMinutes * 60 - seconds;
      const elapsedMinutes = Math.round(elapsedSeconds / 60);
      if (elapsedMinutes >= 1) {
        logFocusSession({
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
    setPreset(p);
    setSeconds(p.work * 60);
  }, [running, phase, workMinutes, seconds, selectedProject, isCustom, logFocusSession]);

  const handleSetIsCustom = useCallback((val) => {
    if (running && phase === 'work') {
      const elapsedSeconds = workMinutes * 60 - seconds;
      const elapsedMinutes = Math.round(elapsedSeconds / 60);
      if (elapsedMinutes >= 1) {
        logFocusSession({
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
    setIsCustom(val);
    setSeconds(val ? customWork * 60 : preset.work * 60);
  }, [running, phase, workMinutes, seconds, selectedProject, isCustom, customWork, preset, logFocusSession]);

  return (
    <FocusContext.Provider
      value={{
        preset,
        setPreset: handleSetPreset,
        customWork,
        setCustomWork,
        isCustom,
        setIsCustom: handleSetIsCustom,
        seconds,
        setSeconds,
        running,
        setRunning: toggleRunning,
        selectedProject,
        setSelectedProject,
        phase,
        setPhase,
        pomodoroEnabled,
        setPomodoroEnabled,
        soundEnabled,
        setSoundEnabled: toggleSoundEnabled,
        notificationsEnabled,
        setNotificationsEnabled,
        reset,
        workMinutes,
        breakMinutes,
        phaseMinutes,
        logMutation,
        offlineQueue,
        logFocusSession,
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
