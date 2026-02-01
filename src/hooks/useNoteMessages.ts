import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NoteMessage {
  id: string;
  note_id: string;
  username: string;
  content: string;
  is_ai: boolean;
  created_at: string;
}

// Generate a random anonymous username
function getAnonUsername(): string {
  const stored = sessionStorage.getItem('void-username');
  if (stored) return stored;
  
  const adjectives = ['Cosmic', 'Void', 'Shadow', 'Neon', 'Pixel', 'Ghost', 'Lunar', 'Solar'];
  const nouns = ['Wanderer', 'Dreamer', 'Seeker', 'Drifter', 'Spirit', 'Entity', 'Being'];
  const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 100)}`;
  sessionStorage.setItem('void-username', name);
  return name;
}

export function useNoteMessages(noteId: string) {
  const [messages, setMessages] = useState<NoteMessage[]>([]);
  const [username] = useState(getAnonUsername);

  // Fetch messages for this note
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('note_messages')
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };
    
    fetchMessages();
  }, [noteId]);

  // Subscribe to realtime messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${noteId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'note_messages',
          filter: `note_id=eq.${noteId}`
        },
        (payload) => {
          const msg = payload.new as NoteMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [noteId]);

  const sendMessage = useCallback(async (content: string, isAi: boolean = false) => {
    const id = crypto.randomUUID();
    
    // Optimistic update
    const newMsg: NoteMessage = {
      id,
      note_id: noteId,
      username: isAi ? 'AI' : username,
      content,
      is_ai: isAi,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMsg]);

    // Persist
    await supabase.from('note_messages').insert({
      id,
      note_id: noteId,
      username: isAi ? 'AI' : username,
      content,
      is_ai: isAi,
    });
  }, [noteId, username]);

  return { messages, username, sendMessage };
}
