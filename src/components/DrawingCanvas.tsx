import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Pencil, Eraser, Trash2, X } from 'lucide-react';
import { useDrawings } from '@/hooks/useDrawings';

interface DrawingCanvasProps {
  isActive: boolean;
  onClose: () => void;
  voidId: string | null;
  fullScreen?: boolean;
}

const COLORS = ['#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
const STROKE_WIDTHS = [2, 4, 6, 8];

export function DrawingCanvas({ isActive, onClose, voidId, fullScreen = false }: DrawingCanvasProps) {
  const { drawings, addDrawing, clearAllDrawings } = useDrawings(voidId);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [color, setColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const svgRef = useRef<SVGSVGElement>(null);

  // Canvas pan state for full-screen mode
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  const isPanningRef = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const spaceRef = useRef(false);

  // Space key for panning in full-screen mode
  useEffect(() => {
    if (!fullScreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        spaceRef.current = true;
        document.body.style.cursor = 'grab';
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceRef.current = false;
        if (!isPanningRef.current) document.body.style.cursor = '';
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.body.style.cursor = '';
    };
  }, [fullScreen]);

  // Wheel zoom for full-screen mode
  useEffect(() => {
    if (!fullScreen) return;
    const onWheel = (e: WheelEvent) => {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setCanvasScale(prev => Math.max(0.25, Math.min(4, prev + delta)));
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [fullScreen]);

  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const svg = svgRef.current;
    if (!svg) return null;

    const rect = svg.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    if (fullScreen) {
      return {
        x: (clientX - rect.left - panOffset.x) / canvasScale,
        y: (clientY - rect.top - panOffset.y) / canvasScale,
      };
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, [fullScreen, panOffset, canvasScale]);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isActive) return;

    // Pan with space+click or middle mouse in full-screen
    if (fullScreen && 'button' in e) {
      if (spaceRef.current && e.button === 0) {
        e.preventDefault();
        isPanningRef.current = true;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = 'grabbing';
        return;
      }
      if (e.button === 1) {
        e.preventDefault();
        isPanningRef.current = true;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = 'grabbing';
        return;
      }
    }

    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    setCurrentPath(`M ${coords.x} ${coords.y}`);
  }, [isActive, getCoordinates, fullScreen]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isActive) return;

    // Panning
    if (isPanningRef.current && 'clientX' in e) {
      const dx = e.clientX - lastPanPos.current.x;
      const dy = e.clientY - lastPanPos.current.y;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      return;
    }

    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    setCurrentPath(prev => `${prev} L ${coords.x} ${coords.y}`);
  }, [isDrawing, isActive, getCoordinates]);

  const handleEnd = useCallback(async () => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      document.body.style.cursor = spaceRef.current ? 'grab' : '';
      return;
    }

    if (!isDrawing || !currentPath) return;

    setIsDrawing(false);
    
    if (currentPath.includes('L')) {
      await addDrawing(currentPath, tool === 'eraser' ? 'transparent' : color, strokeWidth);
    }
    
    setCurrentPath('');
  }, [isDrawing, currentPath, addDrawing, color, strokeWidth, tool]);

  // Handle mouse leave
  useEffect(() => {
    const handleMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        document.body.style.cursor = spaceRef.current ? 'grab' : '';
      }
      if (isDrawing) {
        handleEnd();
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDrawing, handleEnd]);

  // Read-only inline mode: show drawings as overlay on notes board
  if (!isActive && !fullScreen) {
    return (
      <svg
        className="fixed inset-0 pointer-events-none z-10"
        style={{ width: '100vw', height: '100vh' }}
      >
        {drawings.map(drawing => (
          <path
            key={drawing.id}
            d={drawing.path_data}
            stroke={drawing.color}
            strokeWidth={drawing.stroke_width}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    );
  }

  // Not active and not full-screen — render nothing
  if (!isActive) return null;

  // Full-screen Drawing Void mode
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/20">
          <div />
          <h2 className="font-mono text-sm uppercase tracking-[0.5em] text-foreground/70">
            Drawing Void
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-colors"
            title="Exit Drawing Void"
          >
            <X size={20} />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden relative">
          <svg
            ref={svgRef}
            className="absolute inset-0 cursor-crosshair"
            style={{ width: '100%', height: '100%' }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          >
            <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${canvasScale})`}>
              {/* Existing drawings */}
              {drawings.map(drawing => (
                <path
                  key={drawing.id}
                  d={drawing.path_data}
                  stroke={drawing.color}
                  strokeWidth={drawing.stroke_width}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              
              {/* Current drawing */}
              {currentPath && (
                <path
                  d={currentPath}
                  stroke={tool === 'eraser' ? 'rgba(255,255,255,0.3)' : color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={tool === 'eraser' ? '5,5' : undefined}
                />
              )}
            </g>
          </svg>
        </div>

        {/* Toolbar */}
        <DrawingToolbar
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
          onClear={clearAllDrawings}
        />
      </div>
    );
  }

  // Legacy overlay mode (kept for compatibility but no longer used by default)
  return (
    <>
      <svg
        ref={svgRef}
        className="fixed inset-0 z-[60] cursor-crosshair"
        style={{ width: '100vw', height: '100vh' }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        {drawings.map(drawing => (
          <path
            key={drawing.id}
            d={drawing.path_data}
            stroke={drawing.color}
            strokeWidth={drawing.stroke_width}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        
        {currentPath && (
          <path
            d={currentPath}
            stroke={tool === 'eraser' ? 'rgba(0,0,0,0.5)' : color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={tool === 'eraser' ? '5,5' : undefined}
          />
        )}
      </svg>

      <DrawingToolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        onClear={clearAllDrawings}
      />
    </>
  );
}

// Extracted toolbar component
function DrawingToolbar({
  tool,
  setTool,
  color,
  setColor,
  strokeWidth,
  setStrokeWidth,
  onClear,
}: {
  tool: 'pen' | 'eraser';
  setTool: (t: 'pen' | 'eraser') => void;
  color: string;
  setColor: (c: string) => void;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 p-3 border-t border-foreground/20 bg-background/80 backdrop-blur-sm">
      {/* Tool selection */}
      <button
        onClick={() => setTool('pen')}
        className={`p-2 transition-colors ${tool === 'pen' ? 'bg-foreground text-background' : 'hover:bg-foreground/20'}`}
        title="Pen"
      >
        <Pencil size={18} />
      </button>
      <button
        onClick={() => setTool('eraser')}
        className={`p-2 transition-colors ${tool === 'eraser' ? 'bg-foreground text-background' : 'hover:bg-foreground/20'}`}
        title="Eraser"
      >
        <Eraser size={18} />
      </button>

      <div className="w-px h-8 bg-foreground/30" />

      {/* Colors */}
      <div className="flex gap-1">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => { setColor(c); setTool('pen'); }}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c && tool === 'pen' ? 'scale-125 border-foreground' : 'border-transparent hover:scale-110'}`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>

      <div className="w-px h-8 bg-foreground/30" />

      {/* Stroke width */}
      <div className="flex gap-1 items-center">
        {STROKE_WIDTHS.map(sw => (
          <button
            key={sw}
            onClick={() => setStrokeWidth(sw)}
            className={`p-1 transition-colors ${strokeWidth === sw ? 'bg-foreground text-background' : 'hover:bg-foreground/20'}`}
            title={`${sw}px`}
          >
            <div 
              className="rounded-full bg-current" 
              style={{ width: sw * 2, height: sw * 2 }}
            />
          </button>
        ))}
      </div>

      <div className="w-px h-8 bg-foreground/30" />

      {/* Clear all */}
      <button
        onClick={onClear}
        className="p-2 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
        title="Clear all drawings"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
