import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StarPoint {
  id: string;
  x: number;
  y: number;
  size: number;
  twinkleDelay: number;
  spikeLength: number;
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
      size: 2 + Math.random() * 4,
      twinkleDelay: Math.random() * 4,
      spikeLength: 8 + Math.random() * 20,
    });
  }
  return stars;
}

function Star({ size, spikeLength }: { size: number; spikeLength: number }) {
  const center = 30;
  const coreSize = size;
  
  return (
    <svg width={60} height={60} viewBox="0 0 60 60" className="overflow-visible">
      <defs>
        <radialGradient id="starCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="50%" stopColor="white" stopOpacity="0.8" />
          <stop offset="100%" stopColor="rgba(200,220,255,0)" stopOpacity="0" />
        </radialGradient>
        <filter id="starGlow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Vertical spike */}
      <line 
        x1={center} 
        y1={center - spikeLength} 
        x2={center} 
        y2={center + spikeLength}
        stroke="white"
        strokeWidth="0.5"
        opacity="0.6"
        filter="url(#starGlow)"
      />
      
      {/* Horizontal spike */}
      <line 
        x1={center - spikeLength} 
        y1={center} 
        x2={center + spikeLength} 
        y2={center}
        stroke="white"
        strokeWidth="0.5"
        opacity="0.6"
        filter="url(#starGlow)"
      />
      
      {/* Core glow */}
      <circle 
        cx={center} 
        cy={center} 
        r={coreSize * 2}
        fill="url(#starCore)"
        filter="url(#starGlow)"
      />
      
      {/* Bright center */}
      <circle 
        cx={center} 
        cy={center} 
        r={coreSize}
        fill="white"
      />
    </svg>
  );
}

export function ConstellationMode({ active }: ConstellationModeProps) {
  const [stars, setStars] = useState<StarPoint[]>([]);

  useEffect(() => {
    if (active) {
      setStars(generateStars(50));
    }
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
          {stars.map(star => (
            <motion.div
              key={star.id}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.1, 0.8],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: star.twinkleDelay,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut',
              }}
              className="absolute"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Star size={star.size} spikeLength={star.spikeLength} />
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
