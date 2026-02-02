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

interface CursorPayload {
  x: number;
  y: number;
  userId: string;
  username: string;
}

interface RemoteNote {
  text: string;
  color: string | null;
}

interface RemotePosition {
  x: number;
  y: number;
}

export interface RemoteCursor {
  id: string;
  x: number;
  y: number;
  username: string;
  lastSeen: number;
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

// Generate a fun random username
const getUsername = () => {
  let username = sessionStorage.getItem('cursor-username');
  if (!username) {
    const adjectives = ['Cosmic', 'Lunar', 'Stellar', 'Mystic', 'Neon', 'Void', 'Shadow', 'Crystal', 'Astral', 'Ember'];
    const nouns = ['Seeker', 'Drifter', 'Walker', 'Weaver', 'Spirit', 'Phoenix', 'Echo', 'Wave', 'Spark', 'Ghost'];
    const num = Math.floor(Math.random() * 99) + 1;
    username = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${num}`;
    sessionStorage.setItem('cursor-username', username);
  }
  return username;
};

const THROTTLE_MS = 100;
const CURSOR_THROTTLE_MS = 50;
const CURSOR_TIMEOUT_MS = 5000;

export function useRealtimeTyping(voidId: string | null) {
  const sessionId = useRef(getSessionId());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [remoteNotes, setRemoteNotes] = useState<Record<string, RemoteNote>>({});
  const [remotePositions, setRemotePositions] = useState<Record<string, RemotePosition>>({});
  const [remoteCursors, setRemoteCursors] = useState<Record<string, RemoteCursor>>({});
  const username = useRef(getUsername());
  
  // Throttle state refs
  const lastTypingCall = useRef<Record<string, number>>({});
  const lastPositionCall = useRef<Record<string, number>>({});
  const lastCursorCall = useRef(0);

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
      .on('broadcast', { event: 'cursor' }, (payload) => {
        const data = payload.payload as CursorPayload;
        // Ignore our own broadcasts
        if (data.userId === sessionId.current) return;
        
        setRemoteCursors(prev => ({
          ...prev,
          [data.userId]: {
            id: data.userId,
            x: data.x,
            y: data.y,
            username: data.username,
            lastSeen: Date.now(),
          },
        }));
      })
      .subscribe();

    // Clean up stale cursors every 2 seconds
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setRemoteCursors(prev => {
        const next = { ...prev };
        let changed = false;
        for (const id of Object.keys(next)) {
          if (now - next[id].lastSeen > CURSOR_TIMEOUT_MS) {
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 2000);

    return () => {
      clearInterval(cleanupInterval);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [voidId]);

  const broadcastTyping = useCallback((noteId: string, text: string, color: string | null) => {
    if (!channelRef.current) return;
    
    const now = Date.now();
    const lastCall = lastTypingCall.current[noteId] || 0;
    
    if (now - lastCall < THROTTLE_MS) return;
    lastTypingCall.current[noteId] = now;
    
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
    
    const now = Date.now();
    const lastCall = lastPositionCall.current[noteId] || 0;
    
    if (now - lastCall < THROTTLE_MS) return;
    lastPositionCall.current[noteId] = now;
    
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

  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!channelRef.current) return;
    
    const now = Date.now();
    if (now - lastCursorCall.current < CURSOR_THROTTLE_MS) return;
    lastCursorCall.current = now;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor',
      payload: {
        x,
        y,
        userId: sessionId.current,
        username: username.current,
      } as CursorPayload,
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

  // Convert cursors object to array for rendering
  const cursorsArray = Object.values(remoteCursors);

  return {
    remoteNotes,
    remotePositions,
    broadcastTyping,
    broadcastPosition,
    broadcastCursor,
    clearRemoteNote,
    clearRemotePosition,
    remoteCursors: cursorsArray,
    sessionId: sessionId.current,
  };
}