import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const DEBRIS_COLORS = [
  'hsl(270 40% 50%)',
  'hsl(280 35% 45%)',
  'hsl(260 45% 40%)',
  'hsl(290 30% 50%)',
  'hsl(250 40% 45%)',
  'hsl(300 25% 40%)',
];

interface DebrisParticle {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  color: string;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  rotation: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function CosmicDebris({ width, height }: { width: number; height: number }) {
  const particles = useMemo(() => {
    const rand = seededRandom(42);
    const count = 18;
    const result: DebrisParticle[] = [];

    for (let i = 0; i < count; i++) {
      const layer = i % 3; // 0=far, 1=mid, 2=near
      const baseSize = layer === 0 ? 25 : layer === 1 ? 32 : 40;
      const baseOpacity = layer === 0 ? 0.04 : layer === 1 ? 0.07 : 0.11;
      const baseDuration = layer === 0 ? 38 : layer === 1 ? 28 : 22;

      result.push({
        x: rand() * width,
        y: rand() * height,
        width: baseSize + rand() * 15,
        height: (baseSize + rand() * 15) * 0.6,
        opacity: baseOpacity + rand() * 0.03,
        color: DEBRIS_COLORS[Math.floor(rand() * DEBRIS_COLORS.length)],
        duration: baseDuration + rand() * 10,
        delay: rand() * -40,
        driftX: (rand() - 0.5) * width * 0.6,
        driftY: (rand() - 0.5) * height * 0.4,
        rotation: rand() * 360,
      });
    }
    return result;
  }, [width, height]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: p.x,
            top: p.y,
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            opacity: p.opacity,
            borderRadius: '3px !important',
          }}
          animate={{
            x: [0, p.driftX * 0.5, p.driftX, p.driftX * 0.3, 0],
            y: [0, p.driftY * 0.3, p.driftY * 0.7, p.driftY, 0],
            rotate: [0, p.rotation, p.rotation * 1.5, p.rotation * 0.5, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
