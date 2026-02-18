import React, { useMemo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Note } from '@/hooks/useNotes';

interface EquipmentEffectsProps {
  activeEffects: Set<string>;
  notes: Note[];
  boardTheme: string;
  onWarpTo?: (x: number, y: number) => void;
  onOpenEchoArchive?: () => void;
}

export function EquipmentEffects({ activeEffects, notes, boardTheme, onWarpTo, onOpenEchoArchive }: EquipmentEffectsProps) {
  return (
    <>
      {/* thread_weaver: faint connection lines between nearby notes */}
      {activeEffects.has('thread_weaver') && <ThreadWeaverEffect notes={notes} />}

      {/* cluster_beacon: colored halos around note clusters */}
      {activeEffects.has('cluster_beacon') && <ClusterBeaconEffect notes={notes} />}

      {/* nebula_skin: animated nebula background overlay */}
      {activeEffects.has('nebula_skin') && <NebulaSkinEffect />}

      {/* aura_field: mood-responsive glow based on note colors */}
      {activeEffects.has('aura_field') && <AuraFieldEffect notes={notes} />}

      {/* signature_border: personal void border glow */}
      {activeEffects.has('signature_border') && <SignatureBorderEffect />}

      {/* void_compass: minimap radar */}
      {activeEffects.has('void_compass') && <VoidCompassEffect notes={notes} onWarpTo={onWarpTo} />}

      {/* warp_jump: floating warp button that zooms to cluster */}
      {activeEffects.has('warp_jump') && notes.length > 0 && (
        <WarpJumpButton notes={notes} onWarpTo={onWarpTo} />
      )}

      {/* echo_archive: floating button to open note history timeline */}
      {activeEffects.has('echo_archive') && (
        <EchoArchiveButton onOpen={onOpenEchoArchive} />
      )}
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
            opacity: Math.max(0.05, 0.25 * (1 - dist / PROXIMITY)),
          });
        }
      }
    }
    return result;
  }, [notes]);

  return (
    <svg className="fixed inset-0 z-[6] pointer-events-none w-full h-full">
      <defs>
        <filter id="thread-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="hsl(270 60% 70%)"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={l.opacity}
          filter="url(#thread-glow)"
        />
      ))}
    </svg>
  );
}

/* ── cluster_beacon ── Colored halos around groups of 3+ nearby notes */
function ClusterBeaconEffect({ notes }: { notes: Note[] }) {
  const [tick, setTick] = useState(0);

  // Pulse animation
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

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
          <stop offset="0%" stopColor="hsl(270 60% 50%)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="hsl(270 60% 50%)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {clusters.map((c, i) => (
        <g key={i}>
          <circle cx={c.cx} cy={c.cy} r={c.radius} fill="url(#beacon-grad)" />
          {/* Pulsing ring */}
          <circle
            cx={c.cx} cy={c.cy}
            r={c.radius * (0.6 + 0.4 * ((tick % 3) / 3))}
            fill="none"
            stroke="hsl(270 60% 60%)"
            strokeWidth="1"
            opacity={0.3 - 0.3 * ((tick % 3) / 3)}
          />
        </g>
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
          'radial-gradient(ellipse at 30% 40%, hsl(270 50% 15% / 0.35) 0%, transparent 60%)',
          'radial-gradient(ellipse at 70% 60%, hsl(220 50% 15% / 0.35) 0%, transparent 60%)',
          'radial-gradient(ellipse at 50% 30%, hsl(300 40% 15% / 0.35) 0%, transparent 60%)',
          'radial-gradient(ellipse at 20% 70%, hsl(200 50% 15% / 0.35) 0%, transparent 60%)',
          'radial-gradient(ellipse at 30% 40%, hsl(270 50% 15% / 0.35) 0%, transparent 60%)',
        ],
      }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/* ── aura_field ── Board-wide mood glow based on dominant note color */
function AuraFieldEffect({ notes }: { notes: Note[] }) {
  // Map note colors to hues for real mood-responsive behavior
  const colorToHue: Record<string, number> = {
    '#fef08a': 55,   // yellow → warm
    '#86efac': 140,  // green → calm
    '#93c5fd': 215,  // blue → cool
    '#f9a8d4': 330,  // pink → soft
    '#fca5a5': 0,    // red → intense
    '#c4b5fd': 270,  // purple → cosmic (default)
    '#fdba74': 30,   // orange → energetic
    '#6ee7b7': 160,  // teal → focused
  };

  const dominantHue = useMemo(() => {
    const coloredNotes = notes.filter(n => n.color);
    if (coloredNotes.length === 0) return 270;
    // Count occurrences of each color
    const tally: Record<string, number> = {};
    for (const note of coloredNotes) {
      tally[note.color!] = (tally[note.color!] || 0) + 1;
    }
    const dominant = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
    return colorToHue[dominant] ?? 270;
  }, [notes]);

  return (
    <motion.div
      className="fixed inset-0 z-[3] pointer-events-none"
      animate={{
        background: [
          `radial-gradient(ellipse at 30% 50%, hsl(${dominantHue} 50% 25% / 0.18) 0%, transparent 65%)`,
          `radial-gradient(ellipse at 70% 50%, hsl(${dominantHue} 50% 25% / 0.22) 0%, transparent 65%)`,
          `radial-gradient(ellipse at 50% 30%, hsl(${dominantHue} 50% 25% / 0.18) 0%, transparent 65%)`,
        ],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
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
          'inset 0 0 30px hsl(270 60% 40% / 0.25), inset 0 0 60px hsl(45 90% 55% / 0.12)',
          'inset 0 0 50px hsl(270 60% 40% / 0.4), inset 0 0 80px hsl(45 90% 55% / 0.2)',
          'inset 0 0 30px hsl(270 60% 40% / 0.25), inset 0 0 60px hsl(45 90% 55% / 0.12)',
        ],
      }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/* ── void_compass ── Minimap showing note distribution, click to warp */
function VoidCompassEffect({ notes, onWarpTo }: { notes: Note[]; onWarpTo?: (x: number, y: number) => void }) {
  const dots = useMemo(() => {
    if (notes.length === 0) return [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return notes.map(n => ({
      x: Math.min(96, Math.max(2, (n.position.x / vw) * 100)),
      y: Math.min(96, Math.max(2, (n.position.y / vh) * 100)),
      rawX: n.position.x,
      rawY: n.position.y,
    }));
  }, [notes]);

  return (
    <div className="fixed bottom-16 right-4 z-[100] w-24 h-24 border border-foreground/20 bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-0 p-1">
        <div className="relative w-full h-full">
          {dots.map((d, i) => (
            <button
              key={i}
              onClick={() => onWarpTo?.(d.rawX, d.rawY)}
              className="absolute w-1.5 h-1.5 bg-purple-400/70 hover:bg-purple-300 transition-colors cursor-pointer"
              style={{ left: `${d.x}%`, top: `${d.y}%`, transform: 'translate(-50%, -50%)' }}
              title="Jump to note"
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

/* ── warp_jump ── Floating button that zooms to the densest note cluster */
function WarpJumpButton({ notes, onWarpTo }: { notes: Note[]; onWarpTo?: (x: number, y: number) => void }) {
  const clusterCenter = useMemo(() => {
    if (notes.length === 0) return null;
    // Find densest cluster: group notes within 400px of each other
    let bestGroup: Note[] = [];
    for (const pivot of notes) {
      const group = notes.filter(n => {
        const dx = n.position.x - pivot.position.x;
        const dy = n.position.y - pivot.position.y;
        return Math.sqrt(dx * dx + dy * dy) < 400;
      });
      if (group.length > bestGroup.length) bestGroup = group;
    }
    const cx = bestGroup.reduce((s, n) => s + n.position.x, 0) / bestGroup.length;
    const cy = bestGroup.reduce((s, n) => s + n.position.y, 0) / bestGroup.length;
    return { x: cx, y: cy };
  }, [notes]);

  if (!clusterCenter) return null;

  return (
    <motion.button
      onClick={() => onWarpTo?.(clusterCenter.x, clusterCenter.y)}
      className="fixed bottom-16 left-20 z-[100] flex items-center gap-2 px-3 py-2 border border-foreground/40 bg-background/80 backdrop-blur-sm hover:bg-foreground hover:text-background transition-colors font-mono text-[10px] uppercase tracking-widest"
      title="Warp to densest note cluster"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
    >
      ⚡ Warp
    </motion.button>
  );
}

/* ── echo_archive ── Floating button to open note history timeline */
function EchoArchiveButton({ onOpen }: { onOpen?: () => void }) {
  const [pulse, setPulse] = useState(false);

  // Pulse every 10s to remind the user it exists
  useEffect(() => {
    const id = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.button
      onClick={onOpen}
      className="fixed bottom-28 left-4 z-[100] flex items-center gap-2 px-3 py-2 border border-foreground/40 bg-background/80 backdrop-blur-sm hover:bg-foreground hover:text-background transition-colors font-mono text-[10px] uppercase tracking-widest"
      title="Open note history timeline"
      animate={pulse ? { boxShadow: ['0 0 0px hsl(270 60% 60% / 0)', '0 0 16px hsl(270 60% 60% / 0.7)', '0 0 0px hsl(270 60% 60% / 0)'] } : {}}
      transition={{ duration: 0.8 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
    >
      📼 Echo
    </motion.button>
  );
}
