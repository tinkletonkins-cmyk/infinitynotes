import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Note {
  id: string;
  text: string;
  position: { x: number; y: number };
  rotation: number;
  parent_id: string | null;
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

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial notes
  useEffect(() => {
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        setNotes(data.map(n => ({
          id: n.id,
          text: n.text,
          position: { x: n.position_x, y: n.position_y },
          rotation: n.rotation,
          parent_id: n.parent_id,
        })));
      }
      setIsLoading(false);
    };
    
    fetchNotes();
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('notes-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const n = payload.new as any;
            setNotes(prev => {
              if (prev.some(note => note.id === n.id)) return prev;
              return [...prev, {
                id: n.id,
                text: n.text,
                position: { x: n.position_x, y: n.position_y },
                rotation: n.rotation,
                parent_id: n.parent_id,
              }];
            });
          } else if (payload.eventType === 'UPDATE') {
            const n = payload.new as any;
            setNotes(prev => prev.map(note => 
              note.id === n.id 
                ? { ...note, text: n.text, position: { x: n.position_x, y: n.position_y } }
                : note
            ));
          } else if (payload.eventType === 'DELETE') {
            const n = payload.old as any;
            setNotes(prev => prev.filter(note => note.id !== n.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addNote = useCallback(async (parentId?: string, parentPosition?: { x: number; y: number }) => {
    const id = generateId();
    const position = parentPosition 
      ? { x: parentPosition.x + 20, y: parentPosition.y + 20 } // Stack offset
      : getRandomPosition();
    const rotation = getRandomRotation();

    // Optimistic update
    const newNote: Note = {
      id,
      text: '',
      position,
      rotation,
      parent_id: parentId || null,
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
    });

    return id;
  }, []);

  const updateNote = useCallback(async (id: string, updates: Partial<Pick<Note, 'text' | 'position'>>) => {
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
