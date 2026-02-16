import React, { useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Void } from '@/hooks/useVoids';
import { CosmicDebris } from './navigator/CosmicDebris';
import { PortalNode } from './navigator/PortalNode';

interface VoidNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  voids: Void[];
  currentVoidId: string | null;
  voidNoteCounts: Record<string, number>;
  onSelectVoid: (voidId: string | null) => void;
  user: { id: string; email?: string } | null;
}

// Prime constellation fixed positions (relative to center, scaled by viewport)
const PRIME_CONSTELLATION = [
  { index: 0, offsetX: -0.25, offsetY: 0 },    // Void 1 (left center)
  { index: 1, offsetX: 0, offsetY: 0 },          // Void 2 (center)
  { index: 2, offsetX: -0.12, offsetY: -0.15 },  // Void 3 (upper left)
  { index: 3, offsetX: 0.12, offsetY: -0.15 },   // Void 4 (upper right)
  { index: 4, offsetX: 0.25, offsetY: 0 },        // Void 5 (right center)
  { index: 5, offsetX: -0.12, offsetY: 0.15 },   // Void 6 (lower left)
  { index: 6, offsetX: 0.12, offsetY: 0.15 },    // Void 7 (lower right)
  { index: 7, offsetX: 0, offsetY: 0.28 },        // Void 8 (below center)
  { index: 8, offsetX: -0.08, offsetY: 0.40 },   // Void 9 (bottom left)
  { index: 9, offsetX: 0.12, offsetY: 0.40 },    // Void 10 (bottom right)
];

// Edges matching the user's constellation diagram
const PRIME_EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 5],  // Void 1 connects to 2, 3, 6
  [1, 4],                    // Void 2 connects to 5
  [2, 3],                    // Void 3 connects to 4
  [3, 4],                    // Void 4 connects to 5
  [5, 6],                    // Void 6 connects to 7
  [6, 4],                    // Void 7 connects to 5
  [5, 7],                    // Void 6 connects to 8 (via index 5 -> index 7)
  [7, 8],                    // Void 8 connects to 9
  [8, 9],                    // Void 9 connects to 10
];

interface LayoutNode {
  id: string | null;
  x: number;
  y: number;
  void_: Void | null;
  isPrime: boolean;
  primeIndex: number;
}

function useNodeLayout(voids: Void[], w: number, h: number): LayoutNode[] {
  return useMemo(() => {
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h);

    const primeVoids = voids.filter(v => v.is_prime).slice(0, 10);
    const nonPrimeVoids = voids.filter(v => !v.is_prime);

    const nodes: LayoutNode[] = [];

    // Place prime voids in constellation
    primeVoids.forEach((v, i) => {
      const pos = PRIME_CONSTELLATION[i];
      if (!pos) return;
      nodes.push({
        id: v.id,
        x: cx + pos.offsetX * scale,
        y: cy + pos.offsetY * scale,
        void_: v,
        isPrime: true,
        primeIndex: i,
      });
    });

    // Non-prime voids in outer ring
    const outerRadius = scale * 0.42;
    nonPrimeVoids.forEach((v, i) => {
      const angle = (i / Math.max(nonPrimeVoids.length, 1)) * Math.PI * 2 - Math.PI / 2;
      nodes.push({
        id: v.id,
        x: cx + Math.cos(angle) * outerRadius,
        y: cy + Math.sin(angle) * outerRadius,
        void_: v,
        isPrime: false,
        primeIndex: -1,
      });
    });

    return nodes;
  }, [voids, w, h]);
}

// Build all connection lines
function useConnections(nodes: LayoutNode[]) {
  return useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; bright: boolean }[] = [];
    const primeNodes = nodes.filter(n => n.isPrime);
    const nonPrimeNodes = nodes.filter(n => !n.isPrime);

    // Prime-to-prime edges from constellation
    for (const [a, b] of PRIME_EDGES) {
      const na = primeNodes.find(n => n.primeIndex === a);
      const nb = primeNodes.find(n => n.primeIndex === b);
      if (na && nb) {
        lines.push({ x1: na.x, y1: na.y, x2: nb.x, y2: nb.y, bright: true });
      }
    }

    // Non-prime voids connect to nearest prime
    for (const np of nonPrimeNodes) {
      let nearest = primeNodes[0];
      let minDist = Infinity;
      for (const p of primeNodes) {
        const d = Math.hypot(p.x - np.x, p.y - np.y);
        if (d < minDist) { minDist = d; nearest = p; }
      }
      if (nearest) {
        lines.push({ x1: np.x, y1: np.y, x2: nearest.x, y2: nearest.y, bright: false });
      }
    }

    return lines;
  }, [nodes]);
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
  const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const h = typeof window !== 'undefined' ? window.innerHeight : 800;

  const nodes = useNodeLayout(voids, w, h);
  const connectionLines = useConnections(nodes);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const isLocked = useCallback(
    (v: Void | null) => {
      if (!v) return false; // public void
      if (v.is_public) return false;
      if (v.owner_id === user?.id) return false;
      return true;
    },
    [user]
  );

  const getGlow = useCallback(
    (id: string | null) => {
      const count = voidNoteCounts[id ?? '__public__'] || 0;
      return Math.min(count * 3, 30);
    },
    [voidNoteCounts]
  );

  const getSize = useCallback(
    (id: string | null) => {
      const count = voidNoteCounts[id ?? '__public__'] || 0;
      return count === 0 ? 44 : Math.min(44 + count * 4, 80);
    },
    [voidNoteCounts]
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
          {/* Cosmic debris layer */}
          <CosmicDebris width={w} height={h} />

          {/* SVG connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}>
            {connectionLines.map((line, i) => (
              <motion.line
                key={i}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={line.bright ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.12)'}
                strokeWidth={line.bright ? 1.5 : 1}
                strokeDasharray="6 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 + i * 0.03 }}
              />
            ))}
          </svg>

          {/* Title */}
          <motion.div
            className="absolute top-8 left-1/2 -translate-x-1/2 text-center"
            style={{ zIndex: 10 }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xs uppercase tracking-[0.5em] text-purple-300/60 font-mono">
              Multiverse Navigator
            </h2>
          </motion.div>

          {/* Portal Nodes */}
          {nodes.map((node, i) => {
            const noteCount = voidNoteCounts[node.id ?? '__public__'] || 0;
            const locked = isLocked(node.void_);
            const isCurrent = node.id === currentVoidId;
            const isPublicCenter = node.id === null;

            return (
              <div
                key={node.id ?? 'public'}
                className="absolute"
                style={{ left: node.x, top: node.y, zIndex: 5 }}
              >
                <PortalNode
                  size={getSize(node.id)}
                  isLocked={locked}
                  isCurrent={isCurrent}
                  isPublicCenter={isPublicCenter}
                  isPrime={node.isPrime}
                  visualTier={node.void_?.visual_tier ?? 1}
                  energyCost={node.void_?.energy_cost ?? 0}
                  noteCount={noteCount}
                  label={isPublicCenter ? 'Public Void' : node.void_?.name || 'Unknown'}
                  glowIntensity={getGlow(node.id)}
                  index={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectVoid(node.id);
                  }}
                />
              </div>
            );
          })}

          {/* Hint */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
            style={{ zIndex: 10 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-purple-300/30">
              Click a portal to enter · Esc to return
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
