import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2 } from 'lucide-react';

interface Cursor {
  id: string;
  x: number;
  y: number;
  username: string;
  color: string;
}

interface LiveCursorsProps {
  cursors: Cursor[];
}

// Preset colors for cursors
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

export function LiveCursors({ cursors }: LiveCursorsProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      <AnimatePresence>
        {cursors.map((cursor) => (
          <motion.div
            key={cursor.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: cursor.x,
              y: cursor.y,
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ 
              type: 'spring',
              stiffness: 500,
              damping: 28,
              mass: 0.5,
            }}
            className="absolute top-0 left-0"
            style={{ willChange: 'transform' }}
          >
            {/* Cursor arrow */}
            <MousePointer2 
              size={20} 
              fill={cursor.color}
              stroke="white"
              strokeWidth={1.5}
              className="drop-shadow-md"
            />
            {/* Username label */}
            <div 
              className="absolute left-4 top-4 px-2 py-0.5 text-xs font-mono whitespace-nowrap rounded-sm shadow-md"
              style={{ 
                backgroundColor: cursor.color,
                color: '#000',
              }}
            >
              {cursor.username}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
