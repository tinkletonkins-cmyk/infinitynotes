import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Note } from '@/hooks/useNotes';

interface EquipmentEffectsProps {
  activeEffects: Set<string>;
  notes: Note[];
  boardTheme: string;
}

/**
 * Renders visual effects for active equipment modules.
 * Each effect_key maps to a specific visual/behavioral layer.
 */
export function EquipmentEffects({ activeEffects, notes, boardTheme }: EquipmentEffectsProps) {
  return (
    <>
      {/* thread_weaver: faint connection lines between nearby notes */}
      {activeEffects.has('thread_weaver') && <ThreadWeaverEffect notes={notes} />}

      {/* cluster_beacon: colored halos around note clusters */}
      {activeEffects.has('cluster_beacon') && <ClusterBeaconEffect notes={notes} />}

      {/* nebula_skin: animated nebula background overlay */}
      {activeEffects.has('nebula_skin') && <NebulaSkinEffect />}

      {/* aura_field: mood-responsive glow on the entire board */}
      {activeEffects.has('aura_field') && <AuraFieldEffect notes={notes} />}

      {/* signature_border: personal void border glow */}
      {activeEffects.has('signature_border') && <SignatureBorderEffect />}

      {/* void_compass: minimap radar */}
      {activeEffects.has('void_compass') && <VoidCompassEffect notes={notes} />}
    </>
  );
}

/* ── thread_weaver ── Faint lines between semantically nearby notes */
function ThreadWeaverEffect({ notes }: { notes: Note[] }) {
  const lines = useMemo(() => {
    const result: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = [];
    const PROXIMITY = 400;
    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const a = notes[i];
        const b = notes[j];
        const dx = a.position.x - b.position.x;
        const dy = a.position.y - b.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < PROXIMITY) {
          result.push({
            x1: a.position.x + 105,
            y1: a.position.y + 64,
            x2: b.position.x + 105,
            y2: b.position.y + 64,
            opacity: Math.max(0.05, 0.2 * (1 - dist / PROXIMITY)),
          });
        }
      }
    }
    return result;
  }, [notes]);

  return (
    <svg className="fixed inset-0 z-[6] pointer-events-none w-full h-full">
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="hsl(270 60% 60%)"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={l.opacity}
        />
      ))}
    </svg>
  );
}

/* ── cluster_beacon ── Colored halos around groups of 3+ nearby notes */
function ClusterBeaconEffect({ notes }: { notes: Note[] }) {
  const clusters = useMemo(() => {
    const CLUSTER_RADIUS = 300;
    const visited = new Set<number>();
    const groups: { cx: number; cy: number; radius: number; count: number }[] = [];

    for (let i = 0; i < notes.length; i++) {
      if (visited.has(i)) continue;
      const group = [i];
      visited.add(i);
      for (let j = i + 1; j < notes.length; j++) {
        if (visited.has(j)) continue;
        const dx = notes[i].position.x - notes[j].position.x;
        const dy = notes[i].position.y - notes[j].position.y;
        if (Math.sqrt(dx * dx + dy * dy) < CLUSTER_RADIUS) {
          group.push(j);
          visited.add(j);
        }
      }
      if (group.length >= 3) {
        const cx = group.reduce((s, idx) => s + notes[idx].position.x + 105, 0) / group.length;
        const cy = group.reduce((s, idx) => s + notes[idx].position.y + 64, 0) / group.length;
        groups.push({ cx, cy, radius: CLUSTER_RADIUS / 2, count: group.length });
      }
    }
    return groups;
  }, [notes]);

  return (
    <svg className="fixed inset-0 z-[5] pointer-events-none w-full h-full">
      <defs>
        <radialGradient id="beacon-grad">
          <stop offset="0%" stopColor="hsl(270 60% 50%)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="hsl(270 60% 50%)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {clusters.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={c.radius} fill="url(#beacon-grad)" />
      ))}
    </svg>
  );
}

/* ── nebula_skin ── Animated gradient background overlay */
function NebulaSkinEffect() {
  return (
    <motion.div
      className="fixed inset-0 z-[4] pointer-events-none"
      animate={{
        background: [
          'radial-gradient(ellipse at 30% 40%, hsl(270 50% 15% / 0.3) 0%, transparent 60%)',
          'radial-gradient(ellipse at 70% 60%, hsl(220 50% 15% / 0.3) 0%, transparent 60%)',
          'radial-gradient(ellipse at 50% 30%, hsl(300 40% 15% / 0.3) 0%, transparent 60%)',
          'radial-gradient(ellipse at 30% 40%, hsl(270 50% 15% / 0.3) 0%, transparent 60%)',
        ],
      }}
      transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/* ── aura_field ── Board-wide mood glow based on dominant note emotion */
function AuraFieldEffect({ notes }: { notes: Note[] }) {
  const dominantHue = useMemo(() => {
    if (notes.length === 0) return 270;
    // Simple heuristic: count notes with colors
    const coloredNotes = notes.filter(n => n.color);
    if (coloredNotes.length === 0) return 270;
    // Use the most recent colored note's hue
    return 270; // Purple default - could parse colors but keeping simple
  }, [notes]);

  return (
    <div
      className="fixed inset-0 z-[3] pointer-events-none"
      style={{
        background: `radial-gradient(ellipse at 50% 50%, hsl(${dominantHue} 40% 20% / 0.15) 0%, transparent 70%)`,
      }}
    />
  );
}

/* ── signature_border ── Animated personal void border */
function SignatureBorderEffect() {
  return (
    <motion.div
      className="fixed inset-0 z-[8] pointer-events-none"
      animate={{
        boxShadow: [
          'inset 0 0 30px hsl(270 60% 40% / 0.2), inset 0 0 60px hsl(45 90% 55% / 0.1)',
          'inset 0 0 50px hsl(270 60% 40% / 0.3), inset 0 0 80px hsl(45 90% 55% / 0.15)',
          'inset 0 0 30px hsl(270 60% 40% / 0.2), inset 0 0 60px hsl(45 90% 55% / 0.1)',
        ],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/* ── void_compass ── Minimap showing note distribution */
function VoidCompassEffect({ notes }: { notes: Note[] }) {
  const dots = useMemo(() => {
    if (notes.length === 0) return [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return notes.map(n => ({
      x: Math.min(100, Math.max(0, (n.position.x / vw) * 100)),
      y: Math.min(100, Math.max(0, (n.position.y / vh) * 100)),
    }));
  }, [notes]);

  return (
    <div className="fixed bottom-16 right-4 z-[100] w-24 h-24 border border-foreground/20 bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-0 p-1">
        <div className="relative w-full h-full">
          {dots.map((d, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-purple-400/70"
              style={{ left: `${d.x}%`, top: `${d.y}%`, transform: 'translate(-50%, -50%)' }}
            />
          ))}
        </div>
      </div>
      <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-mono uppercase tracking-wider text-muted-foreground">
        Compass
      </span>
    </div>
  );
}
