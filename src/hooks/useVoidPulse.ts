import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PulseEvent {
  type: 'note_created' | 'reaction' | 'typing';
  intensity: number; // 0-1
  x?: number;
  y?: number;
  userId: string;
  timestamp: number;
}

interface Ripple {
  id: string;
  x: number;
  y: number;
  intensity: number;
  createdAt: number;
}

const ACTIVITY_DECAY_MS = 3000; // How fast activity level decays
const RIPPLE_LIFETIME_MS = 2000;
const ACTIVITY_SAMPLE_INTERVAL = 500;

// Get session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('pulse-session-id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('pulse-session-id', sessionId);
  }
  return sessionId;
}

export function useVoidPulse(voidId: string | null) {
  const sessionId = useRef(getSessionId());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  // Activity level from 0 (calm) to 1 (intense)
  const [activityLevel, setActivityLevel] = useState(0);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  
  // Track recent activity timestamps for decay calculation
  const recentActivity = useRef<number[]>([]);
  
  // Set up broadcast channel
  useEffect(() => {
    const channelName = `pulse-${voidId ?? 'public'}`;
    
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });
    
    channel
      .on('broadcast', { event: 'pulse' }, (payload) => {
        const data = payload.payload as PulseEvent;
        if (data.userId === sessionId.current) return;
        
        // Add to recent activity
        recentActivity.current.push(Date.now());
        
        // Create ripple if position provided
        if (data.x !== undefined && data.y !== undefined) {
          const ripple: Ripple = {
            id: crypto.randomUUID(),
            x: data.x,
            y: data.y,
            intensity: data.intensity,
            createdAt: Date.now(),
          };
          setRipples(prev => [...prev, ripple]);
        }
      })
      .subscribe();
    
    channelRef.current = channel;
    
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [voidId]);
  
  // Decay activity level over time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Remove old activity timestamps
      recentActivity.current = recentActivity.current.filter(
        t => now - t < ACTIVITY_DECAY_MS
      );
      
      // Calculate activity level based on recent events
      const eventCount = recentActivity.current.length;
      // Map event count to 0-1 range (0 events = 0, 10+ events = 1)
      const newLevel = Math.min(1, eventCount / 10);
      
      setActivityLevel(prev => {
        const diff = newLevel - prev;
        if (Math.abs(diff) < 0.01) return prev; // skip tiny updates
        return prev + diff * 0.3;
      });
      
      // Clean up old ripples
      setRipples(prev => prev.filter(r => now - r.createdAt < RIPPLE_LIFETIME_MS));
    }, ACTIVITY_SAMPLE_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);
  
  // Broadcast a pulse event
  const emitPulse = useCallback((
    type: PulseEvent['type'],
    intensity: number = 0.5,
    position?: { x: number; y: number }
  ) => {
    if (!channelRef.current) return;
    
    // Add to our own activity
    recentActivity.current.push(Date.now());
    
    // Create local ripple
    if (position) {
      const ripple: Ripple = {
        id: crypto.randomUUID(),
        x: position.x,
        y: position.y,
        intensity,
        createdAt: Date.now(),
      };
      setRipples(prev => [...prev, ripple]);
    }
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'pulse',
      payload: {
        type,
        intensity,
        x: position?.x,
        y: position?.y,
        userId: sessionId.current,
        timestamp: Date.now(),
      } as PulseEvent,
    });
  }, []);
  
  // Convenience methods
  const pulseNoteCreated = useCallback((x: number, y: number) => {
    emitPulse('note_created', 0.8, { x, y });
  }, [emitPulse]);
  
  const pulseReaction = useCallback((x: number, y: number) => {
    emitPulse('reaction', 0.6, { x, y });
  }, [emitPulse]);
  
  const pulseTyping = useCallback(() => {
    emitPulse('typing', 0.2);
  }, [emitPulse]);
  
  return {
    activityLevel,
    ripples,
    pulseNoteCreated,
    pulseReaction,
    pulseTyping,
  };
}
