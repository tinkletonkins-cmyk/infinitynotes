import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Loader2, Eye, EyeOff } from 'lucide-react';
import { StickyNote } from './StickyNote';
import { Switch } from '@/components/ui/switch';
import { useNotes, Note } from '@/hooks/useNotes';
import { ConnectionsOverlay } from './ConnectionsOverlay';
import { SearchBar } from './SearchBar';

const NOTE_WIDTH = 256;
const NOTE_HEIGHT = 200;
const STACK_OFFSET = 15; // Visual offset for stacked notes

function notesOverlap(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number }
): boolean {
  const overlap = 50;
  return (
    Math.abs(pos1.x - pos2.x) < NOTE_WIDTH - overlap &&
    Math.abs(pos1.y - pos2.y) < NOTE_HEIGHT - overlap
  );
}

function noteMatchesSearch(note: Note, query: string): boolean {
  if (!query.trim()) return true;
  return note.text.toLowerCase().includes(query.toLowerCase());
}

export function VoidBoard() {
  const { notes, isLoading, addNote, updateNote, deleteNote } = useNotes();
  const [isBoardMode, setIsBoardMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLines, setShowLines] = useState(true);

  // Build parent-child relationships map
  const childrenMap = useMemo(() => {
    const map = new Map<string, Note[]>();
    notes.forEach(note => {
      if (note.parent_id) {
        const children = map.get(note.parent_id) || [];
        children.push(note);
        map.set(note.parent_id, children);
      }
    });
    return map;
  }, [notes]);

  // Calculate stack depth for each note (for visual offset)
  const stackDepths = useMemo(() => {
    const depths = new Map<string, number>();
    
    const getDepth = (noteId: string, visited: Set<string> = new Set()): number => {
      // Already computed
      if (depths.has(noteId)) return depths.get(noteId)!;
      
      // Cycle detection - prevent infinite recursion
      if (visited.has(noteId)) {
        depths.set(noteId, 0);
        return 0;
      }
      visited.add(noteId);
      
      const note = notes.find(n => n.id === noteId);
      if (!note || !note.parent_id) {
        depths.set(noteId, 0);
        return 0;
      }
      
      const parentDepth = getDepth(note.parent_id, visited);
      depths.set(noteId, parentDepth + 1);
      return parentDepth + 1;
    };
    
    notes.forEach(note => getDepth(note.id, new Set()));
    return depths;
  }, [notes]);

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
    const droppedNote = notes.find(n => n.id === droppedId);
    if (!droppedNote) return;

    const targetNote = notes.find(n => 
      n.id !== droppedId && 
      n.id !== droppedNote.parent_id &&
      notesOverlap(newPosition, n.position)
    );

    if (targetNote) {
      // Apply stack offset when parenting
      const targetDepth = stackDepths.get(targetNote.id) || 0;
      const offset = (targetDepth + 1) * STACK_OFFSET;
      const stackedPosition = {
        x: targetNote.position.x + offset,
        y: targetNote.position.y + offset,
      };
      updateNote(droppedId, { position: stackedPosition, parent_id: targetNote.id });
    } else {
      updateNote(droppedId, { position: newPosition, parent_id: null });
    }
  }, [notes, updateNote, stackDepths]);

  const handleNoteDrag = useCallback((
    parentId: string,
    deltaX: number,
    deltaY: number
  ) => {
    const children = childrenMap.get(parentId) || [];
    children.forEach(child => {
      const newPos = {
        x: child.position.x + deltaX,
        y: child.position.y + deltaY,
      };
      updateNote(child.id, { position: newPos });
    });
  }, [childrenMap, updateNote]);

  const handleUpdateNote = useCallback((
    id: string, 
    updates: { text?: string; position?: { x: number; y: number }; color?: string | null }
  ) => {
    updateNote(id, updates);
  }, [updateNote]);

  const handleDeleteNote = useCallback((id: string) => {
    const children = childrenMap.get(id) || [];
    children.forEach(child => {
      updateNote(child.id, { parent_id: null });
    });
    deleteNote(id);
  }, [deleteNote, childrenMap, updateNote]);

  return (
    <div className={`void-board relative ${isBoardMode ? 'mode-board' : ''}`}>
      {/* SVG Connections Overlay */}
      <ConnectionsOverlay notes={notes} searchQuery={searchQuery} visible={showLines} />

      {/* Title */}
      <header className="fixed top-0 left-0 right-0 z-40 p-4 border-b border-foreground bg-background">
        <h1 className="text-xl font-bold uppercase tracking-[0.5em] text-center">
          THE MULTIPLAYER VOID
        </h1>
      </header>

      {/* Search Bar and Connections Toggle */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        <SearchBar 
          query={searchQuery}
          onQueryChange={setSearchQuery}
          resultCount={filteredNotes.length}
          totalCount={notes.length}
        />
        <button
          onClick={() => setShowLines(!showLines)}
          className="flex items-center gap-2 px-3 py-2 bg-background border border-foreground hover:bg-foreground hover:text-background transition-colors"
          title={showLines ? 'Hide connections' : 'Show connections'}
        >
          {showLines ? <Eye size={16} /> : <EyeOff size={16} />}
          <span className="text-xs uppercase tracking-wider font-mono hidden sm:inline">Lines</span>
        </button>
      </div>

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
      <div className="pt-16 min-h-screen">
        {notes.map((note) => {
          const isMatch = noteMatchesSearch(note, searchQuery);
          const stackDepth = stackDepths.get(note.id) || 0;
          
          return (
            <StickyNote
              key={note.id}
              id={note.id}
              initialText={note.text}
              initialPosition={note.position}
              initialRotation={note.rotation}
              initialColor={note.color}
              parentId={note.parent_id}
              stackDepth={stackDepth}
              dimmed={searchQuery.trim() !== '' && !isMatch}
              onDelete={handleDeleteNote}
              onUpdate={handleUpdateNote}
              onDrop={handleNoteDrop}
              onDrag={handleNoteDrag}
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
        Notes: {notes.length}
      </footer>
    </div>
  );
}
