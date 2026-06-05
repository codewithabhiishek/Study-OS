import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import UniversityCard from '@/components/universities/UniversityCard';

const DEFAULT_REQUIREMENTS = [
  { name: 'Passport', completed: false },
  { name: 'Transcript', completed: false },
  { name: 'IELTS', completed: false },
  { name: 'APS', completed: false },
  { name: 'SOP', completed: false },
];

export default function Universities() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('researching');

  const { data: universities = [] } = useQuery({
    queryKey: ['universities'],
    queryFn: () => base44.entities.University.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.University.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universities'] });
      setOpen(false); setName(''); setCountry(''); setDeadline(''); setStatus('researching');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (name.trim()) {
      createMutation.mutate({ name: name.trim(), country: country.trim(), deadline: deadline || undefined, status, requirements: DEFAULT_REQUIREMENTS });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black tracking-tighter">
          <span style={{ color: '#FF006E', textShadow: '0 0 20px #FF006E' }}>UNIV</span>
          <span style={{ color: '#fff' }}>.</span>
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="w-8 h-8 flex items-center justify-center btn-neon-magenta">
              <Plus className="w-4 h-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-black border-[#FF006E] text-white font-mono"
            style={{ boxShadow: '6px 6px 0 #00FF87' }}>
            <DialogHeader>
              <DialogTitle className="text-[#FF006E] font-mono tracking-widest">// ADD UNIVERSITY</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3 mt-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="UNIVERSITY NAME"
                className="w-full text-sm font-mono bg-black py-2.5 px-3 outline-none uppercase"
                style={{ border: '1px solid #FF006E', color: '#fff', caretColor: '#FF006E' }} autoFocus />
              <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="COUNTRY"
                className="w-full text-sm font-mono bg-black py-2.5 px-3 outline-none"
                style={{ border: '1px solid #333', color: '#888', caretColor: '#FF006E' }} />
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-sm font-mono bg-black py-2.5 px-3 outline-none"
                style={{ border: '1px solid #333', color: '#888' }} />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-black border-[#333] text-[#888] font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-[#00FF87] font-mono">
                  {['researching','preparing','applied','accepted','rejected'].map(s => (
                    <SelectItem key={s} value={s} className="text-[#00FF87] font-mono">{s.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button type="submit" className="w-full py-3 font-mono font-bold text-sm tracking-widest btn-neon-magenta">
                ADD TO LIST
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {universities.map((u) => (
          <UniversityCard key={u.id} university={u} />
        ))}
        {universities.length === 0 && (
          <div className="py-10 text-center font-mono text-sm" style={{ color: '#333' }}>
            // NO UNIVERSITIES TRACKED
          </div>
        )}
      </div>
    </div>
  );
}