import { useEffect, useRef, MutableRefObject } from 'react';
import { useMotionValue, useSpring, motion, AnimatePresence } from 'framer-motion';
import { MousePointer2 } from 'lucide-react';
import { RemoteCursor } from '@/hooks/useRealtimeTyping';

interface LiveCursorsProps {
  cursors: RemoteCursor[];
  posRef: MutableRefObject<Record<string, { x: number; y: number }>>;
}

const CURSOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

export function getCursorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

const SPRING = { stiffness: 600, damping: 40, mass: 0.3 };

function SmoothCursor({
  cursor,
  posRef,
}: {
  cursor: RemoteCursor;
  posRef: MutableRefObject<Record<string, { x: number; y: number }>>;
}) {
  const color = getCursorColor(cursor.id);
  const rawX = useMotionValue(cursor.x);
  const rawY = useMotionValue(cursor.y);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);
  const rafRef = useRef<number>();

  // Poll the ref every animation frame — zero React re-renders for position
  useEffect(() => {
    const tick = () => {
      const pos = posRef.current[cursor.id];
      if (pos) {
        rawX.set(pos.x);
        rawY.set(pos.y);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [cursor.id]);

  return (
    <motion.div
      className="absolute top-0 left-0 pointer-events-none"
      style={{ x, y, willChange: 'transform' }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.1 }}
    >
      <MousePointer2
        size={18}
        fill={color}
        stroke="rgba(0,0,0,0.5)"
        strokeWidth={1.5}
      />
      <div
        className="absolute left-4 top-3 px-1.5 py-0.5 text-[9px] font-mono whitespace-nowrap"
        style={{ backgroundColor: color, color: '#000' }}
      >
        {cursor.username}
      </div>
    </motion.div>
  );
}

export function LiveCursors({ cursors, posRef }: LiveCursorsProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      <AnimatePresence>
        {cursors.map(cursor => (
          <SmoothCursor key={cursor.id} cursor={cursor} posRef={posRef} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Local cursor — same visual as remote cursors, zero latency
export function LocalCursor({ sessionId }: { sessionId: string }) {
  const color = getCursorColor(sessionId);
  const username = sessionStorage.getItem('cursor-username') || 'You';
  const x = useMotionValue(-999);
  const y = useMotionValue(-999);
  const rafRef = useRef<number>();

  useEffect(() => {
    const onMove = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[61]"
      style={{ x, y }}
    >
      <MousePointer2
        size={28}
        fill={color}
        stroke="rgba(0,0,0,0.5)"
        strokeWidth={1.5}
      />
    </motion.div>
  );
}
