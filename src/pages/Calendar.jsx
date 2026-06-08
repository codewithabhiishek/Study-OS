import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday } from 'date-fns';

// Live countdown hook
function useCountdown(targetDate) {
  const [t, setT] = useState({});
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) return setT({ expired: true });
      setT({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return t;
}

function CountdownRow({ item }) {
  const t = useCountdown(item.date);
  const pad = n => String(n ?? 0).padStart(2, '0');
  const isUrgent = t.days !== undefined && t.days <= 30;

  return (
    <div className="flex items-center justify-between px-3 py-2.5 mb-1.5 transition-all"
      style={{
        border: `1px solid ${isUrgent ? '#FF006E' : '#1a1a1a'}`,
        background: isUrgent ? 'rgba(255,0,110,0.05)' : 'rgba(0,255,135,0.02)',
      }}>
      <div>
        <div className="text-xs font-mono font-bold" style={{ color: isUrgent ? '#FF006E' : '#00FF87' }}>
          {item.title}
        </div>
        <div className="text-[10px] font-mono" style={{ color: '#444' }}>
          {format(new Date(item.date), 'MMM d, yyyy')}
        </div>
      </div>
      <div className="text-right">
        {t.expired ? (
          <span className="text-xs font-mono" style={{ color: '#555' }}>ELAPSED</span>
        ) : (
          <div className="flex items-center gap-2">
            {[{ v: t.days, l: 'D' }, { v: t.hours, l: 'H' }, { v: t.minutes, l: 'M' }, { v: t.seconds, l: 'S' }].map(({ v, l }) => (
              <div key={l} className="text-center min-w-[28px]">
                <div className="text-base font-mono font-bold tabular-nums leading-none"
                  style={{ color: isUrgent ? '#FF006E' : '#00FF87', textShadow: isUrgent ? '0 0 8px #FF006E' : '0 0 6px #00FF87' }}>
                  {pad(v)}
                </div>
                <div className="text-[8px] font-mono" style={{ color: '#444' }}>{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Calendar() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [adding, setAdding] = useState(false);
  const [newDeadline, setNewDeadline] = useState({ title: '', date: '' });

  const { data: deadlines = [] } = useQuery({
    queryKey: ['deadlines'],
    queryFn: async () => {
      const all = await base44.entities.Deadline.list('date', 50);
      return all.filter(d => d.category !== 'mission');
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('due_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Deadline.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      setNewDeadline({ title: '', date: '' });
      setAdding(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Deadline.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deadlines'] }),
  });

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startPad = (startOfMonth(currentMonth).getDay() + 6) % 7; // Mon start

  // Group deadlines/tasks by date
  const eventsByDate = {};
  deadlines.forEach(d => {
    const k = d.date;
    if (!eventsByDate[k]) eventsByDate[k] = [];
    eventsByDate[k].push({ ...d, type: 'deadline' });
  });
  tasks.filter(t => t.due_date).forEach(t => {
    const k = t.due_date;
    if (!eventsByDate[k]) eventsByDate[k] = [];
    eventsByDate[k].push({ ...t, type: 'task' });
  });

  const upcomingDeadlines = [...deadlines]
    .filter(d => new Date(d.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar Grid */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black tracking-tighter" style={{ color: '#00FF87', textShadow: '0 0 15px #00FF87' }}>
            CALENDAR
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 border border-[#00FF87] hover:bg-[#00FF87] hover:text-black transition-all"
              style={{ color: '#00FF87' }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-sm tracking-widest" style={{ color: '#fff' }}>
              {format(currentMonth, 'MMM yyyy').toUpperCase()}
            </span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 border border-[#00FF87] hover:bg-[#00FF87] hover:text-black transition-all"
              style={{ color: '#00FF87' }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
            <div key={d} className="text-center text-[10px] font-mono py-1.5" style={{ color: '#333' }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px" style={{ background: '#111' }}>
          {Array(startPad).fill(null).map((_, i) => (
            <div key={`pad-${i}`} className="h-16 bg-black" />
          ))}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const events = eventsByDate[key] || [];
            const today = isToday(day);
            const inMonth = isSameMonth(day, currentMonth);

            return (
              <div key={key} className="h-16 bg-black p-1 relative overflow-hidden transition-all hover:bg-[rgba(0,255,135,0.03)]"
                style={{
                  border: today ? '1px solid #00FF87' : '1px solid transparent',
                  boxShadow: today ? '0 0 8px rgba(0,255,135,0.3)' : 'none',
                }}>
                <div className="text-[11px] font-mono font-bold leading-none mb-0.5"
                  style={{ color: today ? '#00FF87' : inMonth ? '#555' : '#222' }}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-px">
                  {events.slice(0, 2).map((e, i) => (
                    <div key={i} className="truncate text-[8px] font-mono px-0.5"
                      style={{
                        background: e.type === 'deadline' ? 'rgba(255,0,110,0.3)' : 'rgba(0,255,135,0.15)',
                        color: e.type === 'deadline' ? '#FF006E' : '#00FF87',
                      }}>
                      {e.title}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div className="text-[8px] font-mono" style={{ color: '#444' }}>+{events.length - 2}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2" style={{ background: 'rgba(255,0,110,0.5)' }} />
            <span className="text-[10px] font-mono" style={{ color: '#555' }}>DEADLINE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2" style={{ background: 'rgba(0,255,135,0.3)' }} />
            <span className="text-[10px] font-mono" style={{ color: '#555' }}>TASK</span>
          </div>
        </div>
      </div>

      {/* Countdown Panel */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: '#FF006E' }} />
            <span className="text-[11px] font-mono font-bold tracking-widest" style={{ color: '#FF006E' }}>
              LIVE COUNTDOWNS
            </span>
          </div>
          <button
            onClick={() => setAdding(!adding)}
            className="w-6 h-6 flex items-center justify-center border border-[#FF006E] transition-all hover:bg-[#FF006E] hover:text-black"
            style={{ color: '#FF006E' }}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {adding && (
          <form onSubmit={e => { e.preventDefault(); if (newDeadline.title && newDeadline.date) createMutation.mutate(newDeadline); }}
            className="mb-3 p-3 space-y-2"
            style={{ border: '1px solid #FF006E', background: 'rgba(255,0,110,0.05)' }}>
            <input
              value={newDeadline.title}
              onChange={e => setNewDeadline(p => ({ ...p, title: e.target.value }))}
              placeholder="// DEADLINE TITLE..."
              className="w-full px-2 py-1.5 text-xs font-mono bg-black outline-none"
              style={{ border: '1px solid #333', color: '#FF006E', caretColor: '#FF006E' }}
              autoFocus
            />
            <input
              type="date"
              value={newDeadline.date}
              onChange={e => setNewDeadline(p => ({ ...p, date: e.target.value }))}
              className="w-full px-2 py-1.5 text-xs font-mono bg-black outline-none"
              style={{ border: '1px solid #333', color: '#FF006E', colorScheme: 'dark' }}
            />
            <button type="submit" className="w-full py-1.5 text-xs font-mono font-bold btn-neon-magenta">
              ADD DEADLINE
            </button>
          </form>
        )}

        <div className="space-y-0">
          {upcomingDeadlines.length === 0 ? (
            <div className="px-3 py-6 text-center text-[11px] font-mono" style={{ color: '#333', border: '1px solid #111' }}>
              // NO UPCOMING DEADLINES
            </div>
          ) : (
            upcomingDeadlines.map((d) => (
              <div key={d.id} className="group relative">
                <CountdownRow item={d} />
                <button
                  onClick={() => deleteMutation.mutate(d.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
                  style={{ color: '#FF006E' }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Past deadlines */}
        {deadlines.filter(d => new Date(d.date) < new Date()).length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] font-mono tracking-widest mb-2" style={{ color: '#333' }}>// ELAPSED</div>
            {deadlines.filter(d => new Date(d.date) < new Date()).map(d => (
              <div key={d.id} className="flex items-center justify-between px-3 py-2 mb-1 group"
                style={{ border: '1px solid #1a1a1a' }}>
                <span className="text-[11px] font-mono line-through" style={{ color: '#333' }}>{d.title}</span>
                <button onClick={() => deleteMutation.mutate(d.id)}
                  className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
                  style={{ color: '#FF006E' }}>
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}