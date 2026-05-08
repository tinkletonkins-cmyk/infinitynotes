import React from 'react';
import { useNotePositions } from '@/contexts/NotePositionsContext';
import type { Connection } from '@/hooks/useConnections';

interface NoteThreadsProps {
  connections: Connection[];
  notes: Array<{ id: string; position: { x: number; y: number } }>;
  noteWidth: number;
  noteHeight: number;
}

/**
 * Renders SVG threads between connected notes.
 * Lives inside the transformed viewport-container so it scales with the canvas.
 * Re-renders on every position change via NotePositionsContext.forceUpdate.
 */
function NoteThreadsImpl({ connections, notes, noteWidth, noteHeight }: NoteThreadsProps) {
  const { getPosition, forceUpdate } = useNotePositions();
  // Reference forceUpdate so React re-renders when positions change
  void forceUpdate;

  if (connections.length === 0) return null;

  const noteMap = new Map(notes.map(n => [n.id, n]));

  // Compute bounding canvas size — use the spawn area as a sensible default
  const SVG_W = 6000;
  const SVG_H = 6000;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: SVG_W, height: SVG_H, zIndex: 1500, overflow: 'visible' }}
    >
      <defs>
        <filter id="thread-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {connections.map(conn => {
        const fromNote = noteMap.get(conn.from_note_id);
        const toNote = noteMap.get(conn.to_note_id);
        if (!fromNote || !toNote) return null;

        const fromPos = getPosition(conn.from_note_id) || fromNote.position;
        const toPos = getPosition(conn.to_note_id) || toNote.position;

        const x1 = fromPos.x + noteWidth / 2;
        const y1 = fromPos.y + noteHeight / 2;
        const x2 = toPos.x + noteWidth / 2;
        const y2 = toPos.y + noteHeight / 2;

        // Slight curve so overlapping threads don't perfectly stack
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.max(1, Math.hypot(dx, dy));
        // perpendicular offset proportional to length
        const curve = Math.min(40, len * 0.08);
        const cx = mx + (-dy / len) * curve;
        const cy = my + (dx / len) * curve;

        const path = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

        return (
          <g key={conn.id} filter="url(#thread-glow)">
            <path
              d={path}
              stroke="hsl(50 100% 70% / 0.85)"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />
            <circle cx={x1} cy={y1} r={4} fill="hsl(50 100% 75%)" />
            <circle cx={x2} cy={y2} r={4} fill="hsl(50 100% 75%)" />
          </g>
        );
      })}
    </svg>
  );
}

export const NoteThreads = React.memo(NoteThreadsImpl);
