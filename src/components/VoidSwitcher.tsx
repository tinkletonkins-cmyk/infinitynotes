import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Copy, Trash2, Check, Users } from 'lucide-react';
import { LocalVoid } from '@/hooks/useLocalVoids';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoidSwitcherProps {
  currentVoidId: string | null;
  voids: LocalVoid[];
  onSwitchVoid: (id: string | null) => void;
  onCreateVoid: (name: string) => void;
  onDeleteVoid: (id: string) => void;
  onJoinVoid: (v: LocalVoid) => void;
}

export function VoidSwitcher({ currentVoidId, voids, onSwitchVoid, onCreateVoid, onDeleteVoid, onJoinVoid }: VoidSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'list' | 'create' | 'join'>('list');
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const current = voids.find(v => v.id === currentVoidId);

  useEffect(() => {
    if (mode !== 'list') setTimeout(() => inputRef.current?.focus(), 50);
  }, [mode]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateVoid(newName.trim());
    setNewName('');
    setMode('list');
    setIsOpen(false);
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    
    // Use RPC to look up void — works for both guests and signed-in users
    const { data, error } = await supabase.rpc('lookup_multiplayer_void', { _invite_code: code });
    
    if (error || !data || data.length === 0) {
      toast({ title: 'Void not found', description: 'No void exists with that invite code.' });
      return;
    }

    const found = data[0];
    
    // Add as a member if authenticated (optional, not required)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('void_members').insert({ void_id: found.id, user_id: user.id }).select().catch(() => {});
    }
    
    const localVoid: LocalVoid = {
      id: found.id,
      name: found.name,
      createdAt: Date.now(),
      inviteCode: found.invite_code ?? code,
    };
    onJoinVoid(localVoid);
    onSwitchVoid(found.id);
    toast({ title: `Joined ${found.name}` });
    setJoinCode('');
    setMode('list');
    setIsOpen(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Code copied', description: `Share "${code}" to invite others.` });
  };

  const close = () => { setIsOpen(false); setMode('list'); };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2 border border-foreground bg-background hover:bg-muted transition-colors"
      >
        <span className="text-sm font-mono uppercase tracking-wider max-w-32 truncate">
          {current ? current.name : 'Select Void'}
        </span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[199]" onClick={close} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full left-0 mt-2 w-72 border border-foreground bg-background z-[200]"
            >
              <button
                onClick={() => { onSwitchVoid(null); close(); }}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors text-left ${!currentVoidId ? 'bg-muted' : ''}`}
              >
                <span className="text-sm font-mono uppercase tracking-wider">The Void (public)</span>
                {!currentVoidId && <Check size={13} />}
              </button>

              {voids.length > 0 && (
                <>
                  <div className="border-t border-foreground/20" />
                  <div className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Multiplayer</div>
                  {voids.map(v => (
                    <div key={v.id} className={`flex items-center gap-1 px-4 py-2 hover:bg-muted transition-colors ${currentVoidId === v.id ? 'bg-muted' : ''}`}>
                      <button onClick={() => { onSwitchVoid(v.id); close(); }} className="flex-1 text-left text-sm font-mono uppercase tracking-wider truncate">
                        {v.name}
                      </button>
                      <button onClick={() => copyCode(v.inviteCode)} className="p-1.5 opacity-50 hover:opacity-100" title={`Code: ${v.inviteCode}`}>
                        <Copy size={13} />
                      </button>
                      <button onClick={() => { onDeleteVoid(v.id); if (currentVoidId === v.id) onSwitchVoid(null); }} className="p-1.5 opacity-50 hover:opacity-100 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </>
              )}

              <div className="border-t border-foreground/20" />

              {mode === 'create' && (
                <div className="flex items-center gap-2 px-4 py-2">
                  <input ref={inputRef} value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setMode('list'); }}
                    placeholder="void name..."
                    className="flex-1 bg-transparent border-b border-foreground text-sm font-mono uppercase tracking-wider focus:outline-none placeholder:opacity-30 py-1"
                  />
                  <button onClick={handleCreate} className="p-1 hover:opacity-70"><Check size={14} /></button>
                </div>
              )}

              {mode === 'join' && (
                <div className="flex items-center gap-2 px-4 py-2">
                  <input ref={inputRef} value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === 'Enter') handleJoin(); if (e.key === 'Escape') setMode('list'); }}
                    placeholder="enter code..." maxLength={8}
                    className="flex-1 bg-transparent border-b border-foreground text-sm font-mono uppercase tracking-wider focus:outline-none placeholder:opacity-30 py-1"
                  />
                  <button onClick={handleJoin} className="p-1 hover:opacity-70">
                    <Check size={14} />
                  </button>
                </div>
              )}

              {mode === 'list' && (
                <>
                  <button onClick={() => setMode('create')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left text-muted-foreground hover:text-foreground">
                    <Plus size={15} />
                    <span className="text-sm font-mono uppercase tracking-wider">New Multiplayer Void</span>
                  </button>
                  <button onClick={() => setMode('join')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left text-muted-foreground hover:text-foreground">
                    <Users size={15} />
                    <span className="text-sm font-mono uppercase tracking-wider">Join with Code</span>
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
