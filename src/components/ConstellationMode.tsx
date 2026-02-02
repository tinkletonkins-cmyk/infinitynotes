import React, { useEffect, useState } from 'react';
import { Note } from '@/hooks/useNotes';
import { Connection } from '@/hooks/useConnections';
import { useNotePositions } from '@/contexts/NotePositionsContext';
import { motion } from 'framer-motion';

const NOTE_WIDTH = 256;
const NOTE_HEIGHT = 200;

interface ConstellationModeProps {
  notes: Note[];
  connections: Connection[];
  active: boolean;
}

interface StarPoint {
  id: string;
  x: number;
  y: number;
  size: number;
  twinkleDelay: number;
}

export function ConstellationMode({ notes, connections, active }: ConstellationModeProps) {
  const { getPosition, forceUpdate } = useNotePositions();
  const [stars, setStars] = useState<StarPoint[]>([]);

  // Generate star positions for connected notes
  useEffect(() => {
    if (!active) return;

    const connectedNoteIds = new Set<string>();
    connections.forEach(c => {
      connectedNoteIds.add(c.from_note_id);
      connectedNoteIds.add(c.to_note_id);
    });

    const newStars: StarPoint[] = [];
    connectedNoteIds.forEach(noteId => {
      const pos = getPosition(noteId);
      const note = notes.find(n => n.id === noteId);
      const position = pos || note?.position;
      
      if (position) {
        newStars.push({
          id: noteId,
          x: position.x + NOTE_WIDTH / 2,
          y: position.y + NOTE_HEIGHT / 2,
          size: 4 + Math.random() * 4,
          twinkleDelay: Math.random() * 2,
        });
      }
    });

    setStars(newStars);
  }, [active, connections, notes, getPosition, forceUpdate]);

  if (!active || connections.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Dark overlay for constellation effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background"
      />

      {/* SVG for constellation lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8)) drop-shadow(0 0 20px rgba(100,150,255,0.5))' }}
      >
        <defs>
          <linearGradient id="starline" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(150, 200, 255, 0.8)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 1)" />
            <stop offset="100%" stopColor="rgba(150, 200, 255, 0.8)" />
          </linearGradient>
        </defs>

        {/* Connection lines as constellation lines */}
        {connections.map(conn => {
          const fromNote = notes.find(n => n.id === conn.from_note_id);
          const toNote = notes.find(n => n.id === conn.to_note_id);
          
          if (!fromNote || !toNote) return null;
          
          const fromPos = getPosition(conn.from_note_id) || fromNote.position;
          const toPos = getPosition(conn.to_note_id) || toNote.position;
          
          const fromCenter = { x: fromPos.x + NOTE_WIDTH / 2, y: fromPos.y + NOTE_HEIGHT / 2 };
          const toCenter = { x: toPos.x + NOTE_WIDTH / 2, y: toPos.y + NOTE_HEIGHT / 2 };
          
          return (
            <motion.line
              key={conn.id}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              x1={fromCenter.x}
              y1={fromCenter.y}
              x2={toCenter.x}
              y2={toCenter.y}
              stroke="url(#starline)"
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Star points at note centers */}
      {stars.map(star => (
        <motion.div
          key={star.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            delay: star.twinkleDelay,
            repeat: Infinity,
            repeatType: 'loop',
          }}
          className="absolute rounded-full"
          style={{
            left: star.x - star.size / 2,
            top: star.y - star.size / 2,
            width: star.size,
            height: star.size,
            background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(150,200,255,0.8) 50%, transparent 100%)',
            boxShadow: `0 0 ${star.size * 2}px rgba(150,200,255,0.8), 0 0 ${star.size * 4}px rgba(100,150,255,0.5)`,
          }}
        />
      ))}

      {/* Instruction text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center"
      >
        <p className="text-sm uppercase tracking-[0.3em] text-white/60 font-mono">
          Constellation View
        </p>
        <p className="text-xs text-white/40 mt-2">
          {connections.length} connection{connections.length !== 1 ? 's' : ''} · {stars.length} star{stars.length !== 1 ? 's' : ''}
        </p>
      </motion.div>
    </div>
  );
}
