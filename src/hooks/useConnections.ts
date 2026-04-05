import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Connection {
  id: string;
  from_note_id: string;
  to_note_id: string;
  void_id: string | null;
}

export function useConnections(voidId: string | null = null) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial connections for current void
  useEffect(() => {
    const fetchConnections = async () => {
      setIsLoading(true);
      let query = supabase
        .from('note_connections')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (voidId) {
        query = query.eq('void_id', voidId);
      } else {
        query = query.is('void_id', null);
      }
      
      const { data, error } = await query;
      
      if (!error && data) {
        setConnections(data.map(c => ({
          id: c.id,
          from_note_id: c.from_note_id,
          to_note_id: c.to_note_id,
          void_id: c.void_id ?? null,
        })));
      }
      setIsLoading(false);
    };
    
    fetchConnections();
  }, [voidId]);

  // Subscribe to realtime changes for current void
  useEffect(() => {
    const channel = supabase
      .channel(`connections-realtime-${voidId ?? 'public'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'note_connections' },
        (payload) => {
          const c = payload.new as any;
          const connVoidId = c?.void_id ?? null;
          const oldConnVoidId = (payload.old as any)?.void_id ?? null;
          
          if (payload.eventType === 'INSERT') {
            if (connVoidId !== voidId) return;
            setConnections(prev => {
              if (prev.some(conn => conn.id === c.id)) return prev;
              return [...prev, {
                id: c.id,
                from_note_id: c.from_note_id,
                to_note_id: c.to_note_id,
                void_id: c.void_id ?? null,
              }];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldC = payload.old as any;
            if (oldConnVoidId !== voidId) return;
            setConnections(prev => prev.filter(conn => conn.id !== oldC.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [voidId]);

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
      void_id: voidId,
    };
    setConnections(prev => [...prev, newConnection]);

    // Persist to database
    const { error } = await supabase.from('note_connections').insert({
      id,
      from_note_id: fromNoteId,
      to_note_id: toNoteId,
      void_id: voidId,
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
    
    const { error } = await supabase.from('note_connections').delete().eq('id', id);
    if (error) {
      console.error('[useConnections] Failed to remove connection:', error);
    }
  }, []);

  const removeConnectionsForNote = useCallback(async (noteId: string) => {
    const toRemove = connections.filter(c => 
      c.from_note_id === noteId || c.to_note_id === noteId
    );
    
    // Optimistic update
    setConnections(prev => prev.filter(c => 
      c.from_note_id !== noteId && c.to_note_id !== noteId
    ));
    
    // Delete all in parallel
    const results = await Promise.all(
      toRemove.map(conn => supabase.from('note_connections').delete().eq('id', conn.id))
    );
    results.forEach(({ error }) => {
      if (error) console.error('[useConnections] Failed to remove connection:', error);
    });
  }, [connections]);

  return { connections, isLoading, addConnection, removeConnection, removeConnectionsForNote };
}
