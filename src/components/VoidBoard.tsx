import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { StickyNote } from './StickyNote';

interface Note {
  id: string;
  position: { x: number; y: number };
  rotation: number;
}

function generateId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getRandomRotation(): number {
  return (Math.random() * 4) - 2; // -2 to +2 degrees
}

function getRandomPosition(): { x: number; y: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  return {
    x: Math.random() * (viewportWidth - 300) + 50,
    y: Math.random() * (viewportHeight - 300) + 100,
  };
}

export function VoidBoard() {
  const [notes, setNotes] = useState<Note[]>([]);

  const addNote = useCallback(() => {
    const newNote: Note = {
      id: generateId(),
      position: getRandomPosition(),
      rotation: getRandomRotation(),
    };
    setNotes((prev) => [...prev, newNote]);
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }, []);

  return (
    <div className="void-board relative">
      {/* Title */}
      <header className="fixed top-0 left-0 right-0 z-40 p-4 border-b border-foreground bg-background">
        <h1 className="text-xl font-bold uppercase tracking-[0.5em] text-center">
          THE MULTIPLAYER VOID
        </h1>
      </header>

      {/* Notes container */}
      <div className="pt-16 min-h-screen">
        {notes.map((note) => (
          <StickyNote
            key={note.id}
            id={note.id}
            initialPosition={note.position}
            initialRotation={note.rotation}
            onDelete={deleteNote}
          />
        ))}

        {/* Empty state */}
        {notes.length === 0 && (
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
        onClick={addNote}
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
