import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Note } from '@/hooks/useNotes';
import { useNotePositions } from '@/contexts/NotePositionsContext';

const NOTE_WIDTH = 256;
const NOTE_HEIGHT = 200;

interface ConnectionsOverlayProps {
  notes: Note[];
  searchQuery: string;
  visible: boolean;
}

function noteMatchesSearch(note: Note, query: string): boolean {
  if (!query.trim()) return true;
  return note.text.toLowerCase().includes(query.toLowerCase());
}

export function ConnectionsOverlay({ notes, searchQuery, visible }: ConnectionsOverlayProps) {
  const { getPosition, forceUpdate } = useNotePositions();

  // Build connections from parent-child relationships
  const connections = useMemo(() => {
    const lines: { fromId: string; toId: string; dimmed: boolean }[] = [];
    
    notes.forEach(note => {
      if (note.parent_id) {
        const parent = notes.find(n => n.id === note.parent_id);
        if (parent) {
          const dimmed = searchQuery.trim() !== '' && (
            !noteMatchesSearch(note, searchQuery) || 
            !noteMatchesSearch(parent, searchQuery)
          );
          lines.push({ fromId: parent.id, toId: note.id, dimmed });
        }
      }
    });
    
    return lines;
  }, [notes, searchQuery]);

  // Get real-time positions for line endpoints
  const getCenter = (noteId: string, fallbackNote?: Note) => {
    const pos = getPosition(noteId);
    if (pos) {
      return {
        x: pos.x + NOTE_WIDTH / 2,
        y: pos.y + NOTE_HEIGHT / 2,
      };
    }
    // Fallback to note's stored position
    const note = fallbackNote || notes.find(n => n.id === noteId);
    if (note) {
      return {
        x: note.position.x + NOTE_WIDTH / 2,
        y: note.position.y + NOTE_HEIGHT / 2,
      };
    }
    return { x: 0, y: 0 };
  };

  if (connections.length === 0 || !visible) return null;

  return (
    <svg
      className="pointer-events-none"
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 50,
        overflow: 'visible',
        filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.5)) drop-shadow(0 0 8px rgba(255,255,255,0.3))',
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="white"
          />
        </marker>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {connections.map(({ fromId, toId, dimmed }, i) => {
        const fromNote = notes.find(n => n.id === fromId);
        const toNote = notes.find(n => n.id === toId);
        const fromCenter = getCenter(fromId, fromNote);
        const toCenter = getCenter(toId, toNote);
        
        return (
          <line
            key={`${fromId}-${toId}-${i}-${forceUpdate}`}
            x1={fromCenter.x}
            y1={fromCenter.y}
            x2={toCenter.x}
            y2={toCenter.y}
            stroke="white"
            strokeWidth={2}
            strokeDasharray="8,4"
            filter="url(#glow)"
            opacity={dimmed ? 0.2 : 0.8}
            markerEnd="url(#arrowhead)"
          />
        );
      })}
    </svg>
  );
}
