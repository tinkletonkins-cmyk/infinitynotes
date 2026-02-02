import React, { useMemo } from 'react';
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
  // Generate dynamic background based on activity level
  const backgroundStyle = useMemo(() => {
    // Calm: dark void
    // Active: pulsing colors
    const baseHue = 260; // Purple base
    const hueShift = activityLevel * 40; // Shift towards warmer colors when active
    const saturation = 10 + activityLevel * 30;
    const lightness = 5 + activityLevel * 8;
    const glowOpacity = activityLevel * 0.3;
    
    return {
      background: `
        radial-gradient(
          ellipse at 50% 50%,
          hsla(${baseHue + hueShift}, ${saturation}%, ${lightness + 5}%, ${glowOpacity}) 0%,
          transparent 60%
        ),
        radial-gradient(
          ellipse at 20% 30%,
          hsla(${baseHue - 20}, ${saturation}%, ${lightness}%, ${glowOpacity * 0.5}) 0%,
          transparent 50%
        ),
        radial-gradient(
          ellipse at 80% 70%,
          hsla(${baseHue + 60}, ${saturation}%, ${lightness}%, ${glowOpacity * 0.5}) 0%,
          transparent 50%
        )
      `,
    };
  }, [activityLevel]);
  
  // Breathing animation speed based on activity
  const breatheDuration = useMemo(() => {
    // Calm: slow breathing (8s), Active: fast breathing (2s)
    return 8 - activityLevel * 6;
  }, [activityLevel]);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Breathing gradient overlay */}
      <motion.div
        className="absolute inset-0"
        style={backgroundStyle}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: breatheDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Activity glow ring */}
      {activityLevel > 0.1 && (
        <motion.div
          className="absolute inset-0 border-2 border-primary/10"
          initial={{ opacity: 0 }}
          animate={{
            opacity: activityLevel * 0.3,
            boxShadow: `inset 0 0 ${100 * activityLevel}px ${20 * activityLevel}px hsla(280, 50%, 50%, ${activityLevel * 0.2})`,
          }}
          transition={{ duration: 0.5 }}
        />
      )}
      
      {/* Ripples */}
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
              opacity: 0.8,
              border: `2px solid hsla(${280 + ripple.intensity * 40}, 70%, 60%, 0.8)`,
              boxShadow: `0 0 20px hsla(${280 + ripple.intensity * 40}, 70%, 60%, 0.5)`,
            }}
            animate={{
              width: 300 * ripple.intensity + 100,
              height: 300 * ripple.intensity + 100,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.5,
              ease: 'easeOut',
            }}
          />
        ))}
      </AnimatePresence>
      
      {/* Particle field that intensifies with activity */}
      {activityLevel > 0.3 && (
        <div className="absolute inset-0">
          {Array.from({ length: Math.floor(activityLevel * 15) }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/30 rounded-full"
              style={{
                left: `${10 + (i * 37) % 80}%`,
                top: `${10 + (i * 53) % 80}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.2, 0.6, 0.2],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3 + (i % 3),
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}
      
      {/* Corner energy pulses when very active */}
      {activityLevel > 0.6 && (
        <>
          <motion.div
            className="absolute top-0 left-0 w-64 h-64"
            style={{
              background: 'radial-gradient(circle at 0% 0%, hsla(300, 60%, 50%, 0.2) 0%, transparent 70%)',
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-64 h-64"
            style={{
              background: 'radial-gradient(circle at 100% 100%, hsla(200, 60%, 50%, 0.2) 0%, transparent 70%)',
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
        </>
      )}
    </div>
  );
}
