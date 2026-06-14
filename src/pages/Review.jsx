import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { calculateStreak } from '@/utils/habitUtils';
import { useFocus } from '@/hooks/FocusContext';

export default function Review() {
  const { offlineQueue = [] } = useFocus();
  const { data: sessions = [] } = useQuery({
    queryKey: ['focus-sessions'],
    queryFn: () => base44.entities.FocusSession.list('-session_date', 200),
  });

  const mergedSessions = useMemo(() => {
    return [...sessions, ...offlineQueue];
  }, [sessions, offlineQueue]);
  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: () => base44.entities.Habit.list(),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });
  const { data: allTasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  // Local timezone safe parsing of YYYY-MM-DD strings to local midnight
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  // Parse today string based on current local date
  const todayStr = `${todayMidnight.getFullYear()}-${String(todayMidnight.getMonth() + 1).padStart(2, '0')}-${String(todayMidnight.getDate()).padStart(2, '0')}`;
  const todaySessions = mergedSessions.filter(s => s.session_date === todayStr);
  const totalTodayMinutes = todaySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  const todayHoursByProject = {};
  todaySessions.forEach(s => {
    const name = s.project_name || 'Other';
    todayHoursByProject[name] = (todayHoursByProject[name] || 0) + (s.duration_minutes || 0);
  });

  const weekAgo = new Date(todayMidnight);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekSessions = mergedSessions.filter(s => parseLocalDate(s.session_date) >= weekAgo);
  const totalWeekMinutes = weekSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  const hoursByProject = {};
  weekSessions.forEach(s => {
    const name = s.project_name || 'Other';
    hoursByProject[name] = (hoursByProject[name] || 0) + (s.duration_minutes || 0);
  });

  const thirtyDaysAgo = new Date(todayMidnight);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sessionDates = new Set(
    mergedSessions.filter(s => parseLocalDate(s.session_date) >= thirtyDaysAgo).map(s => s.session_date)
  );
  const consistency = Math.min(100, Math.round((sessionDates.size / 30) * 100));

  const projectProgress = projects.map(p => {
    const tasks = allTasks.filter(t => t.project_id === p.id);
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    return { ...p, completed, total, progress: total > 0 ? Math.round((completed / total) * 100) : 0 };
  });

  const maxHours = Math.max(...Object.values(hoursByProject), 1);
  const maxTodayHours = Math.max(...Object.values(todayHoursByProject), 1);

  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter mb-8">
        <span style={{ color: '#fff' }}>RE</span>
        <span style={{ color: '#FF006E', textShadow: '0 0 20px #FF006E' }}>VIEW</span>
        <span style={{ color: '#fff' }}>.</span>
      </h1>

      {/* Daily Hours */}
      <section className="mb-8 p-4" style={{ border: '1px solid #00FF87', boxShadow: '4px 4px 0 #FF006E', background: 'rgba(0,255,135,0.03)' }}>
        <div className="text-[10px] font-mono tracking-widest mb-3" style={{ color: '#00FF87', opacity: 0.7 }}>▶ DAILY FOCUS HOURS</div>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-5xl font-mono font-bold tabular-nums" style={{ color: '#00FF87', textShadow: '0 0 20px rgba(0,255,135,0.5)' }}>
            {(totalTodayMinutes / 60).toFixed(1)}
          </span>
          <span className="text-[11px] font-mono pb-2" style={{ color: '#444' }}>HRS TODAY</span>
        </div>
        <div className="space-y-2">
          {Object.entries(todayHoursByProject).map(([name, mins]) => (
            <div key={name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono" style={{ color: '#888' }}>{name.toUpperCase()}</span>
                <span className="text-xs font-mono font-bold tabular-nums" style={{ color: '#00FF87' }}>{(mins / 60).toFixed(1)}H</span>
              </div>
              <div className="w-full h-1.5 bg-[#0a0a0a]">
                <div className="h-full transition-all" style={{ width: `${(mins / maxTodayHours) * 100}%`, background: '#00FF87', boxShadow: '0 0 6px #00FF87' }} />
              </div>
            </div>
          ))}
          {Object.keys(todayHoursByProject).length === 0 && (
            <div className="text-xs font-mono py-2" style={{ color: '#333' }}>{"// NO DATA TODAY"}</div>
          )}
        </div>
      </section>

      {/* Weekly Hours */}
      <section className="mb-8 p-4" style={{ border: '1px solid #00FF87', boxShadow: '4px 4px 0 #FF006E', background: 'rgba(0,255,135,0.03)' }}>
        <div className="text-[10px] font-mono tracking-widest mb-3" style={{ color: '#00FF87', opacity: 0.7 }}>▶ WEEKLY FOCUS HOURS</div>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-5xl font-mono font-bold tabular-nums" style={{ color: '#00FF87', textShadow: '0 0 20px rgba(0,255,135,0.5)' }}>
            {(totalWeekMinutes / 60).toFixed(1)}
          </span>
          <span className="text-[11px] font-mono pb-2" style={{ color: '#444' }}>HRS THIS WEEK</span>
        </div>
        <div className="space-y-2">
          {Object.entries(hoursByProject).map(([name, mins]) => (
            <div key={name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono" style={{ color: '#888' }}>{name.toUpperCase()}</span>
                <span className="text-xs font-mono font-bold tabular-nums" style={{ color: '#00FF87' }}>{(mins / 60).toFixed(1)}H</span>
              </div>
              <div className="w-full h-1.5 bg-[#0a0a0a]">
                <div className="h-full transition-all" style={{ width: `${(mins / (maxHours)) * 100}%`, background: '#00FF87', boxShadow: '0 0 6px #00FF87' }} />
              </div>
            </div>
          ))}
          {Object.keys(hoursByProject).length === 0 && (
            <div className="text-xs font-mono py-2" style={{ color: '#333' }}>{"// NO DATA THIS WEEK"}</div>
          )}
        </div>
      </section>

      {/* Consistency */}
      <section className="mb-8 p-4" style={{ border: '1px solid #FF006E', boxShadow: '4px 4px 0 rgba(0,255,135,0.3)', background: 'rgba(255,0,110,0.03)' }}>
        <div className="text-[10px] font-mono tracking-widest mb-3" style={{ color: '#FF006E', opacity: 0.7 }}>▶ CONSISTENCY (30D)</div>
        <div className="flex items-end gap-2">
          <span className="text-5xl font-mono font-bold tabular-nums" style={{ color: '#FF006E', textShadow: '0 0 20px rgba(255,0,110,0.5)' }}>
            {consistency}
          </span>
          <span className="text-2xl font-mono font-bold pb-1" style={{ color: '#FF006E' }}>%</span>
          <span className="text-[11px] font-mono pb-2 ml-2" style={{ color: '#888' }}>
            ({sessionDates.size} OF 30 DAYS ACTIVE)
          </span>
        </div>
      </section>

      {/* Streaks */}
      <section className="mb-8">
        <div className="text-[10px] font-mono tracking-widest mb-3" style={{ color: '#00FF87', opacity: 0.7 }}>▶ STREAKS</div>
        <div className="grid grid-cols-2 gap-2">
          {habits.map(h => {
            const currentStreak = calculateStreak(h.completed_dates || []);
            return (
              <div key={h.id} className="p-3" style={{ border: '1px solid #1a1a1a', background: '#030303' }}>
                <div className="text-xs font-mono mb-1" style={{ color: '#555' }}>{h.title.toUpperCase()}</div>
                <div className="text-2xl font-mono font-bold" style={{ color: '#00FF87', textShadow: '0 0 10px rgba(0,255,135,0.5)' }}>
                  {currentStreak}<span className="text-base">🔥</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Project Progress */}
      <section>
        <div className="text-[10px] font-mono tracking-widest mb-3" style={{ color: '#FF006E', opacity: 0.7 }}>▶ PROJECT PROGRESS</div>
        <div className="space-y-3">
          {projectProgress.map(p => (
            <div key={p.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold" style={{ color: '#888' }}>{p.emoji} {p.title.toUpperCase()}</span>
                <span className="text-xs font-mono font-bold tabular-nums" style={{ color: p.progress > 50 ? '#00FF87' : '#FF006E' }}>{p.progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#0a0a0a]" style={{ border: '1px solid #111' }}>
                <div className="h-full transition-all" style={{
                  width: `${p.progress}%`,
                  background: p.progress > 50 ? '#00FF87' : '#FF006E',
                  boxShadow: p.progress > 50 ? '0 0 8px #00FF87' : '0 0 8px #FF006E',
                }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}