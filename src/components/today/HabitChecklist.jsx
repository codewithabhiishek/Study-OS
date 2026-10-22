import React, { useState, useEffect } from 'react';
import { supabaseClient } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Pencil, Trash2 } from 'lucide-react';
import { calculateStreak } from '@/utils/habitUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { triggerHaptic } from '@/utils/security';

function InlineHabitEdit({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  // Sync local val when external value prop changes (e.g. after a server update)
  useEffect(() => {
    if (!editing) setVal(value);
  }, [value, editing]);

  const commit = () => { if (val.trim() && val.trim() !== value) onSave(val.trim()); setEditing(false); };

  if (editing) return (
    <input
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      className="bg-transparent outline-none border-b text-xs font-mono flex-1 w-full"
      style={{ borderColor: '#FF006E', color: '#FF006E', caretColor: '#FF006E' }}
      autoFocus
      onClick={e => e.stopPropagation()}
    />
  );

  return (
    <span
      className="text-xs font-mono flex-1 cursor-text inline-flex items-center gap-1 group/text"
      onDoubleClick={e => { e.stopPropagation(); setVal(value); setEditing(true); }}
    >
      <span>{value}</span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setVal(value); setEditing(true); }}
        className="inline-flex items-center justify-center p-1 text-[#FF006E] opacity-60 md:opacity-0 md:group-hover/text:opacity-40 hover:!opacity-100 touch-target cursor-pointer"
        title="Edit habit"
      >
        <Pencil className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

export default function HabitChecklist() {
  const queryClient = useQueryClient();
  const localNow = new Date();
  const today = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, '0')}-${String(localNow.getDate()).padStart(2, '0')}`;
  const [adding, setAdding] = useState(false);
  const [newHabit, setNewHabit] = useState('');

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: () => supabaseClient.entities.Habit.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: (habit) => {
      const dates = habit.completed_dates || [];
      const done = dates.includes(today);
      const newDates = done ? dates.filter(d => d !== today) : [...dates, today];
      const newStreak = calculateStreak(newDates);
      return supabaseClient.entities.Habit.update(habit.id, { completed_dates: newDates, streak: newStreak });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }) => supabaseClient.entities.Habit.update(id, { title }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => supabaseClient.entities.Habit.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const createMutation = useMutation({
    mutationFn: (title) => supabaseClient.entities.Habit.create({ title, streak: 0, completed_dates: [] }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['habits'] }); setNewHabit(''); setAdding(false); },
  });

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-mono font-bold tracking-widest" style={{ color: '#FF006E' }}>
            ▶ HABITS
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2.5 border border-[#FF006E]/20"
              style={{ background: 'transparent' }}
            >
              <Skeleton className="w-4 h-4 bg-[#FF006E]/15 flex-shrink-0" />
              <Skeleton className="h-3.5 bg-[#FF006E]/10 flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-mono font-bold tracking-widest" style={{ color: '#FF006E' }}>
          ▶ HABITS
        </div>
        <button
          type="button"
          onClick={() => { triggerHaptic(10); setAdding(!adding); }}
          className="min-w-[32px] min-h-[32px] flex items-center justify-center border border-[#FF006E] text-[#FF006E] transition-all hover:bg-[#FF006E] hover:text-black active:scale-95 touch-target cursor-pointer"
          title={adding ? "Close" : "Add habit"}
          aria-label={adding ? "Close habit form" : "Add habit"}
        >
          <Plus className="w-4 h-4 transition-colors" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {habits.map((habit) => {
          const done = (habit.completed_dates || []).includes(today);
          const currentStreak = calculateStreak(habit.completed_dates || []);
          return (
            <div
              key={habit.id}
              className="flex items-center gap-2 px-3 py-2 text-left transition-all group relative glass-panel-magenta glass-card-interactive-magenta"
              style={{
                borderColor: done ? '#FF006E' : 'rgba(255, 0, 110, 0.25)',
                background: done ? 'rgba(255,0,110,0.12)' : 'rgba(22, 10, 18, 0.88)',
                boxShadow: done ? '3px 3px 0 rgba(255,0,110,0.5), 0 4px 16px rgba(0,0,0,0.4)' : 'none',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(12);
                  toggleMutation.mutate(habit);
                }}
                aria-label={done ? "Mark habit incomplete" : "Mark habit completed"}
                className="w-8 h-8 -ml-1.5 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer touch-target active:scale-90"
              >
                <div
                  className="w-4.5 h-4.5 border flex items-center justify-center transition-all"
                  style={{
                    borderColor: done ? '#FF006E' : 'rgba(255, 0, 110, 0.6)',
                    background: done ? '#FF006E' : 'transparent',
                    boxShadow: done ? '0 0 10px #FF006E' : 'none',
                  }}
                >
                  {done && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                </div>
              </button>
              <InlineHabitEdit
                value={habit.title}
                onSave={(title) => renameMutation.mutate({ id: habit.id, title })}
              />
              <span className="text-[10px] font-mono font-bold" style={{ color: done ? '#FF006E' : '#555' }}>
                {currentStreak > 0 ? `${currentStreak}🔥` : ''}
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  deleteMutation.mutate(habit.id);
                }}
                aria-label="Delete habit"
                className="opacity-50 md:opacity-0 md:group-hover:opacity-40 hover:!opacity-100 transition-opacity p-2 text-[#FF006E] touch-target active:scale-90 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
      {adding && (
        <form onSubmit={e => { e.preventDefault(); if (newHabit.trim()) createMutation.mutate(newHabit.trim()); }} className="mt-2">
          <input
            value={newHabit}
            onChange={e => setNewHabit(e.target.value)}
            placeholder="// NEW HABIT..."
            className="w-full px-3 py-2.5 text-xs font-mono bg-black outline-none"
            style={{ border: '1px solid #FF006E', color: '#FF006E', caretColor: '#FF006E' }}
            autoFocus
            onBlur={() => { if (!newHabit.trim()) setAdding(false); }}
          />
        </form>
      )}
    </div>
  );
}