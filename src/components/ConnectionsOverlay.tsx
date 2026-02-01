import React from 'react';
import { Note } from '@/hooks/useNotes';
import { Connection } from '@/hooks/useConnections';
import { useNotePositions } from '@/contexts/NotePositionsContext';

const NOTE_WIDTH = 256;
const NOTE_HEIGHT = 200;

interface ConnectionsOverlayProps {
  notes: Note[];
  connections: Connection[];
  searchQuery: string;
  visible: boolean;
  connectingFrom: string | null;
  mousePosition: { x: number; y: number } | null;
}

function noteMatchesSearch(note: Note, query: string): boolean {
  if (!query.trim()) return true;
  return note.text.toLowerCase().includes(query.toLowerCase());
}

export function ConnectionsOverlay({ 
  notes, 
  connections, 
  searchQuery, 
  visible, 
  connectingFrom,
  mousePosition 
}: ConnectionsOverlayProps) {
  const { getPosition, forceUpdate } = useNotePositions();

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

  // Build connection lines with dimmed state
  const connectionLines = connections.map(conn => {
    const fromNote = notes.find(n => n.id === conn.from_note_id);
    const toNote = notes.find(n => n.id === conn.to_note_id);
    
    if (!fromNote || !toNote) return null;
    
    const dimmed = searchQuery.trim() !== '' && (
      !noteMatchesSearch(fromNote, searchQuery) || 
      !noteMatchesSearch(toNote, searchQuery)
    );
    
    return { 
      id: conn.id, 
      fromId: conn.from_note_id, 
      toId: conn.to_note_id, 
      dimmed 
    };
  }).filter(Boolean);

  const showOverlay = visible && (connectionLines.length > 0 || connectingFrom);

  if (!showOverlay) return null;

  return (
    <svg
      className="pointer-events-none"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
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
      
      {/* Existing connections */}
      {connectionLines.map((line) => {
        if (!line) return null;
        const fromNote = notes.find(n => n.id === line.fromId);
        const toNote = notes.find(n => n.id === line.toId);
        const fromCenter = getCenter(line.fromId, fromNote);
        const toCenter = getCenter(line.toId, toNote);
        
        return (
          <line
            key={`${line.id}-${forceUpdate}`}
            x1={fromCenter.x}
            y1={fromCenter.y}
            x2={toCenter.x}
            y2={toCenter.y}
            stroke="white"
            strokeWidth={2}
            strokeDasharray="8,4"
            filter="url(#glow)"
            opacity={line.dimmed ? 0.2 : 0.8}
            markerEnd="url(#arrowhead)"
          />
        );
      })}

      {/* Active connection being drawn */}
      {connectingFrom && mousePosition && (
        <line
          x1={getCenter(connectingFrom).x}
          y1={getCenter(connectingFrom).y}
          x2={mousePosition.x}
          y2={mousePosition.y}
          stroke="cyan"
          strokeWidth={2}
          strokeDasharray="4,4"
          filter="url(#glow)"
          opacity={0.8}
        />
      )}
    </svg>
  );
}
