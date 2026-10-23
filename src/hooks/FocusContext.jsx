import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabaseClient } from '@/api/supabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';

const FocusContext = createContext(null);

export const DIRECT_PRESETS = [
  { label: '30 MIN', work: 30, rest: 6 },
  { label: '60 MIN', work: 60, rest: 12 },
];

export const POMODORO_PRESETS = [
  { label: '25/5', work: 25, rest: 5 },
  { label: '50/10', work: 50, rest: 10 },
];

let sharedAudioContext = null;

import {
  OFFLINE_QUEUE_KEY,
  SETTINGS_KEY,
  TIMER_STATE_KEY,
  getScopedKey,
} from '@/utils/storageUtils';

function getOfflineQueue(userId) {
  try {
    const raw = localStorage.getItem(getScopedKey(OFFLINE_QUEUE_KEY, userId));
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
      new Notification(title, { body });
    }
  } catch {
    // ignore
  }
}

function loadSettings(userId) {
  try {
    const raw = localStorage.getItem(getScopedKey(SETTINGS_KEY, userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadTimerState(userId) {
  try {
    const raw = localStorage.getItem(getScopedKey(TIMER_STATE_KEY, userId));
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
  const { user } = useAuth();
  const userId = user?.id || null;

  const initialSettings = useMemo(() => loadSettings(userId), [userId]);
  const initialTimer = useMemo(() => loadTimerState(userId), [userId]);

  const [preset, setPreset] = useState(() => {
    const currentPresets = (initialSettings?.pomodoroEnabled ?? false) ? POMODORO_PRESETS : DIRECT_PRESETS;
    if (initialTimer?.presetLabel) {
      const match = currentPresets.find(p => p.label === initialTimer.presetLabel) ||
                    POMODORO_PRESETS.find(p => p.label === initialTimer.presetLabel) ||
                    DIRECT_PRESETS.find(p => p.label === initialTimer.presetLabel);
      if (match) return match;
    }
    return currentPresets[0];
  });
  const [customWork, setCustomWork] = useState(() => {
    const saved = initialTimer?.customWork;
    if (saved === undefined || saved === null || saved === '') return 30;
    const parsed = parseInt(saved, 10);
    return isNaN(parsed) || parsed < 1 ? 30 : Math.min(230, parsed);
  });
  const [isCustom, setIsCustom] = useState(initialTimer?.isCustom ?? false);
  const [seconds, setSeconds] = useState(() => {
    if (initialTimer) return initialTimer.seconds;
    const currentPresets = (initialSettings?.pomodoroEnabled ?? false) ? POMODORO_PRESETS : DIRECT_PRESETS;
    return currentPresets[0].work * 60;
  });
  const [running, setRunning] = useState(initialTimer?.running ?? false);
  const [selectedProject, setSelectedProject] = useState(initialTimer?.selectedProject ?? null);
  const [phase, setPhase] = useState(initialTimer?.phase ?? 'work');
  
  const [pomodoroEnabled, setPomodoroEnabled] = useState(initialSettings?.pomodoroEnabled ?? false);
  const presets = useMemo(() => {
    return pomodoroEnabled ? POMODORO_PRESETS : DIRECT_PRESETS;
  }, [pomodoroEnabled]);
  const [soundEnabled, setSoundEnabled] = useState(initialSettings?.soundEnabled ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialSettings?.notificationsEnabled ?? false);
  
  const [offlineQueue, setOfflineQueue] = useState([]);

  useEffect(() => {
    setOfflineQueue(getOfflineQueue(userId));
  }, [userId]);

  // Handle switching users on shared computers
  const prevUserIdRef = useRef(userId);
  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      prevUserIdRef.current = userId;
      const userSettings = loadSettings(userId);
      const userTimer = loadTimerState(userId);
      setPomodoroEnabled(userSettings?.pomodoroEnabled ?? false);
      setSoundEnabled(userSettings?.soundEnabled ?? true);
      setNotificationsEnabled(userSettings?.notificationsEnabled ?? false);
      setOfflineQueue(getOfflineQueue(userId));

      const currentPresets = (userSettings?.pomodoroEnabled ?? false) ? POMODORO_PRESETS : DIRECT_PRESETS;
      let matchedPreset = currentPresets[0];
      if (userTimer?.presetLabel) {
        matchedPreset = currentPresets.find(p => p.label === userTimer.presetLabel) ||
                        POMODORO_PRESETS.find(p => p.label === userTimer.presetLabel) ||
                        DIRECT_PRESETS.find(p => p.label === userTimer.presetLabel) ||
                        currentPresets[0];
      }
      setPreset(matchedPreset);
      setCustomWork(userTimer?.customWork ?? 30);
      setIsCustom(userTimer?.isCustom ?? false);
      setSeconds(userTimer ? userTimer.seconds : matchedPreset.work * 60);
      setRunning(false);
      setSelectedProject(userTimer?.selectedProject ?? null);
      setPhase(userTimer?.phase ?? 'work');
    }
  }, [userId]);

  const intervalRef = useRef(null);
  const targetEndTimeRef = useRef(null);
  const isFirstMount = useRef(true);
  const isSyncingRef = useRef(false);
  const secondsRef = useRef(seconds);
  secondsRef.current = seconds;
  const queryClient = useQueryClient();

  const addToOfflineQueue = useCallback((sessionData) => {
    const session = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      ...sessionData,
    };
    const queue = getOfflineQueue(userId);
    queue.push(session);
    try {
      localStorage.setItem(getScopedKey(OFFLINE_QUEUE_KEY, userId), JSON.stringify(queue));
    } catch (e) {
      console.warn("Failed to save offline queue to localStorage:", e);
    }
    setOfflineQueue(queue);
  }, [userId]);

  const removeFromOfflineQueue = useCallback((tempId) => {
    const queue = getOfflineQueue(userId);
    const updated = queue.filter(s => s.id !== tempId);
    try {
      localStorage.setItem(getScopedKey(OFFLINE_QUEUE_KEY, userId), JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to remove from offline queue:", e);
    }
    setOfflineQueue(updated);
  }, [userId]);

  const syncOfflineQueue = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      const queue = getOfflineQueue(userId);
      if (queue.length === 0) return;

      console.log(`Attempting to sync ${queue.length} offline focus sessions...`);
      for (const session of queue) {
        try {
          const { id: _id, ...dataToSync } = session;
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
  }, [userId, removeFromOfflineQueue, queryClient]);

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

  const workMinutes = isCustom ? Math.min(230, parseInt(customWork, 10) || 1) : preset.work;
  const breakMinutes = isCustom ? Math.max(1, Math.round(workMinutes / 5)) : preset.rest;
  const phaseMinutes = phase === 'work' ? workMinutes : breakMinutes;

  // Persist user settings
  useEffect(() => {
    try {
      localStorage.setItem(
        getScopedKey(SETTINGS_KEY, userId),
        JSON.stringify({ pomodoroEnabled, soundEnabled, notificationsEnabled })
      );
    } catch {
      // ignore
    }
  }, [userId, pomodoroEnabled, soundEnabled, notificationsEnabled]);

  // Update preset when pomodoroEnabled changes
  const prevPomodoroEnabledRef = useRef(pomodoroEnabled);
  useEffect(() => {
    if (prevPomodoroEnabledRef.current !== pomodoroEnabled) {
      const oldPresets = prevPomodoroEnabledRef.current ? POMODORO_PRESETS : DIRECT_PRESETS;
      const currentPresets = pomodoroEnabled ? POMODORO_PRESETS : DIRECT_PRESETS;
      
      const index = oldPresets.findIndex(p => p.label === preset.label);
      const targetIndex = index !== -1 ? index : 0;
      const newPreset = currentPresets[targetIndex];
      
      setPreset(newPreset);
      if (!running && !isCustom) {
        setSeconds(newPreset.work * 60);
      }
      prevPomodoroEnabledRef.current = pomodoroEnabled;
    }
  }, [pomodoroEnabled, preset.label, running, isCustom]);

  // Persist current timer state
  useEffect(() => {
    try {
      const targetEndTime = running ? Date.now() + seconds * 1000 : null;
      localStorage.setItem(getScopedKey(TIMER_STATE_KEY, userId), JSON.stringify({
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
  }, [userId, seconds, running, phase, isCustom, customWork, preset, selectedProject]);

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
          session_date: getLocalDateStr(Date.now() - elapsedSeconds * 1000),
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
      targetEndTimeRef.current = Date.now() + secondsRef.current * 1000;
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
    if (phase === 'work' && secondsRef.current > 0) {
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
              session_date: getLocalDateStr(Date.now() - workMinutes * 60 * 1000),
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
  }, [running, phase, soundEnabled, notificationsEnabled, workMinutes, breakMinutes, pomodoroEnabled, selectedProject, isCustom, logFocusSession]);

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
    const next = typeof valOrFunc === 'function' ? valOrFunc(running) : valOrFunc;
    if (next) {
      const parsed = parseInt(customWork, 10);
      if (isNaN(parsed) || parsed < 1) {
        setCustomWork(1);
      } else if (parsed > 230) {
        setCustomWork(230);
      }
    }
    setRunning((prev) => {
      const n = typeof valOrFunc === 'function' ? valOrFunc(prev) : valOrFunc;
      if (n && seconds <= 0) {
        return false;
      }
      return n;
    });
  }, [running, customWork, seconds]);

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
          session_date: getLocalDateStr(Date.now() - elapsedSeconds * 1000),
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
          session_date: getLocalDateStr(Date.now() - elapsedSeconds * 1000),
          type: isCustom ? 'custom' : 'pomodoro',
        });
      }
    }
    
    let resolvedCustomWork = 30;
    if (val) {
      const parsed = parseInt(customWork, 10);
      if (isNaN(parsed) || parsed < 1) {
        setCustomWork(1);
        resolvedCustomWork = 1;
      } else if (parsed > 230) {
        setCustomWork(230);
        resolvedCustomWork = 230;
      } else {
        resolvedCustomWork = parsed;
      }
    }

    setRunning(false);
    setPhase('work');
    setIsCustom(val);
    setSeconds(val ? resolvedCustomWork * 60 : preset.work * 60);
  }, [running, phase, workMinutes, seconds, selectedProject, isCustom, customWork, preset, logFocusSession]);

  return (
    <FocusContext.Provider
      value={{
        presets,
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
