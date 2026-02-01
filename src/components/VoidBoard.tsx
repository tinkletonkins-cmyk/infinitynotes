import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Loader2, Link2, X } from 'lucide-react';
import { StickyNote } from './StickyNote';
import { Switch } from '@/components/ui/switch';
import { useNotes, Note } from '@/hooks/useNotes';
import { useConnections } from '@/hooks/useConnections';
import { ConnectionsOverlay } from './ConnectionsOverlay';
import { SearchBar } from './SearchBar';
import { NotePositionsProvider, useNotePositions } from '@/contexts/NotePositionsContext';

const NOTE_WIDTH = 256;
const NOTE_HEIGHT = 200;
const OVERLAP_THRESHOLD = 150; // How close notes need to be to be considered overlapping

function noteMatchesSearch(note: Note, query: string): boolean {
  if (!query.trim()) return true;
  return note.text.toLowerCase().includes(query.toLowerCase());
}

function getRandomPosition(): { x: number; y: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  return {
    x: Math.random() * (viewportWidth - 300) + 50,
    y: Math.random() * (viewportHeight - 300) + 100,
  };
}

function getDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
}

function pointToLineDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

function VoidBoardContent() {
  const { notes, isLoading, addNote, updateNote, deleteNote } = useNotes();
  const { connections, addConnection, removeConnectionsForNote } = useConnections();
  const { getPosition } = useNotePositions();
  
  const [isBoardMode, setIsBoardMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // Track mouse position when connecting
  useEffect(() => {
    if (!connectingFrom) {
      setMousePosition(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectingFrom(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [connectingFrom]);

  // Filter notes based on search
  const filteredNotes = useMemo(() => {
    return notes.filter(note => noteMatchesSearch(note, searchQuery));
  }, [notes, searchQuery]);

  const handleAddNote = useCallback(() => {
    addNote();
  }, [addNote]);

  const handleNoteDrop = useCallback((
    droppedId: string,
    newPosition: { x: number; y: number }
  ) => {
    updateNote(droppedId, { position: newPosition });
  }, [updateNote]);

  const handleUpdateNote = useCallback((
    id: string, 
    updates: { text?: string; position?: { x: number; y: number }; color?: string | null }
  ) => {
    updateNote(id, updates);
  }, [updateNote]);

  const handleDeleteNote = useCallback((id: string) => {
    removeConnectionsForNote(id);
    deleteNote(id);
  }, [deleteNote, removeConnectionsForNote]);

  const handleStartConnection = useCallback((noteId: string) => {
    if (connectingFrom === noteId) {
      // Cancel connection if clicking same note
      setConnectingFrom(null);
    } else {
      setConnectingFrom(noteId);
    }
  }, [connectingFrom]);

  const handleCompleteConnection = useCallback(async (targetId: string) => {
    if (!connectingFrom || connectingFrom === targetId) {
      setConnectingFrom(null);
      return;
    }

    // Get positions of connected notes
    const fromPos = getPosition(connectingFrom) || notes.find(n => n.id === connectingFrom)?.position;
    const toPos = getPosition(targetId) || notes.find(n => n.id === targetId)?.position;

    if (!fromPos || !toPos) {
      setConnectingFrom(null);
      return;
    }

    // Find notes that might overlap with the connection line or connected notes
    const lineCenter = {
      x: (fromPos.x + toPos.x) / 2 + NOTE_WIDTH / 2,
      y: (fromPos.y + toPos.y) / 2 + NOTE_HEIGHT / 2,
    };

    const fromCenter = { x: fromPos.x + NOTE_WIDTH / 2, y: fromPos.y + NOTE_HEIGHT / 2 };
    const toCenter = { x: toPos.x + NOTE_WIDTH / 2, y: toPos.y + NOTE_HEIGHT / 2 };

    // Find overlapping notes and move them
    const notesToMove = notes.filter(note => {
      if (note.id === connectingFrom || note.id === targetId) return false;
      
      const notePos = getPosition(note.id) || note.position;
      const noteCenter = { x: notePos.x + NOTE_WIDTH / 2, y: notePos.y + NOTE_HEIGHT / 2 };
      
      // Check if note overlaps with either connected note
      const distToFrom = getDistance(noteCenter, fromCenter);
      const distToTo = getDistance(noteCenter, toCenter);
      
      if (distToFrom < OVERLAP_THRESHOLD || distToTo < OVERLAP_THRESHOLD) {
        return true;
      }
      
      // Check if note is too close to the connection line
      const distToLine = pointToLineDistance(noteCenter, fromCenter, toCenter);
      if (distToLine < OVERLAP_THRESHOLD) {
        return true;
      }
      
      return false;
    });

    // Move overlapping notes to random positions
    for (const note of notesToMove) {
      let newPos = getRandomPosition();
      let attempts = 0;
      
      // Try to find a position that doesn't overlap with connected notes
      while (attempts < 10) {
        const newCenter = { x: newPos.x + NOTE_WIDTH / 2, y: newPos.y + NOTE_HEIGHT / 2 };
        const distToFrom = getDistance(newCenter, fromCenter);
        const distToTo = getDistance(newCenter, toCenter);
        const distToLine = pointToLineDistance(newCenter, fromCenter, toCenter);
        
        if (distToFrom > OVERLAP_THRESHOLD && distToTo > OVERLAP_THRESHOLD && distToLine > OVERLAP_THRESHOLD) {
          break;
        }
        
        newPos = getRandomPosition();
        attempts++;
      }
      
      updateNote(note.id, { position: newPos });
    }

    // Create the connection
    await addConnection(connectingFrom, targetId);
    setConnectingFrom(null);
  }, [connectingFrom, notes, getPosition, addConnection, updateNote]);

  const cancelConnection = useCallback(() => {
    setConnectingFrom(null);
  }, []);

  return (
    <div className={`void-board relative ${isBoardMode ? 'mode-board' : ''}`}>
      {/* SVG Connections Overlay */}
      <ConnectionsOverlay 
        notes={notes} 
        connections={connections}
        searchQuery={searchQuery} 
        visible={true}
        connectingFrom={connectingFrom}
        mousePosition={mousePosition}
      />

      {/* Title */}
      <header className="fixed top-0 left-0 right-0 z-40 p-4 border-b border-foreground bg-background">
        <h1 className="text-xl font-bold uppercase tracking-[0.5em] text-center">
          THE MULTIPLAYER VOID
        </h1>
      </header>

      {/* Search Bar */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        <SearchBar 
          query={searchQuery}
          onQueryChange={setSearchQuery}
          resultCount={filteredNotes.length}
          totalCount={notes.length}
        />
      </div>

      {/* Connection Mode Indicator */}
      {connectingFrom && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500 text-yellow-300 rounded-lg">
          <Link2 size={16} />
          <span className="text-sm font-mono uppercase tracking-wider">
            Click another note to connect
          </span>
          <button
            onClick={cancelConnection}
            className="ml-2 p-1 hover:bg-yellow-500/30 rounded"
            title="Cancel connection"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Mode toggle */}
      <div className="mode-toggle">
        <span className={`mode-toggle-label ${!isBoardMode ? 'opacity-100' : 'opacity-50'}`}>
          VOID
        </span>
        <Switch
          checked={isBoardMode}
          onCheckedChange={setIsBoardMode}
          className="data-[state=checked]:bg-foreground data-[state=unchecked]:bg-muted"
        />
        <span className={`mode-toggle-label ${isBoardMode ? 'opacity-100' : 'opacity-50'}`}>
          BOARD
        </span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Notes container */}
      <div className="pt-16 min-h-screen" onClick={connectingFrom ? cancelConnection : undefined}>
        {notes.map((note) => {
          const isMatch = noteMatchesSearch(note, searchQuery);
          const isConnecting = connectingFrom === note.id;
          const isConnectionTarget = connectingFrom !== null && connectingFrom !== note.id;
          
          return (
            <StickyNote
              key={note.id}
              id={note.id}
              initialText={note.text}
              initialPosition={note.position}
              initialRotation={note.rotation}
              initialColor={note.color}
              dimmed={searchQuery.trim() !== '' && !isMatch}
              isConnecting={isConnecting}
              isConnectionTarget={isConnectionTarget}
              onDelete={handleDeleteNote}
              onUpdate={handleUpdateNote}
              onDrop={handleNoteDrop}
              onStartConnection={handleStartConnection}
              onCompleteConnection={handleCompleteConnection}
            />
          );
        })}

        {/* Empty state */}
        {!isLoading && notes.length === 0 && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted-foreground">
              <p className="text-lg uppercase tracking-widest mb-2">THE VOID AWAITS</p>
              <p className="text-sm opacity-50">Click + to spawn a note</p>
            </div>
          </div>
        )}
      </div>

      {/* Spawn button */}
      <button
        onClick={handleAddNote}
        className="btn-spawn"
        title="Spawn new note"
      >
        <Plus size={32} strokeWidth={2} />
      </button>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 p-4 text-xs text-muted-foreground uppercase tracking-wider">
        Notes: {notes.length} | Connections: {connections.length}
      </footer>
    </div>
  );
}

export function VoidBoard() {
  return (
    <NotePositionsProvider>
      <VoidBoardContent />
    </NotePositionsProvider>
  );
}
