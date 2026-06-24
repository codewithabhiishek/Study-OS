import React, { useState, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/api/supabaseClient';
import { Skeleton } from '@/components/ui/skeleton';

const DEFAULT_MISSION = { title: 'EUROPE 2027', date: '2027-06-01' };

function useLiveCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const calc = () => {
      if (!targetDate) return;
      let target;
      if (typeof targetDate === 'string' && targetDate.includes('-') && !targetDate.includes('T')) {
        const [year, month, day] = targetDate.split('-').map(Number);
        target = new Date(year, month - 1, day);
      } else {
        target = new Date(targetDate);
      }

      const diff = target - new Date();
      if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setTimeLeft({
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

  return timeLeft;
}

export default function MissionBanner() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: '', date: '' });

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['active-mission'],
    queryFn: () => supabaseClient.entities.Deadline.filter({ category: 'mission' }),
  });

  const activeMission = missions[0] || DEFAULT_MISSION;
  const timeLeft = useLiveCountdown(activeMission.date);

  const saveMutation = useMutation({
    mutationFn: async (newMission) => {
      if (missions[0]?.id) {
        return supabaseClient.entities.Deadline.update(missions[0].id, {
          title: newMission.title,
          date: newMission.date,
        });
      } else {
        return supabaseClient.entities.Deadline.create({
          title: newMission.title,
          date: newMission.date,
          category: 'mission',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-mission'] });
      setEditing(false);
    },
  });

  const startEditing = () => {
    setDraft({ title: activeMission.title, date: activeMission.date });
    setEditing(true);
  };

  const save = () => {
    if (!draft.title.trim() || !draft.date) return;
    saveMutation.mutate(draft);
  };

  const cancel = () => {
    setEditing(false);
  };

  const pad = (n) => String(n ?? 0).padStart(2, '0');

  if (isLoading) {
    return (
      <div className="mb-8 relative overflow-hidden p-4 border border-[#FF006E]/20"
        style={{ background: 'rgba(255,0,110,0.02)' }}>
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-3 w-28 bg-[#FF006E]/10" />
        </div>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <Skeleton className="h-7 w-48 bg-[#00FF87]/15" />
          <div className="flex items-end gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-8 w-10 bg-[#FF006E]/15 mb-1" />
                <Skeleton className="h-2.5 w-6 bg-[#FF006E]/10 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 relative overflow-hidden p-4 border border-[#FF006E]"
      style={{ boxShadow: '4px 4px 0 #00FF87', background: 'rgba(255,0,110,0.05)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono tracking-widest" style={{ color: '#FF006E' }}>
          ▶ ACTIVE MISSION
        </div>
        {!editing ? (
          <button onClick={startEditing}
            className="p-1 transition-all hover:scale-110"
            style={{ color: '#FF006E' }}>
            <Pencil className="w-3 h-3" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={save} disabled={saveMutation.isPending} className="p-1" style={{ color: '#00FF87' }}>
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={cancel} className="p-1" style={{ color: '#FF006E' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <input
            value={draft.title}
            onChange={e => setDraft(p => ({ ...p, title: e.target.value.toUpperCase() }))}
            placeholder="MISSION TITLE"
            className="w-full px-2 py-1.5 text-sm font-mono bg-black outline-none uppercase"
            style={{ border: '1px solid #FF006E', color: '#00FF87', caretColor: '#00FF87' }}
            autoFocus
          />
          <input
            type="date"
            value={draft.date}
            onChange={e => setDraft(p => ({ ...p, date: e.target.value }))}
            className="w-full px-2 py-1.5 text-sm font-mono bg-black outline-none"
            style={{ border: '1px solid #FF006E', color: '#FF006E', caretColor: '#FF006E', colorScheme: 'dark' }}
          />
        </div>
      ) : (
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div className="text-2xl font-black tracking-tight uppercase" style={{ color: '#00FF87', textShadow: '0 0 20px rgba(0,255,135,0.5)' }}>
            {activeMission.title}
          </div>
          <div className="flex items-end gap-3">
            {[
              { val: timeLeft.days, label: 'DAYS' },
              { val: timeLeft.hours, label: 'HRS' },
              { val: timeLeft.minutes, label: 'MIN' },
              { val: timeLeft.seconds, label: 'SEC' },
            ].map(({ val, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-mono font-bold tabular-nums leading-none" style={{ color: '#FF006E', textShadow: '0 0 15px #FF006E' }}>
                  {pad(val)}
                </div>
                <div className="text-[9px] font-mono" style={{ color: '#FF006E', opacity: 0.6 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}