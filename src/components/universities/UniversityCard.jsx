import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const statusColors = {
  researching: '#00FF87',
  preparing: '#FFD700',
  applied: '#FF006E',
  accepted: '#00FF87',
  rejected: '#FF006E',
};

export default function UniversityCard({ university }) {
  const queryClient = useQueryClient();
  const reqs = university.requirements || [];
  const completedCount = reqs.filter(r => r.completed).length;
  const daysLeft = university.deadline
    ? Math.ceil((new Date(university.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const toggleReq = useMutation({
    mutationFn: (idx) => {
      const newReqs = [...reqs];
      newReqs[idx] = { ...newReqs[idx], completed: !newReqs[idx].completed };
      return base44.entities.University.update(university.id, { requirements: newReqs });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['universities'] }),
  });

  const statusColor = statusColors[university.status] || '#555';

  return (
    <div className="p-4 transition-all"
      style={{ border: `1px solid ${statusColor}`, boxShadow: `4px 4px 0 rgba(0,255,135,0.3)`, background: `rgba(${statusColor === '#00FF87' ? '0,255,135' : '255,0,110'},0.03)` }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-black font-mono tracking-wide uppercase" style={{ color: '#fff' }}>{university.name}</h3>
          <p className="text-[10px] font-mono mt-0.5" style={{ color: '#444' }}>{university.country}</p>
        </div>
        <div className="flex items-center gap-3">
          {daysLeft !== null && (
            <span className="text-sm font-mono font-bold tabular-nums"
              style={{ color: daysLeft <= 60 ? '#FF006E' : '#444', textShadow: daysLeft <= 60 ? '0 0 6px #FF006E' : 'none' }}>
              {daysLeft > 0 ? `${daysLeft}D` : 'PAST'}
            </span>
          )}
          <span className="text-[10px] font-mono font-bold px-2 py-1"
            style={{ color: statusColor, border: `1px solid ${statusColor}`, textShadow: `0 0 6px ${statusColor}` }}>
            {university.status.toUpperCase()}
          </span>
        </div>
      </div>

      {reqs.length > 0 && (
        <>
          <div className="w-full h-1 mb-3" style={{ background: '#111' }}>
            <div className="h-full transition-all"
              style={{ width: `${(completedCount / reqs.length) * 100}%`, background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
          </div>
          <div className="grid grid-cols-2 gap-1">
            {reqs.map((req, idx) => (
              <button
                key={idx}
                onClick={() => toggleReq.mutate(idx)}
                className="flex items-center gap-2 py-1.5 px-2 text-left transition-all hover:bg-[rgba(0,255,135,0.05)]"
              >
                <div className="w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center transition-all"
                  style={{
                    borderColor: req.completed ? '#00FF87' : '#333',
                    background: req.completed ? '#00FF87' : 'transparent',
                  }}>
                  {req.completed && <Check className="w-2 h-2 text-black" strokeWidth={3} />}
                </div>
                <span className="text-[11px] font-mono" style={{ color: req.completed ? '#00FF87' : '#555' }}>
                  {req.name}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}