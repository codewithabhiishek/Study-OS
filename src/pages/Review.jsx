import React, { useMemo, useState } from 'react';
import { supabaseClient } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { calculateStreak } from '@/utils/habitUtils';
import { useFocus } from '@/hooks/FocusContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Review() {
  const [timeframe, setTimeframe] = useState('daily'); // 'daily', 'weekly', or 'monthly'
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = last week, 2 = 2 weeks ago, etc.
  const { offlineQueue = [] } = useFocus();
  const { data: sessions = [] } = useQuery({
    queryKey: ['focus-sessions'],
    queryFn: () => supabaseClient.entities.FocusSession.list('-session_date'),
  });

  const mergedSessions = useMemo(() => {
    const serverIds = new Set(sessions.map(s => s.id));
    const unseenOffline = offlineQueue.filter(s => !serverIds.has(s.id));
    return [...sessions, ...unseenOffline];
  }, [sessions, offlineQueue]);
  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: () => supabaseClient.entities.Habit.list(),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => supabaseClient.entities.Project.list(),
  });
  const { data: allTasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => supabaseClient.entities.Task.list(),
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

  // Calculate start of current week (Monday at 00:00:00)
  const currentDay = todayMidnight.getDay();
  const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
  const startOfThisWeek = new Date(todayMidnight);
  startOfThisWeek.setDate(todayMidnight.getDate() - daysToSubtract);

  // Calculate start and end of active week based on offset
  const startOfActiveWeek = new Date(startOfThisWeek);
  startOfActiveWeek.setDate(startOfActiveWeek.getDate() - weekOffset * 7);

  const endOfActiveWeek = new Date(startOfActiveWeek);
  endOfActiveWeek.setDate(endOfActiveWeek.getDate() + 7);

  const weekSessions = mergedSessions.filter(s => {
    const sDate = parseLocalDate(s.session_date);
    return sDate >= startOfActiveWeek && sDate < endOfActiveWeek;
  });

  const formatWeekRange = (start) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    if (weekOffset === 0) return `THIS WEEK (${startStr} - ${endStr})`;
    if (weekOffset === 1) return `LAST WEEK (${startStr} - ${endStr})`;
    return `${weekOffset} WEEKS AGO (${startStr} - ${endStr})`;
  };
  const totalWeekMinutes = weekSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  const hoursByProject = {};
  weekSessions.forEach(s => {
    const name = s.project_name || 'Other';
    hoursByProject[name] = (hoursByProject[name] || 0) + (s.duration_minutes || 0);
  });

  const thirtyDaysAgo = new Date(todayMidnight);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // Covers today + last 29 days (exactly 30 days)
  const sessionDates = new Set(
    mergedSessions.filter(s => parseLocalDate(s.session_date) >= thirtyDaysAgo).map(s => s.session_date)
  );
  const consistency = Math.min(100, Math.round((sessionDates.size / 30) * 100));

  // Calculate study hours for the last 7 calendar days
  const last7DaysData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayMidnight);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dateLabel = d.getDate();
    
    const daySessions = mergedSessions.filter(s => s.session_date === dateStr);
    const dayMins = daySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const dayHours = dayMins / 60;
    
    last7DaysData.push({
      dateStr,
      dayLabel,
      dateLabel,
      hours: dayHours,
    });
  }
  const maxHoursInLast7Days = Math.max(...last7DaysData.map(d => d.hours), 1);

  // Calculate monthly study hours for the last 6 months
  const monthlyData = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthYearStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
    const monthName = d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
    
    const monthSessions = mergedSessions.filter(s => {
      const sDate = parseLocalDate(s.session_date);
      return sDate.getFullYear() === d.getFullYear() && sDate.getMonth() === d.getMonth();
    });
    
    const mins = monthSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const hours = mins / 60;
    
    monthlyData.push({
      label: monthName,
      shortLabel: monthYearStr,
      hours: hours,
    });
  }
  const maxMonthHours = Math.max(...monthlyData.map(m => m.hours), 1);

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

      {/* Focus Hours Breakdown */}
      <section className="mb-8 p-4" style={{ border: '1px solid #00FF87', boxShadow: '4px 4px 0 #FF006E', background: 'rgba(0,255,135,0.03)' }}>
        <div className="flex justify-between items-center mb-3">
          <div className="text-[10px] font-mono tracking-widest" style={{ color: '#00FF87', opacity: 0.7 }}>
            ▶ {timeframe === 'daily' ? 'DAILY FOCUS HOURS' : timeframe === 'weekly' ? (weekOffset === 0 ? 'WEEKLY FOCUS HOURS' : weekOffset === 1 ? 'LAST WEEK FOCUS HOURS' : 'FOCUS HOURS') : 'MONTHLY FOCUS HOURS'}
          </div>
          <div className="flex gap-1.5">
            <button 
              onClick={() => setTimeframe('daily')}
              className="text-[9px] font-mono px-2 py-0.5 border transition-all"
              style={{ 
                borderColor: timeframe === 'daily' ? '#00FF87' : '#222', 
                color: timeframe === 'daily' ? '#00FF87' : '#444',
                background: timeframe === 'daily' ? 'rgba(0,255,135,0.1)' : 'transparent',
                cursor: 'pointer'
              }}
            >
              DAILY
            </button>
            <button 
              onClick={() => setTimeframe('weekly')}
              className="text-[9px] font-mono px-2 py-0.5 border transition-all"
              style={{ 
                borderColor: timeframe === 'weekly' ? '#00FF87' : '#222', 
                color: timeframe === 'weekly' ? '#00FF87' : '#444',
                background: timeframe === 'weekly' ? 'rgba(0,255,135,0.1)' : 'transparent',
                cursor: 'pointer'
              }}
            >
              WEEKLY
            </button>
            <button 
              onClick={() => setTimeframe('monthly')}
              className="text-[9px] font-mono px-2 py-0.5 border transition-all"
              style={{ 
                borderColor: timeframe === 'monthly' ? '#00FF87' : '#222', 
                color: timeframe === 'monthly' ? '#00FF87' : '#444',
                background: timeframe === 'monthly' ? 'rgba(0,255,135,0.1)' : 'transparent',
                cursor: 'pointer'
              }}
            >
              MONTHLY
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between mb-4">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-mono font-bold tabular-nums" style={{ color: '#00FF87', textShadow: '0 0 20px rgba(0,255,135,0.5)' }}>
              {timeframe === 'daily' 
                ? (totalTodayMinutes / 60).toFixed(1) 
                : timeframe === 'weekly' 
                  ? (totalWeekMinutes / 60).toFixed(1) 
                  : (monthlyData[monthlyData.length - 1]?.hours || 0).toFixed(1)
              }
            </span>
            <span className="text-[11px] font-mono pb-2" style={{ color: '#444' }}>
              {timeframe === 'daily' 
                ? 'HRS TODAY' 
                : timeframe === 'weekly' 
                  ? (weekOffset === 0 ? 'HRS THIS WEEK' : weekOffset === 1 ? 'HRS LAST WEEK' : 'HRS THAT WEEK') 
                  : 'HRS THIS MONTH'
              }
            </span>
          </div>

          {/* Sub-toggle for Weekly view */}
          {timeframe === 'weekly' && (
            <div className="flex items-center gap-2 mb-1">
              <button 
                onClick={() => setWeekOffset(prev => prev + 1)}
                className="p-1 border transition-all"
                style={{ 
                  borderColor: '#00FF87',
                  color: '#00FF87', 
                  background: 'transparent',
                  cursor: 'pointer'
                }}
                title="Go back a week"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold tracking-wider text-center min-w-[180px]" style={{ color: '#fff' }}>
                {formatWeekRange(startOfActiveWeek)}
              </span>
              <button 
                onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                disabled={weekOffset === 0}
                className="p-1 border transition-all"
                style={{ 
                  borderColor: weekOffset === 0 ? '#111' : '#00FF87',
                  color: weekOffset === 0 ? '#222' : '#00FF87', 
                  background: 'transparent',
                  cursor: weekOffset === 0 ? 'not-allowed' : 'pointer' 
                }}
                title="Go forward a week"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {timeframe === 'daily' && (
            <>
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
            </>
          )}

          {timeframe === 'weekly' && (
            <>
              {Object.entries(hoursByProject).map(([name, mins]) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono" style={{ color: '#888' }}>{name.toUpperCase()}</span>
                    <span className="text-xs font-mono font-bold tabular-nums" style={{ color: '#00FF87' }}>{(mins / 60).toFixed(1)}H</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0a0a0a]">
                    <div className="h-full transition-all" style={{ width: `${(mins / maxHours) * 100}%`, background: '#00FF87', boxShadow: '0 0 6px #00FF87' }} />
                  </div>
                </div>
              ))}
              {Object.keys(hoursByProject).length === 0 && (
                <div className="text-xs font-mono py-2" style={{ color: '#333' }}>
                  {weekOffset === 0 ? "// NO DATA THIS WEEK" : weekOffset === 1 ? "// NO DATA LAST WEEK" : "// NO DATA FOR SELECTED WEEK"}
                </div>
              )}
            </>
          )}

          {timeframe === 'monthly' && (
            <>
              {monthlyData.map((m) => (
                <div key={m.shortLabel}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono" style={{ color: '#888' }}>{m.label}</span>
                    <span className="text-xs font-mono font-bold tabular-nums" style={{ color: '#00FF87' }}>{m.hours.toFixed(1)}H</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0a0a0a]">
                    <div className="h-full transition-all" style={{ 
                      width: `${(m.hours / maxMonthHours) * 100}%`, 
                      background: '#00FF87', 
                      boxShadow: m.hours > 0 ? '0 0 6px #00FF87' : 'none' 
                    }} />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* 7-Day Density Chart */}
      <section className="mb-8 p-4" style={{ border: '1px solid #FF006E', boxShadow: '4px 4px 0 #00FF87', background: 'rgba(255,0,110,0.03)' }}>
        <div className="text-[10px] font-mono tracking-widest mb-6" style={{ color: '#FF006E', opacity: 0.7 }}>▶ 7-DAY STUDY DENSITY</div>
        
        <div className="relative h-28 flex items-end justify-between px-2 mb-2">
          {/* Background Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ borderBottom: '1px dashed #1a1a1a' }}>
            <div className="w-full border-t border-dashed border-[#151515]" />
            <div className="w-full border-t border-dashed border-[#151515]" />
            <div className="w-full border-t border-dashed border-[#151515]" />
          </div>

          {/* Bars */}
          {last7DaysData.map((d) => {
            const pct = (d.hours / maxHoursInLast7Days) * 100;
            return (
              <div key={d.dateStr} className="group flex flex-col items-center flex-1 relative z-10 h-full justify-end">
                {/* Tooltip on Hover */}
                <div className="absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-[#00FF87] px-1.5 py-0.5 text-[9px] font-mono text-[#00FF87] pointer-events-none whitespace-nowrap shadow-md z-20">
                  {d.hours.toFixed(1)}H
                </div>
                
                {/* Bar */}
                <div 
                  className="w-4 sm:w-6 transition-all duration-500 ease-out" 
                  style={{ 
                    height: `${pct > 0 ? Math.max(pct, 4) : 0}%`, 
                    background: '#00FF87', 
                    boxShadow: d.hours > 0 ? '0 0 10px rgba(0, 255, 135, 0.5)' : 'none',
                    border: d.hours > 0 ? 'none' : '1px solid #1a1a1a'
                  }} 
                />
              </div>
            );
          })}
        </div>

        {/* Labels */}
        <div className="flex justify-between px-2">
          {last7DaysData.map((d) => (
            <div key={d.dateStr} className="flex flex-col items-center flex-1">
              <span className="text-[9px] font-mono font-bold" style={{ color: d.hours > 0 ? '#fff' : '#444' }}>{d.dayLabel}</span>
              <span className="text-[8px] font-mono" style={{ color: d.hours > 0 ? '#00FF87' : '#222' }}>{d.dateLabel}</span>
            </div>
          ))}
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