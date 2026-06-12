import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { getCountryFlag } from '@/utils/countryHelpers';

const statusColors = {
  researching: '#00FF87',
  preparing: '#FFD700',
  applied: '#FF006E',
  accepted: '#00FF87',
  rejected: '#FF006E',
};

export default function UniversityCard({ university, onEdit, onDelete }) {
  const daysLeft = university.deadline
    ? Math.ceil((new Date(university.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const statusColor = statusColors[university.status] || '#555';

  return (
    <div className="p-4 transition-all group"
      style={{ border: `1px solid ${statusColor}`, boxShadow: `4px 4px 0 rgba(0,255,135,0.3)`, background: `rgba(${statusColor === '#00FF87' ? '0,255,135' : '255,0,110'},0.03)` }}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-black font-mono tracking-wide uppercase" style={{ color: '#fff' }}>{university.name}</h3>
          {university.country && (
            <p className="text-[10px] font-mono mt-0.5 flex items-center gap-1.5" style={{ color: '#444' }}>
              <span>{getCountryFlag(university.country)}</span>
              <span>{university.country}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
              style={{ color: '#00FF87' }}
              title="Edit University"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
              style={{ color: '#FF006E' }}
              title="Delete University"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
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
    </div>
  );
}