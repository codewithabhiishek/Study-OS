import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Pencil, Trash2 } from 'lucide-react';
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
      className={cn("bg-transparent outline-none border-b flex-1", className)}
      style={{ ...style, borderColor: '#00FF87', caretColor: '#00FF87' }}
      autoFocus
    />
  );

  return (
    <span
      className={cn("flex-1 cursor-text group/text relative", className)}
      style={style}
      onDoubleClick={() => { setVal(value); setEditing(true); }}
    >
      {value}
      <Pencil className="w-2.5 h-2.5 inline ml-1.5 opacity-0 group-hover/text:opacity-40 transition-opacity" style={{ color: '#00FF87' }} />
    </span>
  );
}

export default function TopTasks() {
  const queryClient = useQueryClient();
  const [newTask, setNewTask] = useState('');
  const [adding, setAdding] = useState(false);

  const { data: tasks = [] } = useQuery({
    queryKey: ['top-tasks'],
    queryFn: () => base44.entities.Task.filter({ is_top_three: true }, 'order', 10),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }) => base44.entities.Task.update(id, { completed: !completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['top-tasks'] }),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }) => base44.entities.Task.update(id, { title }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['top-tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['top-tasks'] }),
  });

  const createMutation = useMutation({
    mutationFn: (title) => base44.entities.Task.create({ title, is_top_three: true, order: tasks.length }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top-tasks'] });
      setNewTask('');
      setAdding(false);
    },
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (newTask.trim()) createMutation.mutate(newTask.trim());
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-mono font-bold tracking-widest" style={{ color: '#00FF87' }}>
          ▶ {"TODAY'S FOCUS"}
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="w-6 h-6 flex items-center justify-center border border-[#00FF87] transition-all hover:bg-[#00FF87] hover:text-black"
          style={{ color: '#00FF87' }}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-2">
        {tasks.map((task, i) => (
          <div
            key={task.id}
            className="flex items-center gap-3 w-full px-3 py-3 text-left transition-all group relative overflow-hidden"
            style={{
              border: task.completed ? '1px solid rgba(0,255,135,0.3)' : '1px solid #00FF87',
              boxShadow: task.completed ? 'none' : '3px 3px 0 rgba(255,0,110,0.5)',
              background: task.completed ? 'rgba(0,255,135,0.05)' : 'black',
            }}
          >
            <button
              onClick={() => toggleMutation.mutate({ id: task.id, completed: task.completed })}
              className="flex-shrink-0 w-5 h-5 border-2 flex items-center justify-center transition-all"
              style={{
                borderColor: '#00FF87',
                background: task.completed ? '#00FF87' : 'transparent',
                boxShadow: task.completed ? '0 0 8px #00FF87' : '0 0 4px rgba(0,255,135,0.3)',
              }}
            >
              {task.completed && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
            </button>
            <InlineEdit
              value={task.title}
              onSave={(title) => renameMutation.mutate({ id: task.id, title })}
              className={cn("text-sm font-medium font-mono", task.completed ? "line-through" : "")}
              style={{ color: task.completed ? '#444' : '#fff' }}
            />
            {task.priority === 'high' && !task.completed && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5"
                style={{ color: '#FF006E', border: '1px solid #FF006E' }}>HOT</span>
            )}
            <button
              onClick={() => deleteMutation.mutate(task.id)}
              className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity p-0.5"
              style={{ color: '#FF006E' }}
            >
              <Trash2 className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono" style={{ color: '#00FF87', opacity: 0.4 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
          </div>
        ))}
        {adding && (
          <form onSubmit={handleAdd}>
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="// NEW TASK..."
              className="w-full px-3 py-3 text-sm font-mono bg-black outline-none"
              style={{ border: '1px solid #00FF87', color: '#00FF87', caretColor: '#00FF87' }}
              autoFocus
              onBlur={() => { if (!newTask.trim()) setAdding(false); }}
            />
          </form>
        )}
        {tasks.length === 0 && !adding && (
          <div className="px-3 py-4 text-[11px] font-mono" style={{ color: '#333', border: '1px solid #111' }}>
            {"// NO TASKS LOADED"}
          </div>
        )}
      </div>
    </div>
  );
}