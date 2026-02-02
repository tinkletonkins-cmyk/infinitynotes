import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrailPoint {
  id: string;
  x: number;
  y: number;
  rotation: number;
  timestamp: number;
}

interface NoteTrailProps {
  noteId: string;
  isDragging: boolean;
  x: number;
  y: number;
  rotation: number;
  color: string | null;
}

const TRAIL_INTERVAL = 50; // ms between trail points
const TRAIL_LIFETIME = 600; // ms before trail fades completely
const MAX_TRAIL_POINTS = 12;

export function NoteTrail({ noteId, isDragging, x, y, rotation, color }: NoteTrailProps) {
  const [trails, setTrails] = useState<TrailPoint[]>([]);
  
  // Add trail points while dragging
  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const addTrailPoint = () => {
      const newPoint: TrailPoint = {
        id: `${noteId}-${Date.now()}-${Math.random()}`,
        x,
        y,
        rotation,
        timestamp: Date.now(),
      };

      setTrails(prev => {
        const updated = [...prev, newPoint];
        // Limit trail length
        if (updated.length > MAX_TRAIL_POINTS) {
          return updated.slice(-MAX_TRAIL_POINTS);
        }
        return updated;
      });
    };

    // Add initial point
    addTrailPoint();

    const interval = setInterval(addTrailPoint, TRAIL_INTERVAL);
    return () => clearInterval(interval);
  }, [isDragging, x, y, rotation, noteId]);

  // Clean up old trail points
  useEffect(() => {
    if (trails.length === 0) return;

    const cleanup = setInterval(() => {
      const now = Date.now();
      setTrails(prev => prev.filter(t => now - t.timestamp < TRAIL_LIFETIME));
    }, 100);

    return () => clearInterval(cleanup);
  }, [trails.length]);

  // Clear trails when drag ends
  useEffect(() => {
    if (!isDragging && trails.length > 0) {
      // Let existing trails fade out naturally
      const timeout = setTimeout(() => {
        setTrails([]);
      }, TRAIL_LIFETIME);
      return () => clearTimeout(timeout);
    }
  }, [isDragging]);

  const getOpacity = useCallback((timestamp: number) => {
    const age = Date.now() - timestamp;
    const progress = age / TRAIL_LIFETIME;
    return Math.max(0, 0.3 - (progress * 0.3));
  }, []);

  const getScale = useCallback((timestamp: number) => {
    const age = Date.now() - timestamp;
    const progress = age / TRAIL_LIFETIME;
    return Math.max(0.7, 1 - (progress * 0.3));
  }, []);

  if (trails.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <AnimatePresence>
        {trails.map((trail, index) => (
          <motion.div
            key={trail.id}
            initial={{ opacity: 0.3, scale: 1 }}
            animate={{ 
              opacity: getOpacity(trail.timestamp),
              scale: getScale(trail.timestamp),
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              left: trail.x,
              top: trail.y,
              width: 256,
              height: 128,
              transform: `rotate(${trail.rotation}deg)`,
              background: color || 'hsl(var(--muted))',
              border: '1px solid hsl(var(--foreground) / 0.2)',
              filter: 'blur(2px)',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
