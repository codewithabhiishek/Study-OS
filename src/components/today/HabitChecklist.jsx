import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Trash2 } from 'lucide-react';
import { calculateStreak } from '@/utils/habitUtils';

function InlineHabitEdit({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

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
      className="text-xs font-mono flex-1 cursor-text"
      onDoubleClick={e => { e.stopPropagation(); setVal(value); setEditing(true); }}
    >
      {value}
    </span>
  );
}

export default function HabitChecklist() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [adding, setAdding] = useState(false);
  const [newHabit, setNewHabit] = useState('');

  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: () => base44.entities.Habit.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: (habit) => {
      const dates = habit.completed_dates || [];
      const done = dates.includes(today);
      const newDates = done ? dates.filter(d => d !== today) : [...dates, today];
      const newStreak = calculateStreak(newDates);
      return base44.entities.Habit.update(habit.id, { completed_dates: newDates, streak: newStreak });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }) => base44.entities.Habit.update(id, { title }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Habit.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const createMutation = useMutation({
    mutationFn: (title) => base44.entities.Habit.create({ title, streak: 0, completed_dates: [] }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['habits'] }); setNewHabit(''); setAdding(false); },
  });

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-mono font-bold tracking-widest" style={{ color: '#FF006E' }}>
          ▶ HABITS
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="w-6 h-6 flex items-center justify-center border border-[#FF006E] transition-all hover:bg-[#FF006E] hover:text-black"
          style={{ color: '#FF006E' }}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {habits.map((habit) => {
          const done = (habit.completed_dates || []).includes(today);
          const currentStreak = calculateStreak(habit.completed_dates || []);
          return (
            <div
              key={habit.id}
              className="flex items-center gap-2 px-3 py-2.5 text-left transition-all group relative"
              style={{
                border: done ? '1px solid #FF006E' : '1px solid #333',
                background: done ? 'rgba(255,0,110,0.1)' : 'transparent',
                boxShadow: done ? '3px 3px 0 rgba(255,0,110,0.4)' : 'none',
              }}
            >
              <button
                onClick={() => toggleMutation.mutate(habit)}
                className="w-4 h-4 border flex-shrink-0 flex items-center justify-center transition-all"
                style={{
                  borderColor: done ? '#FF006E' : '#444',
                  background: done ? '#FF006E' : 'transparent',
                  boxShadow: done ? '0 0 8px #FF006E' : 'none',
                }}
              >
                {done && <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />}
              </button>
              <InlineHabitEdit
                value={habit.title}
                onSave={(title) => renameMutation.mutate({ id: habit.id, title })}
              />
              <span className="text-[10px] font-mono font-bold" style={{ color: done ? '#FF006E' : '#444' }}>
                {currentStreak > 0 ? `${currentStreak}🔥` : ''}
              </span>
              <button
                onClick={() => deleteMutation.mutate(habit.id)}
                className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
                style={{ color: '#FF006E' }}
              >
                <Trash2 className="w-2.5 h-2.5" />
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