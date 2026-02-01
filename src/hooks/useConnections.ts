import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Connection {
  id: string;
  from_note_id: string;
  to_note_id: string;
}

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial connections
  useEffect(() => {
    const fetchConnections = async () => {
      const { data, error } = await supabase
        .from('note_connections')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        setConnections(data.map(c => ({
          id: c.id,
          from_note_id: c.from_note_id,
          to_note_id: c.to_note_id,
        })));
      }
      setIsLoading(false);
    };
    
    fetchConnections();
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('connections-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'note_connections' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const c = payload.new as any;
            setConnections(prev => {
              if (prev.some(conn => conn.id === c.id)) return prev;
              return [...prev, {
                id: c.id,
                from_note_id: c.from_note_id,
                to_note_id: c.to_note_id,
              }];
            });
          } else if (payload.eventType === 'DELETE') {
            const c = payload.old as any;
            setConnections(prev => prev.filter(conn => conn.id !== c.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addConnection = useCallback(async (fromNoteId: string, toNoteId: string) => {
    // Check if connection already exists (in either direction)
    const exists = connections.some(c => 
      (c.from_note_id === fromNoteId && c.to_note_id === toNoteId) ||
      (c.from_note_id === toNoteId && c.to_note_id === fromNoteId)
    );
    
    if (exists || fromNoteId === toNoteId) return null;

    const id = crypto.randomUUID();
    
    // Optimistic update
    const newConnection: Connection = {
      id,
      from_note_id: fromNoteId,
      to_note_id: toNoteId,
    };
    setConnections(prev => [...prev, newConnection]);

    // Persist to database
    const { error } = await supabase.from('note_connections').insert({
      id,
      from_note_id: fromNoteId,
      to_note_id: toNoteId,
    });

    if (error) {
      // Rollback on error
      setConnections(prev => prev.filter(c => c.id !== id));
      return null;
    }

    return id;
  }, [connections]);

  const removeConnection = useCallback(async (id: string) => {
    // Optimistic update
    setConnections(prev => prev.filter(c => c.id !== id));
    
    await supabase.from('note_connections').delete().eq('id', id);
  }, []);

  const removeConnectionsForNote = useCallback(async (noteId: string) => {
    const toRemove = connections.filter(c => 
      c.from_note_id === noteId || c.to_note_id === noteId
    );
    
    // Optimistic update
    setConnections(prev => prev.filter(c => 
      c.from_note_id !== noteId && c.to_note_id !== noteId
    ));
    
    // Delete from database
    for (const conn of toRemove) {
      await supabase.from('note_connections').delete().eq('id', conn.id);
    }
  }, [connections]);

  return { connections, isLoading, addConnection, removeConnection, removeConnectionsForNote };
}
