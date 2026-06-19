import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import UniversityCard from '@/components/universities/UniversityCard';
import { COUNTRIES, getCountryFlag } from '@/utils/countryHelpers';

const DEFAULT_REQUIREMENTS = [
  { name: 'Passport', completed: false },
  { name: 'Transcript', completed: false },
  { name: 'IELTS', completed: false },
  { name: 'APS', completed: false },
  { name: 'SOP', completed: false },
];

export default function Universities() {
  const queryClient = useQueryClient();
  
  // Add form states
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [isCustomCountry, setIsCustomCountry] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('researching');

  // Edit form states
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editIsCustomCountry, setEditIsCustomCountry] = useState(false);
  const [editDeadline, setEditDeadline] = useState('');
  const [editStatus, setEditStatus] = useState('researching');

  // New global doc input state
  const [newGlobalDoc, setNewGlobalDoc] = useState('');

  // Optimistic local state for requirements checklist to fix latency
  const [localGlobalReqs, setLocalGlobalReqs] = useState([]);

  const { data: universities = [], isSuccess } = useQuery({
    queryKey: ['universities'],
    queryFn: () => base44.entities.University.list(),
  });

  // Extract global checklist and actual universities
  const globalDocs = universities.find(u => u.name === '__GLOBAL_DOCUMENTS__');
  const realUniversities = universities.filter(u => u.name !== '__GLOBAL_DOCUMENTS__');

  // Sync database requirements list to local state on load
  useEffect(() => {
    if (globalDocs) {
      setLocalGlobalReqs(globalDocs.requirements || []);
    }
  }, [globalDocs]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.University.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universities'] });
      setOpen(false); setName(''); setCountry(''); setIsCustomCountry(false); setDeadline(''); setStatus('researching');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.University.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universities'] });
      setEditOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.University.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universities'] });
    },
  });

  // Auto-initialize global checklist if it does not exist
  useEffect(() => {
    if (isSuccess && !globalDocs) {
      createMutation.mutate({
        name: '__GLOBAL_DOCUMENTS__',
        country: 'GLOBAL',
        status: 'researching',
        requirements: DEFAULT_REQUIREMENTS
      });
    }
  }, [isSuccess, globalDocs]);

  // Toggle global requirements mutation
  const toggleGlobalRequirement = useMutation({
    mutationFn: (newReqs) => {
      if (!globalDocs) return;
      return base44.entities.University.update(globalDocs.id, { requirements: newReqs });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universities'] });
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (name.trim()) {
      createMutation.mutate({ name: name.trim(), country: country.trim(), deadline: deadline || undefined, status, requirements: [] });
    }
  };

  const handleStartEdit = (u) => {
    setEditId(u.id);
    setEditName(u.name);
    setEditDeadline(u.deadline || '');
    setEditStatus(u.status);

    const isPredefined = COUNTRIES.some(c => c.name.toLowerCase() === (u.country || '').trim().toLowerCase());
    if (isPredefined) {
      const match = COUNTRIES.find(c => c.name.toLowerCase() === (u.country || '').trim().toLowerCase());
      setEditCountry(match.name);
      setEditIsCustomCountry(false);
    } else {
      setEditCountry(u.country || '');
      setEditIsCustomCountry(u.country ? true : false);
    }
    setEditOpen(true);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (editName.trim()) {
      updateMutation.mutate({
        id: editId,
        data: {
          name: editName.trim(),
          country: editCountry.trim(),
          deadline: editDeadline || null,
          status: editStatus,
        },
      });
    }
  };

  const handleDelete = (u) => {
    if (window.confirm(`Are you sure you want to delete ${u.name}?`)) {
      deleteMutation.mutate(u.id);
    }
  };

  // Toggle requirements instantly (optimistically) in local UI and save in background
  const handleToggleGlobalReq = (idx) => {
    const updatedReqs = [...localGlobalReqs];
    updatedReqs[idx] = { ...updatedReqs[idx], completed: !updatedReqs[idx].completed };
    setLocalGlobalReqs(updatedReqs);
    toggleGlobalRequirement.mutate(updatedReqs);
  };

  // Add custom doc to global checklist optimistically
  const addGlobalDoc = (docName) => {
    if (!docName.trim() || !globalDocs) return;
    const newReqs = [...localGlobalReqs, { name: docName.trim(), completed: false }];
    setLocalGlobalReqs(newReqs);
    updateMutation.mutate({
      id: globalDocs.id,
      data: { requirements: newReqs }
    });
    setNewGlobalDoc('');
  };

  // Remove doc from global checklist optimistically
  const removeGlobalDoc = (idx) => {
    if (!globalDocs) return;
    const newReqs = localGlobalReqs.filter((_, i) => i !== idx);
    setLocalGlobalReqs(newReqs);
    updateMutation.mutate({
      id: globalDocs.id,
      data: { requirements: newReqs }
    });
  };

  // Global checklist statistics
  const globalCompletedCount = localGlobalReqs.filter(r => r.completed).length;
  const globalProgressPct = localGlobalReqs.length > 0 ? Math.round((globalCompletedCount / localGlobalReqs.length) * 100) : 0;

  return (
    <div className="w-full space-y-8">
      {/* Title row */}
      <div>
        <h1 className="text-4xl font-black tracking-tighter">
          <span style={{ color: '#FF006E', textShadow: '0 0 20px #FF006E' }}>UNIV</span>
          <span style={{ color: '#fff' }}>.</span>
        </h1>
      </div>

      {/* Grid wrapper for responsive dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Target Universities list column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between border-b border-[#FF006E]/20 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#FF006E] uppercase tracking-wider">{"// TARGET UNIVERSITIES"}</span>
              <span className="text-[10px] font-mono text-gray-500 uppercase">{realUniversities.length} TRACKED</span>
            </div>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button className="w-6 h-6 flex items-center justify-center btn-neon-magenta text-black">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-black border-[#FF006E] text-white font-mono"
                style={{ boxShadow: '6px 6px 0 #00FF87' }}>
                <DialogHeader>
                  <DialogTitle className="text-[#FF006E] font-mono tracking-widest">{"// ADD UNIVERSITY"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-3 mt-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="UNIVERSITY NAME"
                    className="w-full text-sm font-mono bg-black py-2.5 px-3 outline-none uppercase"
                    style={{ border: '1px solid #FF006E', color: '#fff', caretColor: '#FF006E' }} autoFocus />
                  
                  <Select value={isCustomCountry ? 'custom' : country} onValueChange={(val) => {
                    if (val === 'custom') {
                      setIsCustomCountry(true);
                      setCountry('');
                    } else {
                      setIsCustomCountry(false);
                      setCountry(val);
                    }
                  }}>
                    <SelectTrigger className="bg-black border-[#333] text-[#888] font-mono w-full">
                      <SelectValue placeholder="SELECT COUNTRY" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-[#00FF87] font-mono max-h-[200px] overflow-y-auto">
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.name} value={c.name} className="text-[#00FF87] font-mono">
                          <span className="mr-2">{c.flag}</span>{c.name.toUpperCase()}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom" className="text-[#00FF87] font-mono">OTHER / CUSTOM...</SelectItem>
                    </SelectContent>
                  </Select>

                  {isCustomCountry && (
                    <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="ENTER COUNTRY"
                      className="w-full text-sm font-mono bg-black py-2.5 px-3 outline-none uppercase"
                      style={{ border: '1px solid #FF006E', color: '#fff', caretColor: '#FF006E' }} autoFocus />
                  )}

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
            {realUniversities.map((u) => (
              <UniversityCard 
                key={u.id} 
                university={u} 
                onEdit={() => handleStartEdit(u)}
                onDelete={() => handleDelete(u)}
              />
            ))}
            {realUniversities.length === 0 && (
              <div className="py-12 text-center font-mono text-xs border border-dashed border-[#222]" style={{ color: '#444' }}>
                {"// NO UNIVERSITIES TRACKED"}
              </div>
            )}
          </div>
        </div>

        {/* Global Documents checklist column */}
        {globalDocs && (
          <div className="lg:col-span-1 bg-[#050505] p-5 relative"
            style={{
              borderLeft: '2px solid #00FF87',
              borderRight: '2px solid #FF006E',
              borderTop: '1px solid #1a1a1a',
              borderBottom: '1px solid #1a1a1a',
              boxShadow: '0 0 20px rgba(0, 255, 135, 0.04), 0 0 20px rgba(255, 0, 110, 0.04)',
              background: 'rgba(5, 5, 5, 0.85)',
              backdropFilter: 'blur(8px)'
            }}>
            <div className="flex items-center justify-between border-b border-[#00FF87]/20 pb-3 mb-4">
              <div>
                <h2 className="text-sm font-bold font-mono tracking-wider text-[#00FF87]" style={{ textShadow: '0 0 8px rgba(0,255,135,0.3)' }}>{"// GLOBAL DOCUMENTS"}</h2>
                <p className="text-[10px] font-mono text-gray-500 mt-0.5 uppercase">Track overall application files</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[#00FF87]">{globalCompletedCount}/{localGlobalReqs.length} READY</span>
                <div className="w-20 h-1.5 bg-[#111] border border-[#222] mt-1 inline-block">
                  <div className="h-full transition-all" style={{ width: `${globalProgressPct}%`, background: '#00FF87', boxShadow: '0 0 4px #00FF87' }} />
                </div>
              </div>
            </div>

            {/* Checklist Checkboxes - 2 columns on tablet and desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 mb-4">
              {localGlobalReqs.map((req, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 px-3 border border-[#222] bg-black hover:border-[#00FF87]/30 transition-all group/item"
                >
                  <button
                    onClick={() => handleToggleGlobalReq(idx)}
                    className="flex items-center gap-2 text-left flex-1"
                  >
                    <div className="w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center transition-all"
                      style={{
                        borderColor: req.completed ? '#00FF87' : '#333',
                        background: req.completed ? '#00FF87' : 'transparent',
                      }}>
                      {req.completed && <Check className="w-2 h-2 text-black" strokeWidth={3} />}
                    </div>
                    <span className="text-[11px] font-mono tracking-wide uppercase" style={{ color: req.completed ? '#00FF87' : '#666' }}>
                      {req.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeGlobalDoc(idx)}
                    className="text-[10px] font-bold text-[#FF006E] hover:text-white opacity-0 group-hover/item:opacity-100 transition-opacity pl-2"
                    title="Remove Document"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {localGlobalReqs.length === 0 && (
                <div className="col-span-full text-center py-4 font-mono text-xs text-[#333]">
                  {"// NO DOCUMENTS ADDED"}
                </div>
              )}
            </div>

            {/* Add custom document input + suggestions */}
            <div className="border-t border-[#222] pt-4 space-y-4">
              <div>
                <span className="text-[9px] font-mono text-[#888] block mb-1 uppercase">{"// ADD CUSTOM DOCUMENT"}</span>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addGlobalDoc(newGlobalDoc);
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={newGlobalDoc}
                    onChange={(e) => setNewGlobalDoc(e.target.value)}
                    placeholder="E.G. GRE REPORT, CV..."
                    className="flex-1 text-[11px] font-mono bg-black py-1.5 px-3 outline-none uppercase"
                    style={{ border: '1px solid #222', color: '#fff', caretColor: '#00FF87' }}
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 font-mono font-bold text-[10px] bg-[#00FF87] text-black hover:bg-[#00FF87]/85 transition-all"
                  >
                    ADD
                  </button>
                </form>
              </div>

              {/* Quick suggestions panel */}
              <div>
                <span className="text-[9px] font-mono text-[#888] block mb-1 uppercase">{"// QUICK SUGGESTIONS"}</span>
                <div className="flex flex-wrap gap-1">
                  {['CV/RESUME', 'LOR', 'BACHELORS', 'SYLLABUS', 'LANG CERT', 'UNI-ASSIST'].map(item => {
                    const exists = localGlobalReqs.some(r => r.name.toLowerCase() === item.toLowerCase());
                    if (exists) return null;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => addGlobalDoc(item)}
                        className="text-[8px] font-mono border border-[#222] px-1.5 py-0.5 text-[#444] hover:text-[#00FF87] hover:border-[#00FF87] transition-all uppercase"
                      >
                        + {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EDIT UNIVERSITY DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md bg-black border-[#FF006E] text-white font-mono"
          style={{ boxShadow: '6px 6px 0 #00FF87' }}>
          <DialogHeader>
            <DialogTitle className="text-[#FF006E] font-mono tracking-widest">{"// EDIT UNIVERSITY"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-3 mt-2">
            <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="UNIVERSITY NAME"
              className="w-full text-sm font-mono bg-black py-2.5 px-3 outline-none uppercase"
              style={{ border: '1px solid #FF006E', color: '#fff', caretColor: '#FF006E' }} autoFocus />
            
            <Select value={editIsCustomCountry ? 'custom' : editCountry} onValueChange={(val) => {
              if (val === 'custom') {
                setEditIsCustomCountry(true);
                setEditCountry('');
              } else {
                setEditIsCustomCountry(false);
                setEditCountry(val);
              }
            }}>
              <SelectTrigger className="bg-black border-[#333] text-[#888] font-mono w-full">
                <SelectValue placeholder="SELECT COUNTRY" />
              </SelectTrigger>
              <SelectContent className="bg-black border-[#00FF87] font-mono max-h-[200px] overflow-y-auto">
                {COUNTRIES.map(c => (
                  <SelectItem key={c.name} value={c.name} className="text-[#00FF87] font-mono">
                    <span className="mr-2">{c.flag}</span>{c.name.toUpperCase()}
                  </SelectItem>
                ))}
                <SelectItem value="custom" className="text-[#00FF87] font-mono">OTHER / CUSTOM...</SelectItem>
              </SelectContent>
            </Select>

            {editIsCustomCountry && (
              <input value={editCountry} onChange={(e) => setEditCountry(e.target.value)} placeholder="ENTER COUNTRY"
                className="w-full text-sm font-mono bg-black py-2.5 px-3 outline-none uppercase"
                style={{ border: '1px solid #FF006E', color: '#fff', caretColor: '#FF006E' }} autoFocus />
            )}

            <input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)}
              className="w-full text-sm font-mono bg-black py-2.5 px-3 outline-none"
              style={{ border: '1px solid #333', color: '#888' }} />
            <Select value={editStatus} onValueChange={setEditStatus}>
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
              SAVE CHANGES
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}