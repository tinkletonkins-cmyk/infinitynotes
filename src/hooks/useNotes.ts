import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NoteShape } from '@/components/NoteShapePicker';

// High-speed sync interval (1.2 seconds - Discord/Slack level)
const HEARTBEAT_INTERVAL_MS = 1200;

export interface Note {
  id: string;
  text: string;
  position: { x: number; y: number };
  rotation: number;
  parent_id: string | null;
  color: string | null;
  shape: NoteShape;
  void_id: string | null;
  tags: string[];
  is_locked: boolean;
  locked_by: string | null;
}

function generateId(): string {
  return crypto.randomUUID();
}

function getRandomRotation(): number {
  return (Math.random() * 4) - 2; // -2 to +2 degrees
}

function getRandomPosition(): { x: number; y: number } {
  // Spread notes across a wide canvas area, not just the viewport
  const CANVAS_W = 3000;
  const CANVAS_H = 2000;
  return {
    x: Math.random() * CANVAS_W - CANVAS_W / 2 + window.innerWidth / 2,
    y: Math.random() * CANVAS_H - CANVAS_H / 2 + window.innerHeight / 2,
  };
}

export function useNotes(voidId: string | null = null) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  
  // Track which notes are currently being edited locally
  const editingNotesRef = useRef<Set<string>>(new Set());
  // Track notes that were recently dragged — skip position sync for these
  const recentlyDraggedRef = useRef<Map<string, number>>(new Map());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to convert DB row to Note
  const dbRowToNote = (n: any): Note => ({
    id: n.id,
    text: n.text,
    position: { x: n.position_x, y: n.position_y },
    rotation: n.rotation,
    parent_id: n.parent_id,
    color: n.color ?? null,
    shape: (n.shape as NoteShape) ?? 'square',
    void_id: n.void_id ?? null,
    tags: n.tags ?? [],
    is_locked: n.is_locked ?? false,
    locked_by: n.locked_by ?? null,
  });

  // Mark a note as being edited (call from StickyNote on focus)
  const setNoteEditing = useCallback((noteId: string, isEditing: boolean) => {
    if (isEditing) {
      editingNotesRef.current.add(noteId);
    } else {
      editingNotesRef.current.delete(noteId);
    }
  }, []);

  // Fetch initial notes for current void - BEFORE realtime starts
  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true);
      
      let query = supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (voidId) {
        query = query.eq('void_id', voidId);
      } else {
        query = query.is('void_id', null);
      }
      
      const { data, error } = await query;
      
      if (!error && data) {
        setNotes(data.map(dbRowToNote));
        setLastSyncTime(Date.now());
      }
      setIsLoading(false);
    };
    
    fetchNotes();
  }, [voidId]);

  // High-Speed Heartbeat Sync: Every 1.2 seconds, fetch and reconcile notes
  useEffect(() => {
    // Don't start heartbeat until initial fetch is done
    if (isLoading) return;
    
    const heartbeatSync = async () => {
      // Don't sync if page is hidden (save resources)
      if (document.hidden) return;
      
      setIsSyncing(true);
      
      let query = supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (voidId) {
        query = query.eq('void_id', voidId);
      } else {
        query = query.is('void_id', null);
      }
      
      const { data, error } = await query;
      
      setIsSyncing(false);
      setLastSyncTime(Date.now());
      
      if (error || !data) return;
      
      const dbNotes = data.map(dbRowToNote);
      const dbNoteMap = new Map(dbNotes.map(n => [n.id, n]));
      
      setNotes(prevNotes => {
        const prevNoteMap = new Map(prevNotes.map(n => [n.id, n]));
        let hasChanges = false;
        
        // Check for new notes or updated notes
        const updatedNotes = prevNotes.map(localNote => {
          // FOCUS PROTECTION: Skip notes being actively edited
          if (editingNotesRef.current.has(localNote.id)) {
            return localNote;
          }
          
          const dbNote = dbNoteMap.get(localNote.id);
          if (!dbNote) return localNote; // Note deleted, will be handled below
          
          // Compare key fields
          const hasTextChange = dbNote.text !== localNote.text;
          const hasColorChange = dbNote.color !== localNote.color;
          const hasPositionChange = 
            dbNote.position.x !== localNote.position.x || 
            dbNote.position.y !== localNote.position.y;
          const hasShapeChange = dbNote.shape !== localNote.shape;
          const hasTagsChange = JSON.stringify(dbNote.tags) !== JSON.stringify(localNote.tags);
          const hasLockChange = dbNote.is_locked !== localNote.is_locked || dbNote.locked_by !== localNote.locked_by;
          
          if (hasTextChange || hasColorChange || hasPositionChange || hasShapeChange || hasTagsChange || hasLockChange) {
            hasChanges = true;
            return dbNote;
          }
          
          return localNote;
        });
        
        // Check for new notes added by other users
        dbNotes.forEach(dbNote => {
          if (!prevNoteMap.has(dbNote.id)) {
            hasChanges = true;
            updatedNotes.push(dbNote);
          }
        });
        
        // Check for deleted notes
        const dbIds = new Set(dbNotes.map(n => n.id));
        const filteredNotes = updatedNotes.filter(n => dbIds.has(n.id));
        if (filteredNotes.length !== updatedNotes.length) {
          hasChanges = true;
        }
        
        return hasChanges ? filteredNotes : prevNotes;
      });
    };
    
    // Start heartbeat interval
    const intervalId = setInterval(heartbeatSync, HEARTBEAT_INTERVAL_MS);
    heartbeatIntervalRef.current = intervalId;
    
    // Also sync when tab becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        heartbeatSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup on unmount or when leaving the site
    return () => {
      clearInterval(intervalId);
      heartbeatIntervalRef.current = null;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [voidId, isLoading]);

  // Subscribe to realtime changes for current void
  useEffect(() => {
    const channel = supabase
      .channel(`notes-realtime-${voidId ?? 'public'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        (payload) => {
          const n = payload.new as any;
          const noteVoidId = n?.void_id ?? null;
          const oldNoteVoidId = (payload.old as any)?.void_id ?? null;
          
          // Only process events for current void
          if (payload.eventType === 'INSERT') {
            if (noteVoidId !== voidId) return;
            setNotes(prev => {
              if (prev.some(note => note.id === n.id)) return prev;
              return [...prev, dbRowToNote(n)];
            });
          } else if (payload.eventType === 'UPDATE') {
            if (noteVoidId !== voidId) return;
            // Skip update if note is being locally edited
            if (editingNotesRef.current.has(n.id)) return;
            setNotes(prev => prev.map(note => 
              note.id === n.id ? dbRowToNote(n) : note
            ));
          } else if (payload.eventType === 'DELETE') {
            const oldN = payload.old as any;
            if (oldNoteVoidId !== voidId) return;
            setNotes(prev => prev.filter(note => note.id !== oldN.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [voidId]);

  const addNote = useCallback(async (parentId?: string, parentPosition?: { x: number; y: number }) => {
    const id = generateId();
    const position = parentPosition 
      ? { x: parentPosition.x + 20, y: parentPosition.y + 20 }
      : getRandomPosition();
    const rotation = getRandomRotation();

    // Optimistic update
    const newNote: Note = {
      id,
      text: '',
      position,
      rotation,
      parent_id: parentId || null,
      color: null,
      shape: 'square',
      void_id: voidId,
      tags: [],
      is_locked: false,
      locked_by: null,
    };
    setNotes(prev => [...prev, newNote]);

    // Persist to database
    await supabase.from('notes').insert({
      id,
      text: '',
      position_x: position.x,
      position_y: position.y,
      rotation,
      parent_id: parentId || null,
      color: null,
      void_id: voidId,
    });

    return id;
  }, [voidId]);

  const updateNote = useCallback(async (id: string, updates: Partial<Pick<Note, 'text' | 'position' | 'color' | 'parent_id' | 'shape' | 'tags' | 'is_locked' | 'locked_by'>>) => {
    // Optimistic update
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, ...updates } : note
    ));

    // Persist to database
    const dbUpdates: any = {};
    if (updates.text !== undefined) dbUpdates.text = updates.text;
    if (updates.position) {
      dbUpdates.position_x = updates.position.x;
      dbUpdates.position_y = updates.position.y;
    }
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.parent_id !== undefined) dbUpdates.parent_id = updates.parent_id;
    if (updates.shape !== undefined) dbUpdates.shape = updates.shape;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.is_locked !== undefined) dbUpdates.is_locked = updates.is_locked;
    if (updates.locked_by !== undefined) dbUpdates.locked_by = updates.locked_by;

    await supabase.from('notes').update(dbUpdates).eq('id', id);
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    // Optimistic update
    setNotes(prev => prev.filter(note => note.id !== id));
    
    // Delete from database
    await supabase.from('notes').delete().eq('id', id);
  }, []);

  return { notes, isLoading, isSyncing, lastSyncTime, addNote, updateNote, deleteNote, setNoteEditing };
}
