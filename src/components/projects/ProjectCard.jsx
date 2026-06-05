import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function InlineEdit({ value, onSave, className, style }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const commit = () => { if (val.trim() && val.trim() !== value) onSave(val.trim()); setEditing(false); };
  if (editing) return (
    <input
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      className={cn("bg-transparent outline-none border-b", className)}
      style={{ ...style, borderColor: '#00FF87', caretColor: '#00FF87' }}
      autoFocus
      onClick={e => e.stopPropagation()}
    />
  );
  return (
    <span className={cn("cursor-text group/text", className)} style={style}
      onDoubleClick={e => { e.stopPropagation(); setVal(value); setEditing(true); }}>
      {value}
      <Pencil className="w-2.5 h-2.5 inline ml-1.5 opacity-0 group-hover/text:opacity-30 transition-opacity" style={{ color: '#00FF87' }} />
    </span>
  );
}

export default function ProjectCard({ project }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [adding, setAdding] = useState(false);

  const updateProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(project.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => base44.entities.Project.delete(project.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-tasks', project.id] }),
  });

  const renameTaskMutation = useMutation({
    mutationFn: ({ id, title }) => base44.entities.Task.update(id, { title }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-tasks', project.id] }),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['project-tasks', project.id],
    queryFn: () => base44.entities.Task.filter({ project_id: project.id }, 'order'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }) => base44.entities.Task.update(id, { completed: !completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-tasks', project.id] }),
  });

  const createMutation = useMutation({
    mutationFn: (title) => base44.entities.Task.create({ title, project_id: project.id, order: tasks.length }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', project.id] });
      setNewTask('');
      setAdding(false);
    },
  });

  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const daysLeft = project.deadline
    ? Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const handleDeleteProject = (e) => {
    e.stopPropagation();
    deleteProjectMutation.mutate();
  };

  return (
    <div className="transition-all" style={{ border: '1px solid #00FF87', boxShadow: expanded ? '4px 4px 0 #FF006E' : '4px 4px 0 #00FF87' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full px-4 py-3.5 text-left transition-all hover:bg-[rgba(0,255,135,0.05)] group"
      >
        <span className="text-[10px] font-mono" style={{ color: '#00FF87' }}>
          {expanded ? '▼' : '▶'}
        </span>
        <span className="text-base">{project.emoji || '📁'}</span>
        <InlineEdit
          value={project.title.toUpperCase()}
          onSave={(t) => updateProjectMutation.mutate({ title: t })}
          className="text-sm font-bold font-mono tracking-wide flex-1"
          style={{ color: '#fff' }}
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleDeleteProject}
            className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity mr-1"
            style={{ color: '#FF006E' }}
            title="Delete Project"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          
          {daysLeft !== null && (
            <span className="text-[11px] font-mono font-bold tabular-nums"
              style={{ color: daysLeft <= 60 ? '#FF006E' : '#444', textShadow: daysLeft <= 60 ? '0 0 6px #FF006E' : 'none' }}>
              {daysLeft > 0 ? `${daysLeft}D` : 'PAST'}
            </span>
          )}
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-[#111]" style={{ border: '1px solid #222' }}>
              <div className="h-full transition-all" style={{ width: `${progress}%`, background: '#00FF87', boxShadow: '0 0 6px #00FF87' }} />
            </div>
            <span className="text-[10px] font-mono font-bold tabular-nums w-7 text-right" style={{ color: '#00FF87' }}>{progress}%</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 pb-3" style={{ borderColor: '#00FF87', borderOpacity: 0.3 }}>
          <div className="space-y-1 pt-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 w-full px-2 py-2 text-left transition-all hover:bg-[rgba(0,255,135,0.05)] group"
              >
                <button
                  onClick={() => toggleMutation.mutate({ id: task.id, completed: task.completed })}
                  className="w-4 h-4 border flex-shrink-0 flex items-center justify-center transition-all"
                  style={{
                    borderColor: task.completed ? '#00FF87' : '#333',
                    background: task.completed ? '#00FF87' : 'transparent',
                  }}>
                  {task.completed && <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />}
                </button>
                <InlineEdit
                  value={task.title}
                  onSave={(title) => renameTaskMutation.mutate({ id: task.id, title })}
                  className={cn("text-xs font-mono flex-1", task.completed ? "line-through" : "")}
                  style={{ color: task.completed ? '#333' : '#888' }}
                />
                <button
                  onClick={() => deleteTaskMutation.mutate(task.id)}
                  className="opacity-0 group-hover:opacity-30 hover:!opacity-100 transition-opacity"
                  style={{ color: '#FF006E' }}
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
            {adding ? (
              <form onSubmit={(e) => { e.preventDefault(); if (newTask.trim()) createMutation.mutate(newTask.trim()); }} className="pt-1">
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="// ADD SUBTASK..."
                  className="w-full px-2 py-2 text-xs font-mono bg-black outline-none"
                  style={{ border: '1px solid #00FF87', color: '#00FF87', caretColor: '#00FF87' }}
                  autoFocus
                  onBlur={() => { if (!newTask.trim()) setAdding(false); }}
                />
              </form>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-2 px-2 py-2 text-[11px] font-mono transition-all"
                style={{ color: '#333' }}
                onMouseEnter={e => e.currentTarget.style.color = '#00FF87'}
                onMouseLeave={e => e.currentTarget.style.color = '#333'}
              >
                <Plus className="w-3 h-3" />
                ADD SUBTASK
              </button>
            )}
          </div>
          {project.notes && (
            <p className="text-[10px] font-mono mt-3 px-2" style={{ color: '#333' }}>{project.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}