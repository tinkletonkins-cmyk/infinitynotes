import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StarPoint {
  id: string;
  x: number;
  y: number;
  size: number;
  twinkleDelay: number;
  twinkleDuration: number;
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
      size: 1 + Math.random() * 2,
      twinkleDelay: Math.random() * 5,
      twinkleDuration: 2 + Math.random() * 3,
    });
  }
  return stars;
}

function Star({ size }: { size: number }) {
  const spikeLength = size * 15;
  
  return (
    <div 
      className="relative"
      style={{
        width: spikeLength * 2,
        height: spikeLength * 2,
      }}
    >
      {/* Vertical spike */}
      <div 
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: 1,
          height: '100%',
          background: 'linear-gradient(to bottom, transparent 0%, white 45%, white 55%, transparent 100%)',
          opacity: 0.7,
        }}
      />
      
      {/* Horizontal spike */}
      <div 
        className="absolute top-1/2 left-0 -translate-y-1/2"
        style={{
          width: '100%',
          height: 1,
          background: 'linear-gradient(to right, transparent 0%, white 45%, white 55%, transparent 100%)',
          opacity: 0.7,
        }}
      />
      
      {/* Outer glow */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: size * 6,
          height: size * 6,
          background: 'radial-gradient(circle, rgba(200,220,255,0.3) 0%, transparent 70%)',
        }}
      />
      
      {/* Core glow */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: size * 3,
          height: size * 3,
          background: 'radial-gradient(circle, white 0%, rgba(200,220,255,0.5) 50%, transparent 100%)',
          boxShadow: `0 0 ${size * 4}px rgba(255,255,255,0.8), 0 0 ${size * 8}px rgba(200,220,255,0.4)`,
        }}
      />
      
      {/* Bright center */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        style={{
          width: size,
          height: size,
        }}
      />
    </div>
  );
}

export function ConstellationMode({ active }: ConstellationModeProps) {
  const [stars, setStars] = useState<StarPoint[]>([]);

  useEffect(() => {
    if (active) setStars(generateStars(40));
    else setStars([]);
  }, [active]);

  if (!active || stars.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            transform: 'translate(-50%, -50%)',
            animation: `twinkle ${star.twinkleDuration}s ${star.twinkleDelay}s ease-in-out infinite`,
          }}
        >
          <Star size={star.size} />
        </div>
      ))}
    </div>
  );
}
