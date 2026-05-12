import { useEffect, useRef, useState, useCallback } from 'react';
import type { Note } from '@/hooks/useNotes';

const NOTE_W = 256;
const NOTE_H = 200;

interface LassoSelectProps {
  scale: number;
  panX: number;
  panY: number;
  notes: Note[];
  isActive: boolean;
  onSummarize: (noteIds: string[]) => void;
  onColorCode: (noteIds: string[]) => void;
  onGroup: (noteIds: string[]) => void;
  onStack: (noteIds: string[]) => void;
}

interface ScreenRect { left: number; top: number; width: number; height: number; }

/**
 * Select mode or Shift+drag on empty canvas to lasso multiple notes.
 * Releases an action menu (Group / Summarize / Color Code / Stack) above the selection.
 */
export function LassoSelect({ scale, panX, panY, notes, isActive, onSummarize, onColorCode, onGroup, onStack }: LassoSelectProps) {
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [current, setCurrent] = useState<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<{ rect: ScreenRect; noteIds: string[] } | null>(null);
  const [missRect, setMissRect] = useState<ScreenRect | null>(null);
  const draggingRef = useRef(false);
  const suppressNextClickRef = useRef(false);

  // Track the latest notes via ref so handlers don't need to rebind
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const transformRef = useRef({ scale, panX, panY });
  transformRef.current = { scale, panX, panY };

  const getRectForIds = useCallback((ids: string[]): ScreenRect | null => {
    const boxes = ids
      .map((id) => document.querySelector<HTMLElement>(`[data-note-id="${CSS.escape(id)}"]`)?.getBoundingClientRect())
      .filter((box): box is DOMRect => !!box);

    if (boxes.length === 0) return null;

    const left = Math.min(...boxes.map((box) => box.left));
    const top = Math.min(...boxes.map((box) => box.top));
    const right = Math.max(...boxes.map((box) => box.right));
    const bottom = Math.max(...boxes.map((box) => box.bottom));

    return { left, top, width: right - left, height: bottom - top };
  }, []);

  const computeNoteIds = useCallback((rect: ScreenRect): string[] => {
    const domIds = Array.from(document.querySelectorAll<HTMLElement>('[data-note-id]'))
      .filter((el) => {
        const box = el.getBoundingClientRect();
        return box.left < rect.left + rect.width &&
          box.right > rect.left &&
          box.top < rect.top + rect.height &&
          box.bottom > rect.top;
      })
      .map((el) => el.dataset.noteId)
      .filter((id): id is string => !!id);

    if (domIds.length > 0) return domIds;

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
      if (e.button !== 0) return;
      if (!isActive && !e.shiftKey) return;
      const target = e.target as HTMLElement;
      const noteEl = target.closest<HTMLElement>('[data-note-id]');
      if (isActive && noteEl && !target.closest('button, [data-lasso-menu]')) {
        e.preventDefault();
        e.stopPropagation();
        const id = noteEl.dataset.noteId;
        if (!id) return;
        setSelection((prev) => {
          const nextIds = prev?.noteIds.includes(id)
            ? prev.noteIds.filter((noteId) => noteId !== id)
            : [...(prev?.noteIds ?? []), id];
          if (nextIds.length === 0) return null;
          const rect = getRectForIds(nextIds);
          return rect ? { rect, noteIds: nextIds } : null;
        });
        return;
      }
      // Only start lasso when clicking on the raw board, not on UI or notes
      if (target.closest('button, input, textarea, header, footer, [data-lasso-menu]')) return;
      if (!isActive && target.closest('[data-note-id]')) return;
      if (!target.closest('.void-board')) return;
      // Don't hijack panning (Space+drag is handled by useZoomPan via cursor=grab)
      if (document.body.style.cursor === 'grab' || document.body.style.cursor === 'grabbing') return;
      e.preventDefault();
      e.stopPropagation();
      draggingRef.current = true;
      setSelection(null);
      setMissRect(null);
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
          suppressNextClickRef.current = true;
          if (ids.length > 0) {
            setSelection({ rect, noteIds: ids });
          } else {
            setMissRect(rect);
            window.setTimeout(() => setMissRect(null), 1600);
          }
        }
        return null;
      });
      setCurrent(null);
    };
    // Dismiss menu on outside click
    const onClickAnywhere = (e: MouseEvent) => {
      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false;
        return;
      }
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
  }, [computeNoteIds, getRectForIds, isActive]);

  const liveRect: ScreenRect | null = start && current ? {
    left: Math.min(start.x, current.x),
    top: Math.min(start.y, current.y),
    width: Math.abs(current.x - start.x),
    height: Math.abs(current.y - start.y),
  } : null;

  return (
    <>
      {liveRect && (liveRect.width > 4 || liveRect.height > 4) && (
        <div
          className="fixed pointer-events-none border-2 border-dashed border-accent bg-accent/10"
          style={{ left: liveRect.left, top: liveRect.top, width: liveRect.width, height: liveRect.height, zIndex: 9998 }}
        />
      )}
      {isActive && !selection && !liveRect && (
        <div className="fixed left-1/2 top-28 z-[9997] -translate-x-1/2 pointer-events-none border border-foreground bg-background px-4 py-2 shadow-[4px_4px_0_0_hsl(var(--foreground)/0.25)]">
          <span className="text-xs uppercase tracking-widest font-mono">Click notes or drag a box, then choose Stack</span>
        </div>
      )}
      {missRect && (
        <div
          className="fixed pointer-events-none border-2 border-dashed border-destructive bg-destructive/10"
          style={{ left: missRect.left, top: missRect.top, width: missRect.width, height: missRect.height, zIndex: 9998 }}
        >
          <div className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap bg-background border border-destructive px-2 py-1 text-[10px] uppercase tracking-wider font-mono text-destructive">
            No notes inside
          </div>
        </div>
      )}
      {selection && (
        <>
          <div
            className="fixed pointer-events-none border-2 border-accent/70 bg-accent/5"
            style={{ left: selection.rect.left, top: selection.rect.top, width: selection.rect.width, height: selection.rect.height, zIndex: 9998 }}
          />
          <div
            data-lasso-menu
            className="fixed flex items-center gap-1 px-2 py-1 bg-background border border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground)/0.25)]"
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
