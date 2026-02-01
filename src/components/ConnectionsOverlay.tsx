import React, { useMemo } from 'react';
import { Note } from '@/hooks/useNotes';

const NOTE_WIDTH = 256;
const NOTE_HEIGHT = 200;

interface ConnectionsOverlayProps {
  notes: Note[];
  searchQuery: string;
}

function getNoteCenter(note: Note): { x: number; y: number } {
  return {
    x: note.position.x + NOTE_WIDTH / 2,
    y: note.position.y + NOTE_HEIGHT / 2,
  };
}

function noteMatchesSearch(note: Note, query: string): boolean {
  if (!query.trim()) return true;
  return note.text.toLowerCase().includes(query.toLowerCase());
}

export function ConnectionsOverlay({ notes, searchQuery }: ConnectionsOverlayProps) {
  // Build connections from parent-child relationships
  const connections = useMemo(() => {
    const lines: { from: Note; to: Note; dimmed: boolean }[] = [];
    
    notes.forEach(note => {
      if (note.parent_id) {
        const parent = notes.find(n => n.id === note.parent_id);
        if (parent) {
          // Dim connection if either note doesn't match search
          const dimmed = searchQuery.trim() !== '' && (
            !noteMatchesSearch(note, searchQuery) || 
            !noteMatchesSearch(parent, searchQuery)
          );
          lines.push({ from: parent, to: note, dimmed });
        }
      }
    });
    
    return lines;
  }, [notes, searchQuery]);

  if (connections.length === 0) return null;

  return (
    <svg
      className="fixed inset-0 pointer-events-none z-0"
      style={{ width: '100%', height: '100%' }}
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
            fill="currentColor"
            className="text-foreground"
          />
        </marker>
      </defs>
      
      {connections.map(({ from, to, dimmed }, i) => {
        const fromCenter = getNoteCenter(from);
        const toCenter = getNoteCenter(to);
        
        return (
          <line
            key={`${from.id}-${to.id}-${i}`}
            x1={fromCenter.x}
            y1={fromCenter.y}
            x2={toCenter.x}
            y2={toCenter.y}
            stroke="currentColor"
            strokeWidth={2}
            strokeDasharray="8,4"
            className={`text-foreground transition-opacity duration-300 ${dimmed ? 'opacity-10' : 'opacity-50'}`}
            markerEnd="url(#arrowhead)"
          />
        );
      })}
    </svg>
  );
}
