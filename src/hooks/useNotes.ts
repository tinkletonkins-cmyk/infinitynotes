import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NoteShape } from '@/components/NoteShapePicker';

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
}

function generateId(): string {
  return crypto.randomUUID();
}

function getRandomRotation(): number {
  return (Math.random() * 4) - 2; // -2 to +2 degrees
}

function getRandomPosition(): { x: number; y: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  return {
    x: Math.random() * (viewportWidth - 300) + 50,
    y: Math.random() * (viewportHeight - 300) + 100,
  };
}

export function useNotes(voidId: string | null = null) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial notes for current void
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
        setNotes(data.map(n => ({
          id: n.id,
          text: n.text,
          position: { x: n.position_x, y: n.position_y },
          rotation: n.rotation,
          parent_id: n.parent_id,
          color: n.color ?? null,
          shape: (n.shape as NoteShape) ?? 'square',
          void_id: n.void_id ?? null,
          tags: n.tags ?? [],
        })));
      }
      setIsLoading(false);
    };
    
    fetchNotes();
  }, [voidId]);

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
              return [...prev, {
                id: n.id,
                text: n.text,
                position: { x: n.position_x, y: n.position_y },
                rotation: n.rotation,
                parent_id: n.parent_id,
                color: n.color ?? null,
                shape: (n.shape as NoteShape) ?? 'square',
                void_id: n.void_id ?? null,
                tags: n.tags ?? [],
              }];
            });
          } else if (payload.eventType === 'UPDATE') {
            if (noteVoidId !== voidId) return;
            setNotes(prev => prev.map(note => 
              note.id === n.id 
                ? { ...note, text: n.text, position: { x: n.position_x, y: n.position_y }, color: n.color ?? null, shape: (n.shape as NoteShape) ?? 'square', parent_id: n.parent_id, tags: n.tags ?? [] }
                : note
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

  const updateNote = useCallback(async (id: string, updates: Partial<Pick<Note, 'text' | 'position' | 'color' | 'parent_id' | 'shape' | 'tags'>>) => {
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

    await supabase.from('notes').update(dbUpdates).eq('id', id);
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    // Optimistic update
    setNotes(prev => prev.filter(note => note.id !== id));
    
    // Delete from database
    await supabase.from('notes').delete().eq('id', id);
  }, []);

  return { notes, isLoading, addNote, updateNote, deleteNote };
}
