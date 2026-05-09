import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Copy, Trash2, Check, Users, Briefcase, Sparkles } from 'lucide-react';
import { LocalVoid, BoardType } from '@/hooks/useLocalVoids';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoidSwitcherProps {
  currentVoidId: string | null;
  voids: LocalVoid[];
  onSwitchVoid: (id: string | null) => void;
  onCreateVoid: (name: string, boardType?: BoardType) => void;
  onDeleteVoid: (id: string) => void;
  onJoinVoid: (v: LocalVoid) => void;
}

export function VoidSwitcher({ currentVoidId, voids, onSwitchVoid, onCreateVoid, onDeleteVoid, onJoinVoid }: VoidSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'list' | 'create-cosmic' | 'create-office' | 'join'>('list');
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const current = voids.find(v => v.id === currentVoidId);
  const isOffice = current?.boardType === 'office';

  useEffect(() => {
    if (mode !== 'list') setTimeout(() => inputRef.current?.focus(), 50);
  }, [mode]);

  const handleCreate = (boardType: BoardType) => {
    if (!newName.trim()) return;
    onCreateVoid(newName.trim(), boardType);
    setNewName('');
    setMode('list');
    setIsOpen(false);
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    
    const { data, error } = await supabase.rpc('lookup_multiplayer_void', { _invite_code: code });
    
    if (error || !data || data.length === 0) {
      toast({ title: 'Void not found', description: 'No void exists with that invite code.' });
      return;
    }

    const found: any = data[0];
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('void_members').insert({ void_id: found.id, user_id: user.id }).select();
    }
    
    // Look up board_type directly from voids table since RPC may not return it
    const { data: voidRow } = await supabase.from('voids').select('board_type').eq('id', found.id).single();
    const boardType: BoardType = ((voidRow as any)?.board_type === 'office' ? 'office' : 'cosmic');

    const localVoid: LocalVoid = {
      id: found.id,
      name: found.name,
      createdAt: Date.now(),
      inviteCode: found.invite_code ?? code,
      boardType,
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
        className={`flex items-center gap-2 px-4 py-2 border transition-colors ${
          isOffice
            ? 'border-zinc-400 bg-gradient-to-b from-zinc-200 to-zinc-300 text-zinc-800 hover:from-zinc-100 hover:to-zinc-200 shadow-sm'
            : 'border-foreground bg-background hover:bg-muted'
        }`}
      >
        {isOffice ? <Briefcase size={13} /> : <Sparkles size={13} />}
        <span className={`text-sm max-w-32 truncate ${isOffice ? 'font-sans tracking-wide' : 'font-mono uppercase tracking-wider'}`}>
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
                  <div className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Your Boards</div>
                  {voids.map(v => (
                    <div key={v.id} className={`flex items-center gap-1 px-4 py-2 hover:bg-muted transition-colors ${currentVoidId === v.id ? 'bg-muted' : ''}`}>
                      <button onClick={() => { onSwitchVoid(v.id); close(); }} className="flex-1 flex items-center gap-2 text-left text-sm font-mono uppercase tracking-wider truncate">
                        {v.boardType === 'office' ? <Briefcase size={12} className="opacity-60 flex-shrink-0" /> : <Sparkles size={12} className="opacity-60 flex-shrink-0" />}
                        <span className="truncate">{v.name}</span>
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

              {(mode === 'create-cosmic' || mode === 'create-office') && (
                <div className="flex items-center gap-2 px-4 py-2">
                  <input ref={inputRef} value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(mode === 'create-office' ? 'office' : 'cosmic'); if (e.key === 'Escape') setMode('list'); }}
                    placeholder={mode === 'create-office' ? 'office board name...' : 'void name...'}
                    className="flex-1 bg-transparent border-b border-foreground text-sm font-mono uppercase tracking-wider focus:outline-none placeholder:opacity-30 py-1"
                  />
                  <button onClick={() => handleCreate(mode === 'create-office' ? 'office' : 'cosmic')} className="p-1 hover:opacity-70"><Check size={14} /></button>
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
                  <button onClick={() => setMode('create-cosmic')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left text-muted-foreground hover:text-foreground">
                    <Sparkles size={15} />
                    <span className="text-sm font-mono uppercase tracking-wider">New Cosmic Void</span>
                  </button>
                  <button onClick={() => setMode('create-office')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left text-muted-foreground hover:text-foreground">
                    <Briefcase size={15} />
                    <span className="text-sm font-mono uppercase tracking-wider">New Office Board</span>
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
