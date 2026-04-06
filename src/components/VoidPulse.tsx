import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ripple {
  id: string;
  x: number;
  y: number;
  intensity: number;
  createdAt: number;
}

interface VoidPulseProps {
  activityLevel: number; // 0-1
  ripples: Ripple[];
}

export function VoidPulse({ activityLevel, ripples }: VoidPulseProps) {
  // Only render ripples — skip the expensive breathing/particle animations
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{
              width: 0,
              height: 0,
              opacity: 0.6,
              border: `2px solid hsla(${280 + ripple.intensity * 40}, 70%, 60%, 0.8)`,
            }}
            animate={{
              width: 200 * ripple.intensity + 80,
              height: 200 * ripple.intensity + 80,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
