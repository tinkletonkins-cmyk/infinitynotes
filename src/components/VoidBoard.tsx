import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { StickyNote } from './StickyNote';
import { Switch } from '@/components/ui/switch';
import { useNotes, Note } from '@/hooks/useNotes';

const NOTE_WIDTH = 256;
const NOTE_HEIGHT = 200;

function notesOverlap(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number }
): boolean {
  const overlap = 50; // Minimum overlap pixels to trigger parenting
  return (
    Math.abs(pos1.x - pos2.x) < NOTE_WIDTH - overlap &&
    Math.abs(pos1.y - pos2.y) < NOTE_HEIGHT - overlap
  );
}

export function VoidBoard() {
  const { notes, isLoading, addNote, updateNote, deleteNote } = useNotes();
  const [isBoardMode, setIsBoardMode] = useState(false);

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

  const handleAddNote = useCallback(() => {
    addNote();
  }, [addNote]);

  // Handle dropping a note - check for collision to parent it
  const handleNoteDrop = useCallback((
    droppedId: string,
    newPosition: { x: number; y: number }
  ) => {
    const droppedNote = notes.find(n => n.id === droppedId);
    if (!droppedNote) return;

    // Find overlapping note to parent to (excluding self and current parent)
    const targetNote = notes.find(n => 
      n.id !== droppedId && 
      n.id !== droppedNote.parent_id &&
      notesOverlap(newPosition, n.position)
    );

    if (targetNote) {
      // Parent the dropped note to the target
      updateNote(droppedId, { position: newPosition, parent_id: targetNote.id });
    } else {
      // Just update position, clear parent if no overlap
      updateNote(droppedId, { position: newPosition, parent_id: null });
    }
  }, [notes, updateNote]);

  // Handle dragging a parent - move all children with it
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
    // When deleting a parent, unparent all children
    const children = childrenMap.get(id) || [];
    children.forEach(child => {
      updateNote(child.id, { parent_id: null });
    });
    deleteNote(id);
  }, [deleteNote, childrenMap, updateNote]);

  return (
    <div className={`void-board relative ${isBoardMode ? 'mode-board' : ''}`}>
      {/* Title */}
      <header className="fixed top-0 left-0 right-0 z-40 p-4 border-b border-foreground bg-background">
        <h1 className="text-xl font-bold uppercase tracking-[0.5em] text-center">
          THE MULTIPLAYER VOID
        </h1>
      </header>

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
        {notes.map((note) => (
          <StickyNote
            key={note.id}
            id={note.id}
            initialText={note.text}
            initialPosition={note.position}
            initialRotation={note.rotation}
            initialColor={note.color}
            parentId={note.parent_id}
            onDelete={handleDeleteNote}
            onUpdate={handleUpdateNote}
            onDrop={handleNoteDrop}
            onDrag={handleNoteDrag}
          />
        ))}

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
