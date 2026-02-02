import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingPayload {
  noteId: string;
  text: string;
  userId: string;
}

// Generate a unique session ID for this browser tab
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('typing-session-id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('typing-session-id', sessionId);
  }
  return sessionId;
};

export function useRealtimeTyping(voidId: string | null) {
  const sessionId = useRef(getSessionId());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [remoteTexts, setRemoteTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    const channelName = `typing-${voidId ?? 'public'}`;
    
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const data = payload.payload as TypingPayload;
        // Ignore our own broadcasts
        if (data.userId === sessionId.current) return;
        
        setRemoteTexts(prev => ({
          ...prev,
          [data.noteId]: data.text,
        }));
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [voidId]);

  const broadcastTyping = useCallback((noteId: string, text: string) => {
    if (!channelRef.current) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        noteId,
        text,
        userId: sessionId.current,
      } as TypingPayload,
    });
  }, []);

  const clearRemoteText = useCallback((noteId: string) => {
    setRemoteTexts(prev => {
      const next = { ...prev };
      delete next[noteId];
      return next;
    });
  }, []);

  return {
    remoteTexts,
    broadcastTyping,
    clearRemoteText,
    sessionId: sessionId.current,
  };
}
