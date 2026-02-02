import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StarPoint {
  id: string;
  x: number;
  y: number;
  size: number;
  twinkleDelay: number;
  rotation: number;
}

interface ConstellationModeProps {
  active: boolean;
}

function generateStars(count: number): StarPoint[] {
  const stars: StarPoint[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: `star-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 8 + Math.random() * 16,
      twinkleDelay: Math.random() * 3,
      rotation: Math.random() * 360,
    });
  }
  return stars;
}

function ChristmasStar({ size, color = '#FFD700' }: { size: number; color?: string }) {
  const points = 5;
  const outerRadius = size / 2;
  const innerRadius = outerRadius * 0.4;
  
  let path = '';
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = outerRadius + radius * Math.cos(angle);
    const y = outerRadius + radius * Math.sin(angle);
    path += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
  }
  path += 'Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <filter id={`glow-${size}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id={`starGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFACD" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="#FFA500" />
        </linearGradient>
      </defs>
      <path 
        d={path} 
        fill={`url(#starGradient-${size})`}
        filter={`url(#glow-${size})`}
      />
    </svg>
  );
}

export function ConstellationMode({ active }: ConstellationModeProps) {
  const [stars, setStars] = useState<StarPoint[]>([]);

  useEffect(() => {
    if (active) {
      setStars(generateStars(30));
    }
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden"
        >
          {/* Dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background"
          />

          {/* Christmas Stars */}
          {stars.map(star => (
            <motion.div
              key={star.id}
              initial={{ scale: 0, opacity: 0, rotate: star.rotation }}
              animate={{ 
                scale: [0.8, 1.2, 0.8],
                opacity: [0.4, 1, 0.4],
                rotate: [star.rotation, star.rotation + 10, star.rotation],
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: 2 + Math.random(),
                delay: star.twinkleDelay,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut',
              }}
              className="absolute"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                filter: `drop-shadow(0 0 ${star.size / 2}px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 ${star.size}px rgba(255, 165, 0, 0.5))`,
              }}
            >
              <ChristmasStar 
                size={star.size} 
                color={['#FFD700', '#FFA500', '#FFFACD', '#FFE4B5'][Math.floor(Math.random() * 4)]}
              />
            </motion.div>
          ))}

          {/* Instruction text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-white/60 font-mono">
              ✨ Stargazing Mode ✨
            </p>
            <p className="text-xs text-white/40 mt-2">
              {stars.length} stars twinkling in the void
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
