import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface NotePosition {
  x: number;
  y: number;
}

interface NotePositionsContextType {
  positions: Map<string, NotePosition>;
  updatePosition: (id: string, position: NotePosition) => void;
  getPosition: (id: string) => NotePosition | undefined;
  forceUpdate: number; // Trigger re-renders for SVG lines
}

const NotePositionsContext = createContext<NotePositionsContextType | null>(null);

export function NotePositionsProvider({ children }: { children: React.ReactNode }) {
  const positionsRef = useRef(new Map<string, NotePosition>());
  const [forceUpdate, setForceUpdate] = useState(0);
  // Throttle re-renders to at most once per animation frame
  const rafRef = useRef<number | null>(null);

  const updatePosition = useCallback((id: string, position: NotePosition) => {
    positionsRef.current.set(id, position);
    // Batch re-renders via rAF to avoid flooding the tree during drag
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setForceUpdate(prev => prev + 1);
      });
    }
  }, []);

  const getPosition = useCallback((id: string) => {
    return positionsRef.current.get(id);
  }, []);

  return (
    <NotePositionsContext.Provider 
      value={{ 
        positions: positionsRef.current, 
        updatePosition, 
        getPosition,
        forceUpdate 
      }}
    >
      {children}
    </NotePositionsContext.Provider>
  );
}

export function useNotePositions() {
  const context = useContext(NotePositionsContext);
  if (!context) {
    throw new Error('useNotePositions must be used within a NotePositionsProvider');
  }
  return context;
}
