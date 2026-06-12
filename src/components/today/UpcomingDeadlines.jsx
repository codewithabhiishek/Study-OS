import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
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
      const all = await base44.entities.Deadline.list('date', 10);
      return all.filter(d => d.category !== 'mission');
    },
  });

  const { data: universities = [] } = useQuery({
    queryKey: ['universities'],
    queryFn: () => base44.entities.University.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Deadline.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deadlines'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Deadline.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deadlines'] }),
  });

  const getDaysRemaining = (dateStr) =>
    Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));

  const realUniDeadlines = universities.filter(u => u.name !== '__GLOBAL_DOCUMENTS__' && u.deadline);

  const combined = [
    ...deadlines.map(d => ({ ...d, type: 'deadline' })),
    ...realUniDeadlines.map(u => ({
      id: u.id,
      title: `${toTitleCase(u.name)} DEADLINE`,
      date: u.deadline,
      type: 'uni-deadline'
    }))
  ];

  const sortedDeadlines = combined
    .sort((a, b) => new Date(a.date) - new Date(b.date))
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
          const isUni = d.type === 'uni-deadline';
          const borderColor = isUni ? '#FF006E' : urgent ? '#FF006E' : '#1a1a1a';
          const background = isUni 
            ? 'rgba(255,0,110,0.1)' 
            : urgent 
              ? 'rgba(255,0,110,0.05)' 
              : 'transparent';

          return (
            <div key={`${d.type}-${d.id}`} className="flex items-center justify-between px-3 py-2 group"
              style={{ border: `1px solid ${borderColor}`, background }}>
              {isUni ? (
                <span className="text-xs font-mono font-bold flex-1" style={{ color: '#FF006E', borderLeft: '1.5px solid #FF006E', paddingLeft: '6px' }}>
                  {d.title}
                </span>
              ) : (
                <InlineEdit
                  value={d.title}
                  onSave={(title) => updateMutation.mutate({ id: d.id, data: { title } })}
                  style={{ color: urgent ? '#FF006E' : '#555' }}
                />
              )}
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <span className="text-sm font-mono font-bold tabular-nums"
                  style={{ color: urgent || isUni ? '#FF006E' : '#444', textShadow: urgent || isUni ? '0 0 8px #FF006E' : 'none' }}>
                  {days > 0 ? `${days}D` : 'PAST'}
                </span>
                {d.type !== 'uni-deadline' && (
                  <button
                    onClick={() => deleteMutation.mutate(d.id)}
                    className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
                    style={{ color: '#FF006E' }}
                    title="Delete Deadline"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}