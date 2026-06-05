import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ProjectCard from '@/components/projects/ProjectCard';

export default function Projects() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('');
  const [deadline, setDeadline] = useState('');

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setOpen(false);
      setTitle('');
      setEmoji('');
      setDeadline('');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (title.trim()) {
      createMutation.mutate({ title: title.trim(), emoji: emoji || '📁', deadline: deadline || undefined });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black tracking-tighter" style={{ color: '#fff' }}>
          PROJ<span style={{ color: '#00FF87', textShadow: '0 0 20px #00FF87' }}>ECTS</span>
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="w-8 h-8 flex items-center justify-center font-mono font-bold transition-all btn-neon-green text-black">
              <Plus className="w-4 h-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-black border-[#00FF87] text-white font-mono"
            style={{ boxShadow: '6px 6px 0 #FF006E' }}>
            <DialogHeader>
              <DialogTitle className="text-[#00FF87] font-mono tracking-widest">// NEW PROJECT</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3 mt-2">
              <div className="flex gap-2">
                <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="📁"
                  className="w-12 text-center text-sm font-mono bg-black py-2.5 px-2 outline-none"
                  style={{ border: '1px solid #00FF87', color: '#fff' }} maxLength={2} />
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="PROJECT NAME"
                  className="flex-1 text-sm font-mono bg-black py-2.5 px-3 outline-none uppercase"
                  style={{ border: '1px solid #00FF87', color: '#fff', caretColor: '#00FF87' }} autoFocus />
              </div>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-sm font-mono bg-black py-2.5 px-3 outline-none"
                style={{ border: '1px solid #333', color: '#888', caretColor: '#00FF87' }} />
              <button type="submit" className="w-full py-3 font-mono font-bold text-sm tracking-widest btn-neon-magenta">
                INITIALIZE PROJECT
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
        {projects.length === 0 && (
          <div className="py-10 text-center font-mono text-sm" style={{ color: '#333' }}>
            // NO PROJECTS INITIALIZED
          </div>
        )}
      </div>
    </div>
  );
}