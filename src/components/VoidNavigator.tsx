import React, { useMemo, useEffect, useCallback, useState } from 'react';
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
  { index: 0, offsetX: -0.25, offsetY: 0 },
  { index: 1, offsetX: 0, offsetY: 0 },
  { index: 2, offsetX: -0.12, offsetY: -0.15 },
  { index: 3, offsetX: 0.12, offsetY: -0.15 },
  { index: 4, offsetX: 0.25, offsetY: 0 },
  { index: 5, offsetX: -0.12, offsetY: 0.15 },
  { index: 6, offsetX: 0.12, offsetY: 0.15 },
  { index: 7, offsetX: 0, offsetY: 0.28 },
  { index: 8, offsetX: -0.08, offsetY: 0.40 },
  { index: 9, offsetX: 0.12, offsetY: 0.40 },
];

// Edges matching the user's constellation diagram
const PRIME_EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 5],
  [1, 4],
  [2, 3],
  [3, 4],
  [5, 6],
  [6, 4],
  [5, 7],
  [7, 8],
  [8, 9],
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

interface ConnectionLine {
  x1: number; y1: number; x2: number; y2: number;
  bright: boolean;
  sourceId: string | null;
  targetId: string | null;
}

function useConnections(nodes: LayoutNode[]): ConnectionLine[] {
  return useMemo(() => {
    const lines: ConnectionLine[] = [];
    const primeNodes = nodes.filter(n => n.isPrime);
    const nonPrimeNodes = nodes.filter(n => !n.isPrime);

    for (const [a, b] of PRIME_EDGES) {
      const na = primeNodes.find(n => n.primeIndex === a);
      const nb = primeNodes.find(n => n.primeIndex === b);
      if (na && nb) {
        lines.push({ x1: na.x, y1: na.y, x2: nb.x, y2: nb.y, bright: true, sourceId: na.id, targetId: nb.id });
      }
    }

    for (const np of nonPrimeNodes) {
      let nearest = primeNodes[0];
      let minDist = Infinity;
      for (const p of primeNodes) {
        const d = Math.hypot(p.x - np.x, p.y - np.y);
        if (d < minDist) { minDist = d; nearest = p; }
      }
      if (nearest) {
        lines.push({ x1: np.x, y1: np.y, x2: nearest.x, y2: nearest.y, bright: false, sourceId: np.id, targetId: nearest.id });
      }
    }

    return lines;
  }, [nodes]);
}

// Get all node IDs directly connected to a given node
function getNeighborIds(nodeId: string | null, connections: ConnectionLine[]): Set<string | null> {
  const neighbors = new Set<string | null>();
  for (const c of connections) {
    if (c.sourceId === nodeId) neighbors.add(c.targetId);
    if (c.targetId === nodeId) neighbors.add(c.sourceId);
  }
  return neighbors;
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
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null | undefined>(undefined);

  const neighborIds = useMemo(() => {
    if (hoveredNodeId === undefined) return null;
    return getNeighborIds(hoveredNodeId, connectionLines);
  }, [hoveredNodeId, connectionLines]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Reset hover when navigator closes
  useEffect(() => {
    if (!isOpen) setHoveredNodeId(undefined);
  }, [isOpen]);

  const isLocked = useCallback(
    (v: Void | null) => {
      if (!v) return false;
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

  // Determine line visual state based on hover
  const getLineState = useCallback((line: ConnectionLine) => {
    if (hoveredNodeId === undefined) return 'idle';
    if (line.sourceId === hoveredNodeId || line.targetId === hoveredNodeId) return 'active';
    return 'dimmed';
  }, [hoveredNodeId]);

  // Determine node visual state based on hover
  const getNodeHighlight = useCallback((nodeId: string | null) => {
    if (hoveredNodeId === undefined) return 'idle';
    if (nodeId === hoveredNodeId) return 'self';
    if (neighborIds?.has(nodeId)) return 'neighbor';
    return 'dimmed';
  }, [hoveredNodeId, neighborIds]);

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
          onMouseLeave={() => setHoveredNodeId(undefined)}
        >
          <CosmicDebris width={w} height={h} />

          {/* SVG constellation threads */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}>
            <defs>
              {/* Glow filter for threads */}
              <filter id="thread-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="thread-glow-bright" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {connectionLines.map((line, i) => {
              const state = getLineState(line);
              const gradientId = `thread-fade-${i}`;
              const dx = line.x2 - line.x1;
              const dy = line.y2 - line.y1;
              const len = Math.hypot(dx, dy);
              // Fade endpoints: start at 8% in, end at 92%
              const fadeIn = 0.08;
              const fadeOut = 0.92;

              const baseOpacity = line.bright ? 0.18 : 0.08;
              const activeOpacity = line.bright ? 0.55 : 0.4;
              const dimmedOpacity = 0.03;

              const opacity = state === 'active' ? activeOpacity
                : state === 'dimmed' ? dimmedOpacity
                : baseOpacity;

              const filterRef = state === 'active' ? 'url(#thread-glow-bright)'
                : 'url(#thread-glow)';

              return (
                <g key={i}>
                  <defs>
                    <linearGradient id={gradientId} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="hsl(270 80% 60%)" stopOpacity="0" />
                      <stop offset={`${fadeIn * 100}%`} stopColor="hsl(270 80% 60%)" stopOpacity="1" />
                      <stop offset="50%" stopColor="hsl(280 70% 70%)" stopOpacity="1" />
                      <stop offset={`${fadeOut * 100}%`} stopColor="hsl(270 80% 60%)" stopOpacity="1" />
                      <stop offset="100%" stopColor="hsl(270 80% 60%)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Glow under-layer */}
                  <motion.line
                    x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={state === 'active' ? 3 : line.bright ? 1.5 : 1}
                    filter={filterRef}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: opacity,
                    }}
                    transition={{
                      pathLength: { duration: 1.2, delay: 0.3 + i * 0.03 },
                      opacity: { duration: 0.4 },
                    }}
                  />
                  {/* Pulse traveling light (only for prime-to-prime idle/active) */}
                  {line.bright && state !== 'dimmed' && (
                    <motion.circle
                      r={state === 'active' ? 2.5 : 1.5}
                      fill="hsl(280 80% 80%)"
                      filter="url(#thread-glow)"
                      initial={{ opacity: 0 }}
                      animate={{
                        cx: [line.x1, line.x2],
                        cy: [line.y1, line.y2],
                        opacity: [0, state === 'active' ? 0.8 : 0.3, 0],
                      }}
                      transition={{
                        duration: 4 + (i % 3),
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: 'linear',
                      }}
                    />
                  )}
                </g>
              );
            })}
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
            const highlight = getNodeHighlight(node.id);

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
                  highlight={highlight}
                  onHover={() => setHoveredNodeId(node.id)}
                  onHoverEnd={() => setHoveredNodeId(undefined)}
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
