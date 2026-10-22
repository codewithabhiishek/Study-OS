import React, { useState, useEffect } from 'react';
import { supabaseClient } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { triggerHaptic } from '@/utils/security';

function InlineEdit({ value, onSave, className, style }) {
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
      className={cn("bg-transparent outline-none border-b", className)}
      style={{ ...style, borderColor: '#00FF87', caretColor: '#00FF87' }}
      autoFocus
      onClick={e => e.stopPropagation()}
    />
  );
  return (
    <span className={cn("cursor-text group/text inline-flex items-center gap-1", className)} style={style}
      onDoubleClick={e => { e.stopPropagation(); setVal(value); setEditing(true); }}>
      <span>{value}</span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setVal(value); setEditing(true); }}
        className="inline-flex items-center justify-center p-1 text-[#00FF87] opacity-60 md:opacity-0 md:group-hover/text:opacity-30 hover:!opacity-100 touch-target cursor-pointer"
        title="Edit project name"
      >
        <Pencil className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

export default function ProjectCard({ project }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [adding, setAdding] = useState(false);

  const updateProjectMutation = useMutation({
    mutationFn: (data) => supabaseClient.entities.Project.update(project.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      // Fetch all tasks for this project to delete them first
      const projectTasks = await supabaseClient.entities.Task.filter({ project_id: project.id });
      for (const t of projectTasks) {
        await supabaseClient.entities.Task.delete(t.id);
      }
      return supabaseClient.entities.Project.delete(project.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['top-tasks'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => supabaseClient.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-tasks', project.id] }),
  });

  const renameTaskMutation = useMutation({
    mutationFn: ({ id, title }) => supabaseClient.entities.Task.update(id, { title }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-tasks', project.id] }),
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['project-tasks', project.id],
    queryFn: () => supabaseClient.entities.Task.filter({ project_id: project.id }, 'order'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }) => supabaseClient.entities.Task.update(id, { completed: !completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-tasks', project.id] }),
  });

  const createMutation = useMutation({
    mutationFn: (title) => supabaseClient.entities.Task.create({ title, project_id: project.id, order: tasks.length }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', project.id] });
      setNewTask('');
      setAdding(false);
    },
  });

  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const daysLeft = project.deadline
    ? Math.ceil((parseLocalDate(project.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const handleDeleteProject = (e) => {
    e.stopPropagation();
    deleteProjectMutation.mutate();
  };

  return (
    <div className="transition-all glass-panel glass-card-interactive" style={{ border: '1px solid rgba(0, 255, 135, 0.5)', boxShadow: expanded ? '4px 4px 0 #FF006E, 0 8px 30px rgba(0,0,0,0.5)' : '4px 4px 0 #00FF87, 0 8px 30px rgba(0,0,0,0.5)' }}>
      <div
        className="flex items-center gap-3 w-full px-3.5 py-3 sm:px-4 sm:py-3.5 text-left transition-all hover:bg-[rgba(0,255,135,0.05)] group"
      >
        <button
          type="button"
          onClick={() => { triggerHaptic(10); setExpanded(!expanded); }}
          className="flex items-center gap-2 p-1 text-left touch-target cursor-pointer -ml-1 text-[#00FF87]"
          aria-label={expanded ? "Collapse project" : "Expand project"}
        >
          <span className="text-[11px] font-mono">
            {expanded ? '▼' : '▶'}
          </span>
          <span className="text-base select-none">{project.emoji || '📁'}</span>
        </button>
        <InlineEdit
          value={project.title.toUpperCase()}
          onSave={(t) => updateProjectMutation.mutate({ title: t })}
          className="text-sm font-bold font-mono tracking-wide flex-1"
          style={{ color: '#fff' }}
        />
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={(e) => {
              triggerHaptic(15);
              handleDeleteProject(e);
            }}
            className="opacity-50 md:opacity-0 md:group-hover:opacity-40 hover:!opacity-100 transition-opacity p-2 text-[#FF006E] touch-target active:scale-90 cursor-pointer mr-0.5"
            title="Delete Project"
            aria-label="Delete Project"
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
            <div className="w-16 sm:w-20 h-1.5 bg-[#111]" style={{ border: '1px solid #222' }}>
              <div className="h-full transition-all" style={{ width: `${progress}%`, background: '#00FF87', boxShadow: '0 0 6px #00FF87' }} />
            </div>
            <span className="text-[10px] font-mono font-bold tabular-nums w-7 text-right" style={{ color: '#00FF87' }}>{progress}%</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t px-3.5 sm:px-4 pb-3" style={{ borderColor: 'rgba(0, 255, 135, 0.25)' }}>
          <div className="space-y-1 pt-2">
            {isLoadingTasks ? (
              [...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 w-full px-2 py-2 text-left">
                  <Skeleton className="w-4 h-4 bg-[#00FF87]/15 flex-shrink-0" />
                  <Skeleton className="h-3.5 w-32 bg-[#00FF87]/10 flex-1" />
                </div>
              ))
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2.5 w-full px-2 py-2 text-left transition-all hover:bg-[rgba(0,255,135,0.05)] group"
                >
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(12);
                      toggleMutation.mutate({ id: task.id, completed: task.completed });
                    }}
                    aria-label={task.completed ? "Mark subtask incomplete" : "Mark subtask complete"}
                    className="w-8 h-8 -ml-1.5 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer touch-target active:scale-90"
                  >
                    <div
                      className="w-4.5 h-4.5 border flex items-center justify-center transition-all"
                      style={{
                        borderColor: task.completed ? '#00FF87' : '#444',
                        background: task.completed ? '#00FF87' : 'transparent',
                      }}
                    >
                      {task.completed && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                    </div>
                  </button>
                  <InlineEdit
                    value={task.title}
                    onSave={(title) => renameTaskMutation.mutate({ id: task.id, title })}
                    className={cn("text-xs font-mono flex-1", task.completed ? "line-through" : "")}
                    style={{ color: task.completed ? '#444' : '#888' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(15);
                      deleteTaskMutation.mutate(task.id);
                    }}
                    aria-label="Delete subtask"
                    className="opacity-50 md:opacity-0 md:group-hover:opacity-30 hover:!opacity-100 transition-opacity p-2 text-[#FF006E] touch-target active:scale-90 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
            {adding ? (
              <form onSubmit={(e) => { e.preventDefault(); if (newTask.trim()) createMutation.mutate(newTask.trim()); }} className="pt-1">
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="// ADD SUBTASK..."
                  className="w-full px-2.5 py-2 text-xs font-mono bg-black outline-none"
                  style={{ border: '1px solid #00FF87', color: '#00FF87', caretColor: '#00FF87' }}
                  autoFocus
                  onBlur={() => { if (!newTask.trim()) setAdding(false); }}
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => { triggerHaptic(10); setAdding(true); }}
                className="flex items-center gap-2 px-2.5 py-2 text-[11px] font-mono transition-all touch-target cursor-pointer active:scale-95 text-zinc-400 hover:text-[#00FF87]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD SUBTASK</span>
              </button>
            )}
          </div>
          {project.notes && (
            <p className="text-[10px] font-mono mt-3 px-2" style={{ color: '#555' }}>{project.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}