import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Reaction {
  id: string;
  note_id: string;
  emoji: string;
  session_id: string;
}

// Generate a session ID for this browser session
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('reaction-session-id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('reaction-session-id', sessionId);
  }
  return sessionId;
}

export function useReactions(noteIds: string[]) {
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const sessionId = getSessionId();

  // Fetch initial reactions for all notes
  useEffect(() => {
    if (noteIds.length === 0) {
      setReactions({});
      setIsLoading(false);
      return;
    }

    const fetchReactions = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('note_reactions')
        .select('*')
        .in('note_id', noteIds);
      
      if (!error && data) {
        const grouped: Record<string, Reaction[]> = {};
        data.forEach(r => {
          if (!grouped[r.note_id]) grouped[r.note_id] = [];
          grouped[r.note_id].push({
            id: r.id,
            note_id: r.note_id,
            emoji: r.emoji,
            session_id: r.session_id,
          });
        });
        setReactions(grouped);
      }
      setIsLoading(false);
    };
    
    fetchReactions();
  }, [noteIds.join(',')]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('reactions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'note_reactions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const r = payload.new as any;
            setReactions(prev => ({
              ...prev,
              [r.note_id]: [...(prev[r.note_id] || []), {
                id: r.id,
                note_id: r.note_id,
                emoji: r.emoji,
                session_id: r.session_id,
              }],
            }));
          } else if (payload.eventType === 'DELETE') {
            const oldR = payload.old as any;
            setReactions(prev => ({
              ...prev,
              [oldR.note_id]: (prev[oldR.note_id] || []).filter(r => r.id !== oldR.id),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addReaction = useCallback(async (noteId: string, emoji: string) => {
    // Check if user already reacted with this emoji
    const existingReaction = reactions[noteId]?.find(
      r => r.emoji === emoji && r.session_id === sessionId
    );

    if (existingReaction) {
      // Toggle off - remove reaction
      await supabase.from('note_reactions').delete().eq('id', existingReaction.id);
    } else {
      // Add reaction
      await supabase.from('note_reactions').insert({
        note_id: noteId,
        emoji,
        session_id: sessionId,
      });
    }
  }, [reactions, sessionId]);

  const getReactionCounts = useCallback((noteId: string): Record<string, number> => {
    const noteReactions = reactions[noteId] || [];
    const counts: Record<string, number> = {};
    noteReactions.forEach(r => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    });
    return counts;
  }, [reactions]);

  const hasUserReacted = useCallback((noteId: string, emoji: string): boolean => {
    return (reactions[noteId] || []).some(
      r => r.emoji === emoji && r.session_id === sessionId
    );
  }, [reactions, sessionId]);

  return { 
    reactions, 
    isLoading, 
    addReaction, 
    getReactionCounts, 
    hasUserReacted,
    sessionId,
  };
}
