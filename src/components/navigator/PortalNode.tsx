import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Lock } from 'lucide-react';

type HighlightState = 'idle' | 'self' | 'neighbor' | 'dimmed';

interface PortalNodeProps {
  size: number;
  isLocked: boolean;
  isCurrent: boolean;
  isPublicCenter: boolean;
  isPrime: boolean;
  visualTier: number;
  energyCost: number;
  noteCount: number;
  label: string;
  glowIntensity: number;
  index: number;
  highlight?: HighlightState;
  onHover?: () => void;
  onHoverEnd?: () => void;
  onClick: (e: React.MouseEvent) => void;
}

export function PortalNode({
  size,
  isLocked,
  isCurrent,
  isPublicCenter,
  isPrime,
  visualTier,
  energyCost,
  noteCount,
  label,
  glowIntensity,
  index,
  highlight = 'idle',
  onHover,
  onHoverEnd,
  onClick,
}: PortalNodeProps) {
  const tierScale = 0.8 + visualTier * 0.15;
  const portalSize = isPrime ? size * tierScale : size;
  const ringWidth = isPrime ? 1 + visualTier * 0.5 : 1.5;

  const isDimmed = highlight === 'dimmed';
  const isHighlighted = highlight === 'self' || highlight === 'neighbor';

  const unlockedGlow = `
    0 0 ${glowIntensity + 8}px ${(glowIntensity + 8) / 2}px hsl(270 80% 60% / 0.5),
    0 0 ${(glowIntensity + 8) * 2}px hsl(270 80% 60% / 0.2)
  `;

  const highlightedGlow = `
    0 0 ${glowIntensity + 16}px ${(glowIntensity + 16) / 2}px hsl(270 80% 70% / 0.7),
    0 0 ${(glowIntensity + 16) * 2}px hsl(270 80% 60% / 0.35)
  `;

  const lockedGlow = '0 0 4px 1px hsl(270 30% 30% / 0.3)';
  const currentGlow = `
    0 0 ${glowIntensity + 12}px ${(glowIntensity + 12) / 2}px hsl(0 0% 100% / 0.4),
    0 0 ${(glowIntensity + 12) * 2}px hsl(270 80% 70% / 0.3)
  `;

  const resolvedGlow = isCurrent ? currentGlow
    : isLocked ? lockedGlow
    : isHighlighted ? highlightedGlow
    : unlockedGlow;

  return (
    <motion.div
      className="absolute cursor-pointer flex flex-col items-center"
      style={{ transform: 'translate(-50%, -50%)' }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: isDimmed ? 0.3 : 1,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.2 + index * 0.04,
        type: 'spring',
        stiffness: 200,
        damping: 20,
        opacity: { duration: 0.3, delay: 0 },
      }}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      {/* Portal container */}
      <div className="relative" style={{ width: portalSize, height: portalSize }}>
        {/* Spinning ring (unlocked only) */}
        {!isLocked && (
          <div
            className="absolute inset-0 portal-spin"
            style={{
              borderRadius: '50%',
              background: `conic-gradient(
                from 0deg,
                hsl(270 80% 60% / 0.8),
                hsl(280 70% 50% / 0.3),
                hsl(260 90% 70% / 0.8),
                hsl(270 60% 40% / 0.3),
                hsl(270 80% 60% / 0.8)
              )`,
              mask: `radial-gradient(circle, transparent ${100 - ringWidth * 8}%, black ${100 - ringWidth * 6}%)`,
              WebkitMask: `radial-gradient(circle, transparent ${100 - ringWidth * 8}%, black ${100 - ringWidth * 6}%)`,
            }}
          />
        )}

        {/* Locked cracked ring */}
        {isLocked && (
          <div
            className="absolute inset-0 portal-flicker"
            style={{
              borderRadius: '50%',
              border: '1.5px dashed hsl(270 30% 30% / 0.6)',
            }}
          />
        )}

        {/* Vortex center */}
        <motion.div
          className="absolute inset-[3px]"
          style={{
            borderRadius: '50%',
            background: isLocked
              ? 'radial-gradient(circle, hsl(270 20% 12%) 0%, hsl(270 15% 6%) 100%)'
              : `radial-gradient(circle, hsl(270 60% 35%) 0%, hsl(260 50% 18%) 60%, hsl(270 40% 8%) 100%)`,
            boxShadow: resolvedGlow,
            border: isCurrent
              ? '2px solid hsl(0 0% 100%)'
              : 'none',
          }}
          animate={
            !isLocked
              ? { scale: [1, 1.06, 1] }
              : undefined
          }
          transition={
            !isLocked
              ? { duration: 3 + (index % 3), repeat: Infinity, ease: 'easeInOut' }
              : undefined
          }
        >
          {/* Inner vortex rotation (unlocked) */}
          {!isLocked && (
            <div
              className="absolute inset-[2px] portal-spin"
              style={{
                borderRadius: '50%',
                background: `conic-gradient(
                  from 90deg,
                  hsl(270 50% 30% / 0.6),
                  hsl(280 40% 20% / 0.2),
                  hsl(260 60% 40% / 0.6),
                  hsl(270 50% 30% / 0.2),
                  hsl(270 50% 30% / 0.6)
                )`,
                animationDuration: '12s',
              }}
            />
          )}

          {/* Center icon */}
          <div className="w-full h-full flex items-center justify-center relative z-10">
            {isPublicCenter ? (
              <Globe size={portalSize * 0.35} className="text-purple-300/70" />
            ) : isLocked ? (
              <Lock size={portalSize * 0.3} className="text-purple-400/50" />
            ) : null}
          </div>
        </motion.div>

        {/* Energy sparks (unlocked, active) */}
        {!isLocked && noteCount > 0 && (
          <>
            {[0, 1, 2].map((sparkIdx) => (
              <motion.div
                key={sparkIdx}
                className="absolute"
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  backgroundColor: 'hsl(270 80% 70%)',
                  top: '50%',
                  left: '50%',
                }}
                animate={{
                  x: [
                    Math.cos((sparkIdx * 120 * Math.PI) / 180) * (portalSize * 0.55),
                    Math.cos(((sparkIdx * 120 + 120) * Math.PI) / 180) * (portalSize * 0.55),
                    Math.cos(((sparkIdx * 120 + 240) * Math.PI) / 180) * (portalSize * 0.55),
                    Math.cos((sparkIdx * 120 * Math.PI) / 180) * (portalSize * 0.55),
                  ],
                  y: [
                    Math.sin((sparkIdx * 120 * Math.PI) / 180) * (portalSize * 0.55),
                    Math.sin(((sparkIdx * 120 + 120) * Math.PI) / 180) * (portalSize * 0.55),
                    Math.sin(((sparkIdx * 120 + 240) * Math.PI) / 180) * (portalSize * 0.55),
                    Math.sin((sparkIdx * 120 * Math.PI) / 180) * (portalSize * 0.55),
                  ],
                  opacity: [0.8, 0.3, 0.8],
                }}
                transition={{
                  duration: 4 + sparkIdx,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Label */}
      <motion.span
        className="mt-2 text-[10px] font-mono uppercase tracking-wider text-purple-300/50 whitespace-nowrap max-w-[120px] truncate text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isDimmed ? 0.2 : 1 }}
        transition={{ delay: 0.5 + index * 0.04 }}
      >
        {label}
      </motion.span>

      {/* Energy cost badge (prime voids) */}
      {isPrime && energyCost > 0 && (
        <span className="text-[8px] font-mono text-purple-400/40 mt-0.5">
          ⚡{energyCost}
        </span>
      )}

      {/* Note count */}
      {noteCount > 0 && (
        <span className="text-[9px] font-mono text-purple-400/40 mt-0.5">
          {noteCount} note{noteCount !== 1 ? 's' : ''}
        </span>
      )}
    </motion.div>
  );
}
