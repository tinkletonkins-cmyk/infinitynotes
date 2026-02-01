import { useState, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { StickyNote } from './StickyNote';
import { Switch } from '@/components/ui/switch';
import { useNotes } from '@/hooks/useNotes';

export function VoidBoard() {
  const { notes, isLoading, addNote, updateNote, deleteNote } = useNotes();

  const handleAddNote = useCallback(() => {
    addNote();
  }, [addNote]);

  const handleStackNote = useCallback((parentId: string, parentPosition: { x: number; y: number }) => {
    addNote(parentId, parentPosition);
  }, [addNote]);

  const handleUpdateNote = useCallback((id: string, updates: { text?: string; position?: { x: number; y: number } }) => {
    updateNote(id, updates);
  }, [updateNote]);

  const handleDeleteNote = useCallback((id: string) => {
    deleteNote(id);
  }, [deleteNote]);

  const [isBoardMode, setIsBoardMode] = useState(false);

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
            onDelete={handleDeleteNote}
            onUpdate={handleUpdateNote}
            onStack={handleStackNote}
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
