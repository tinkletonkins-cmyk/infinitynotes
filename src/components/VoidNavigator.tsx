import React, { useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';
import { Void } from '@/hooks/useVoids';

interface VoidNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  voids: Void[];
  currentVoidId: string | null;
  voidNoteCounts: Record<string, number>;
  onSelectVoid: (voidId: string | null) => void;
  user: { id: string; email?: string } | null;
}

// Generate stable positions for void nodes in circular layout
function useNodeLayout(voids: Void[], containerWidth: number, containerHeight: number) {
  return useMemo(() => {
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    // Public void (null) always at center
    const nodes: { id: string | null; x: number; y: number; void_: Void | null }[] = [
      { id: null, x: centerX, y: centerY, void_: null },
    ];

    const privateVoids = voids.filter(v => !v.is_public);
    const publicVoids = voids.filter(v => v.is_public);

    // Public voids in inner ring
    const innerRadius = Math.min(containerWidth, containerHeight) * 0.15;
    publicVoids.forEach((v, i) => {
      const angle = (i / Math.max(publicVoids.length, 1)) * Math.PI * 2 - Math.PI / 2;
      nodes.push({
        id: v.id,
        x: centerX + Math.cos(angle) * innerRadius + (Math.random() - 0.5) * 20,
        y: centerY + Math.sin(angle) * innerRadius + (Math.random() - 0.5) * 20,
        void_: v,
      });
    });

    // Private voids in outer ring
    const outerRadius = Math.min(containerWidth, containerHeight) * 0.3;
    privateVoids.forEach((v, i) => {
      const angle = (i / Math.max(privateVoids.length, 1)) * Math.PI * 2 - Math.PI / 2;
      nodes.push({
        id: v.id,
        x: centerX + Math.cos(angle) * outerRadius + (Math.random() - 0.5) * 30,
        y: centerY + Math.sin(angle) * outerRadius + (Math.random() - 0.5) * 30,
        void_: v,
      });
    });

    return nodes;
  }, [voids, containerWidth, containerHeight]);
}

// Compute connections between voids sharing the same owner
function useConnections(voids: Void[]) {
  return useMemo(() => {
    const lines: { from: string; to: string }[] = [];
    for (let i = 0; i < voids.length; i++) {
      for (let j = i + 1; j < voids.length; j++) {
        if (
          voids[i].owner_id &&
          voids[i].owner_id === voids[j].owner_id
        ) {
          lines.push({ from: voids[i].id, to: voids[j].id });
        }
      }
    }
    return lines;
  }, [voids]);
}

export function VoidNavigator({
  isOpen,
  onClose,
  voids,
  currentVoidId,
  voidNoteCounts,
  onSelectVoid,
  user,
}: VoidNavigatorProps) {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const height = typeof window !== 'undefined' ? window.innerHeight : 800;

  const nodes = useNodeLayout(voids, width, height);
  const connectionLines = useConnections(voids);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const getNodeSize = useCallback(
    (id: string | null) => {
      const key = id ?? '__public__';
      const count = voidNoteCounts[key] || 0;
      if (count === 0) return 40;
      return Math.min(40 + count * 4, 80);
    },
    [voidNoteCounts]
  );

  const getGlowIntensity = useCallback(
    (id: string | null) => {
      const key = id ?? '__public__';
      const count = voidNoteCounts[key] || 0;
      return Math.min(count * 3, 30);
    },
    [voidNoteCounts]
  );

  const getNodePos = useCallback(
    (id: string | null) => {
      const node = nodes.find(n => n.id === id);
      return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
    },
    [nodes]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] void-navigator-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          onClick={onClose}
        >
          {/* Star particles via CSS */}

          {/* SVG connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {connectionLines.map((line, i) => {
              const from = getNodePos(line.from);
              const to = getNodePos(line.to);
              return (
                <motion.line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="rgba(139, 92, 246, 0.15)"
                  strokeWidth={1}
                  strokeDasharray="6 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.4 + i * 0.05 }}
                />
              );
            })}
          </svg>

          {/* Title */}
          <motion.div
            className="absolute top-8 left-1/2 -translate-x-1/2 text-center z-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xs uppercase tracking-[0.5em] text-purple-300/60 font-mono">
              Multiverse Navigator
            </h2>
          </motion.div>

          {/* Void Nodes */}
          {nodes.map((node, i) => {
            const size = getNodeSize(node.id);
            const glow = getGlowIntensity(node.id);
            const isCurrent = node.id === currentVoidId;
            const isPublicCenter = node.id === null;
            const noteCount = voidNoteCounts[node.id ?? '__public__'] || 0;

            return (
              <motion.div
                key={node.id ?? 'public'}
                className="absolute cursor-pointer flex flex-col items-center"
                style={{
                  left: node.x,
                  top: node.y,
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2 + i * 0.06,
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectVoid(node.id);
                }}
              >
                {/* Breathing animation wrapper */}
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: noteCount > 0 ? [0.8, 1, 0.8] : [0.4, 0.5, 0.4],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div
                    className="void-navigator-node"
                    style={{
                      width: size,
                      height: size,
                      borderRadius: '50%',
                      background: noteCount > 0
                        ? 'radial-gradient(circle, hsl(270 60% 40%) 0%, hsl(260 50% 20%) 100%)'
                        : 'hsl(270 40% 12%)',
                      boxShadow: glow > 0
                        ? `0 0 ${glow}px ${glow / 2}px hsl(270 80% 60% / 0.5), 0 0 ${glow * 2}px hsl(270 80% 60% / 0.2)`
                        : 'none',
                      border: isCurrent
                        ? '2px solid hsl(0 0% 100%)'
                        : '1px solid hsl(270 40% 30% / 0.5)',
                    }}
                  >
                    {isPublicCenter && (
                      <div className="w-full h-full flex items-center justify-center">
                        <Globe size={size * 0.4} className="text-purple-300/70" />
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Label */}
                <motion.span
                  className="mt-2 text-[10px] font-mono uppercase tracking-wider text-purple-300/50 whitespace-nowrap max-w-[100px] truncate text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                >
                  {isPublicCenter
                    ? 'Public Void'
                    : node.void_?.name || 'Unknown'}
                </motion.span>

                {/* Note count badge */}
                {noteCount > 0 && (
                  <span className="text-[9px] font-mono text-purple-400/40 mt-0.5">
                    {noteCount} note{noteCount !== 1 ? 's' : ''}
                  </span>
                )}
              </motion.div>
            );
          })}

          {/* Hint */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-purple-300/30">
              Click a void to enter · Esc to return
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
