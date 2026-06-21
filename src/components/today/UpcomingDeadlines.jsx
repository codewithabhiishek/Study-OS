import React, { useState, useEffect } from 'react';
import { supabaseClient } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Pencil } from 'lucide-react';

function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function InlineEdit({ value, onSave, style }) {
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
      className="bg-transparent outline-none border-b text-xs font-mono flex-1"
      style={{ ...style, borderColor: style?.color || '#FF006E', caretColor: style?.color || '#FF006E' }}
      autoFocus
      onClick={e => e.stopPropagation()}
    />
  );
  return (
    <span className="text-xs font-mono cursor-text flex-1 group/text" style={style}
      onDoubleClick={() => { setVal(value); setEditing(true); }}>
      {value}
      <Pencil className="w-2 h-2 inline ml-1 opacity-0 group-hover/text:opacity-30 transition-opacity" />
    </span>
  );
}

export default function UpcomingDeadlines() {
  const queryClient = useQueryClient();
  
  const { data: deadlines = [] } = useQuery({
    queryKey: ['deadlines'],
    queryFn: async () => {
      const all = await supabaseClient.entities.Deadline.list('date', 10);
      return all.filter(d => d.category !== 'mission');
    },
  });



  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => supabaseClient.entities.Deadline.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deadlines'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => supabaseClient.entities.Deadline.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deadlines'] }),
  });

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getDaysRemaining = (dateStr) =>
    Math.ceil((parseLocalDate(dateStr) - new Date()) / (1000 * 60 * 60 * 24));

  const sortedDeadlines = deadlines.map(d => ({ ...d, type: 'deadline' }))
    .filter(d => {
      const endOfDay = parseLocalDate(d.date);
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay >= new Date();
    })
    .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date))
    .slice(0, 10);

  if (sortedDeadlines.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="text-[11px] font-mono font-bold tracking-widest mb-3" style={{ color: '#00FF87' }}>
        ▶ DEADLINES
      </div>
      <div className="space-y-1.5">
        {sortedDeadlines.map((d) => {
          const days = getDaysRemaining(d.date);
          const urgent = days <= 90;
          const borderColor = urgent ? '#FF006E' : '#1a1a1a';
          const background = urgent 
            ? 'rgba(255,0,110,0.05)' 
            : 'transparent';

          return (
            <div key={`${d.type}-${d.id}`} className="flex items-center justify-between px-3 py-2 group"
              style={{ border: `1px solid ${borderColor}`, background }}>
              <InlineEdit
                value={d.title}
                onSave={(title) => updateMutation.mutate({ id: d.id, data: { title } })}
                style={{ color: urgent ? '#FF006E' : '#555' }}
              />
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <span className="text-sm font-mono font-bold tabular-nums"
                  style={{ color: urgent ? '#FF006E' : '#444', textShadow: urgent ? '0 0 8px #FF006E' : 'none' }}>
                  {days > 0 ? `${days}D` : 'PAST'}
                </span>
                <button
                  onClick={() => deleteMutation.mutate(d.id)}
                  className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
                  style={{ color: '#FF006E' }}
                  title="Delete Deadline"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}