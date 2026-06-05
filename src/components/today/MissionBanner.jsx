import React, { useState, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';

const STORAGE_KEY = 'studyos_mission';

function getDefaultMission() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { title: 'GERMANY 2027', date: '2027-06-01' };
}

function useLiveCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - new Date();
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
  const [mission, setMission] = useState(getDefaultMission);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(mission);
  const timeLeft = useLiveCountdown(mission.date);

  const save = () => {
    setMission(draft);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setEditing(false);
  };
  const cancel = () => { setDraft(mission); setEditing(false); };

  const pad = (n) => String(n ?? 0).padStart(2, '0');

  return (
    <div className="mb-8 relative overflow-hidden p-4 border border-[#FF006E]"
      style={{ boxShadow: '4px 4px 0 #00FF87', background: 'rgba(255,0,110,0.05)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono tracking-widest" style={{ color: '#FF006E' }}>
          ▶ ACTIVE MISSION
        </div>
        {!editing ? (
          <button onClick={() => { setDraft(mission); setEditing(true); }}
            className="p-1 transition-all hover:scale-110"
            style={{ color: '#FF006E' }}>
            <Pencil className="w-3 h-3" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={save} className="p-1" style={{ color: '#00FF87' }}><Check className="w-3.5 h-3.5" /></button>
            <button onClick={cancel} className="p-1" style={{ color: '#FF006E' }}><X className="w-3.5 h-3.5" /></button>
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
            {mission.title}
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