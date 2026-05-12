import { useEffect, useRef, useState, useCallback } from 'react';
import type { Note } from '@/hooks/useNotes';

const NOTE_W = 256;
const NOTE_H = 200;

interface LassoSelectProps {
  scale: number;
  panX: number;
  panY: number;
  notes: Note[];
  onSummarize: (noteIds: string[]) => void;
  onColorCode: (noteIds: string[]) => void;
  onGroup: (noteIds: string[]) => void;
  onStack: (noteIds: string[]) => void;
}

interface ScreenRect { left: number; top: number; width: number; height: number; }

/**
 * Hold Shift and drag on empty canvas to lasso multiple notes.
 * Releases an action menu (Group / Summarize / Color Code) above the selection.
 */
export function LassoSelect({ scale, panX, panY, notes, onSummarize, onColorCode, onGroup, onStack }: LassoSelectProps) {
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [current, setCurrent] = useState<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<{ rect: ScreenRect; noteIds: string[] } | null>(null);
  const draggingRef = useRef(false);

  // Track the latest notes via ref so handlers don't need to rebind
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const transformRef = useRef({ scale, panX, panY });
  transformRef.current = { scale, panX, panY };

  const computeNoteIds = useCallback((rect: ScreenRect): string[] => {
    const { scale: s, panX: px, panY: py } = transformRef.current;
    const x1 = (rect.left - px) / s;
    const y1 = (rect.top - py) / s;
    const x2 = (rect.left + rect.width - px) / s;
    const y2 = (rect.top + rect.height - py) / s;
    return notesRef.current
      .filter(n => {
        const cx = n.position.x + NOTE_W / 2;
        const cy = n.position.y + NOTE_H / 2;
        return cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2;
      })
      .map(n => n.id);
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!e.shiftKey || e.button !== 0) return;
      const target = e.target as HTMLElement;
      // Only start lasso when clicking on the raw board, not on UI or notes
      if (target.closest('button, input, textarea, header, footer, [data-note-id]')) return;
      if (!target.closest('.void-board')) return;
      e.preventDefault();
      e.stopPropagation();
      draggingRef.current = true;
      setSelection(null);
      setStart({ x: e.clientX, y: e.clientY });
      setCurrent({ x: e.clientX, y: e.clientY });
    };
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      setCurrent({ x: e.clientX, y: e.clientY });
    };
    const onUp = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setStart(prev => {
        if (!prev) return null;
        const rect: ScreenRect = {
          left: Math.min(prev.x, e.clientX),
          top: Math.min(prev.y, e.clientY),
          width: Math.abs(e.clientX - prev.x),
          height: Math.abs(e.clientY - prev.y),
        };
        if (rect.width > 8 && rect.height > 8) {
          const ids = computeNoteIds(rect);
          if (ids.length > 0) setSelection({ rect, noteIds: ids });
        }
        return null;
      });
      setCurrent(null);
    };
    // Dismiss menu on outside click
    const onClickAnywhere = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-lasso-menu]')) return;
      if (!draggingRef.current) setSelection(null);
    };
    window.addEventListener('mousedown', onDown, true);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('click', onClickAnywhere);
    return () => {
      window.removeEventListener('mousedown', onDown, true);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('click', onClickAnywhere);
    };
  }, [computeNoteIds]);

  const liveRect: ScreenRect | null = start && current ? {
    left: Math.min(start.x, current.x),
    top: Math.min(start.y, current.y),
    width: Math.abs(current.x - start.x),
    height: Math.abs(current.y - start.y),
  } : null;

  return (
    <>
      {liveRect && (
        <div
          className="fixed pointer-events-none border-2 border-dashed border-cyan-400 bg-cyan-400/10"
          style={{ left: liveRect.left, top: liveRect.top, width: liveRect.width, height: liveRect.height, zIndex: 9998 }}
        />
      )}
      {selection && (
        <>
          <div
            className="fixed pointer-events-none border-2 border-cyan-400/70 bg-cyan-400/5"
            style={{ left: selection.rect.left, top: selection.rect.top, width: selection.rect.width, height: selection.rect.height, zIndex: 9998 }}
          />
          <div
            data-lasso-menu
            className="fixed flex items-center gap-1 px-2 py-1 bg-background border border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,0.4)]"
            style={{
              left: selection.rect.left + selection.rect.width / 2,
              top: Math.max(8, selection.rect.top - 44),
              transform: 'translateX(-50%)',
              zIndex: 9999,
            }}
          >
            <span className="text-[10px] uppercase tracking-widest opacity-60 px-1 font-mono">
              {selection.noteIds.length} notes
            </span>
            <button
              className="px-3 py-1 text-xs uppercase tracking-wider font-mono hover:bg-foreground hover:text-background border-l border-foreground/20"
              onClick={() => { onGroup(selection.noteIds); setSelection(null); }}
            >
              Group
            </button>
            <button
              className="px-3 py-1 text-xs uppercase tracking-wider font-mono hover:bg-foreground hover:text-background border-l border-foreground/20"
              onClick={() => { onSummarize(selection.noteIds); setSelection(null); }}
            >
              Summarize
            </button>
            <button
              className="px-3 py-1 text-xs uppercase tracking-wider font-mono hover:bg-foreground hover:text-background border-l border-foreground/20"
              onClick={() => { onColorCode(selection.noteIds); setSelection(null); }}
            >
              Color Code
            </button>
            <button
              className="px-3 py-1 text-xs uppercase tracking-wider font-mono hover:bg-foreground hover:text-background border-l border-foreground/20"
              onClick={() => { onStack(selection.noteIds); setSelection(null); }}
            >
              Stack
            </button>
          </div>
        </>
      )}
    </>
  );
}
