

## Separate Drawing System into Its Own Void

### What this means
Currently, drawing is an overlay on top of the note board — you toggle drawing mode and sketch directly over your sticky notes. The goal is to give drawing its own dedicated full-screen space, like a separate "canvas void" you can switch into, keeping the notes board clean and giving drawing room to breathe.

### Approach

**New "Canvas Void" mode** — a full-screen drawing workspace accessible from the toolbar, separate from the notes board. When you enter it, the notes disappear and you get a clean infinite canvas for freehand drawing. Drawings are stored per-void (or globally if no void is selected), same as today.

### Changes

**`src/components/VoidBoard.tsx`**
- Add a `canvasMode` boolean state
- When `canvasMode` is true, hide the notes container and show a full-screen `DrawingCanvas` instead of the small overlay
- Replace the current "Draw" toggle button behavior: instead of toggling `drawingMode` overlay, it now switches into the full canvas mode
- Pass the current `scale`/`x`/`y` zoom-pan state to the drawing canvas so it supports panning

**`src/components/DrawingCanvas.tsx`**
- Refactor to support two rendering modes:
  - **Inline mode** (current behavior, `isActive=false`): renders saved drawings as a read-only SVG layer on the notes board so old drawings still appear
  - **Full-screen mode** (new): takes over the entire viewport with its own background, toolbar at bottom, and close button that returns to the notes board
- Add a dark background (`bg-black/95`) when in full-screen mode so it feels like its own space
- Add a header: "DRAWING VOID" in the existing `font-mono uppercase tracking-[0.5em]` style
- Support zoom/pan within the canvas using the existing `useZoomPan` hook (or a separate instance)

**No database changes needed** — drawings already store in `board_drawings` with a `void_id` foreign key, which correctly scopes them.

### What stays the same
- Drawing data model and storage (unchanged)
- Realtime sync of drawings (unchanged)
- Toolbar design (pen, eraser, colors, stroke width, clear)
- Drawings still render as a read-only layer on the notes board when not in canvas mode

