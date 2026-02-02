import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingPayload {
  noteId: string;
  text: string;
  color: string | null;
  userId: string;
}

interface PositionPayload {
  noteId: string;
  x: number;
  y: number;
  userId: string;
}

interface RemoteNote {
  text: string;
  color: string | null;
}

interface RemotePosition {
  x: number;
  y: number;
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
  const [remoteNotes, setRemoteNotes] = useState<Record<string, RemoteNote>>({});
  const [remotePositions, setRemotePositions] = useState<Record<string, RemotePosition>>({});

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
        
        setRemoteNotes(prev => ({
          ...prev,
          [data.noteId]: { text: data.text, color: data.color },
        }));
      })
      .on('broadcast', { event: 'position' }, (payload) => {
        const data = payload.payload as PositionPayload;
        // Ignore our own broadcasts
        if (data.userId === sessionId.current) return;
        
        setRemotePositions(prev => ({
          ...prev,
          [data.noteId]: { x: data.x, y: data.y },
        }));
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [voidId]);

  const broadcastTyping = useCallback((noteId: string, text: string, color: string | null) => {
    if (!channelRef.current) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        noteId,
        text,
        color,
        userId: sessionId.current,
      } as TypingPayload,
    });
  }, []);

  const broadcastPosition = useCallback((noteId: string, x: number, y: number) => {
    if (!channelRef.current) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'position',
      payload: {
        noteId,
        x,
        y,
        userId: sessionId.current,
      } as PositionPayload,
    });
  }, []);

  const clearRemoteNote = useCallback((noteId: string) => {
    setRemoteNotes(prev => {
      const next = { ...prev };
      delete next[noteId];
      return next;
    });
  }, []);

  const clearRemotePosition = useCallback((noteId: string) => {
    setRemotePositions(prev => {
      const next = { ...prev };
      delete next[noteId];
      return next;
    });
  }, []);

  return {
    remoteNotes,
    remotePositions,
    broadcastTyping,
    broadcastPosition,
    clearRemoteNote,
    clearRemotePosition,
    sessionId: sessionId.current,
  };
}
