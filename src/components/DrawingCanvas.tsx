import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Pencil, Eraser, Trash2, X } from 'lucide-react';
import { useDrawings } from '@/hooks/useDrawings';

interface DrawingCanvasProps {
  isActive: boolean;
  onClose: () => void;
  voidId: string | null;
}

const COLORS = ['#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
const STROKE_WIDTHS = [2, 4, 6, 8];

export function DrawingCanvas({ isActive, onClose, voidId }: DrawingCanvasProps) {
  const { drawings, addDrawing, clearAllDrawings } = useDrawings(voidId);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [color, setColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const svgRef = useRef<SVGSVGElement>(null);

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

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isActive) return;
    e.preventDefault();
    
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    setCurrentPath(`M ${coords.x} ${coords.y}`);
  }, [isActive, getCoordinates]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isActive) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    setCurrentPath(prev => `${prev} L ${coords.x} ${coords.y}`);
  }, [isDrawing, isActive, getCoordinates]);

  const handleEnd = useCallback(async () => {
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

  if (!isActive) {
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

  return (
    <>
      {/* Drawing overlay */}
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
            stroke={tool === 'eraser' ? 'rgba(0,0,0,0.5)' : color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={tool === 'eraser' ? '5,5' : undefined}
          />
        )}
      </svg>

      {/* Drawing toolbar */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 p-3 bg-background border border-foreground shadow-lg">
        {/* Close button */}
        <button
          onClick={onClose}
          className="p-2 hover:bg-foreground hover:text-background transition-colors"
          title="Exit drawing mode"
        >
          <X size={18} />
        </button>

        <div className="w-px h-8 bg-foreground/30" />

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
          onClick={clearAllDrawings}
          className="p-2 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
          title="Clear all drawings"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </>
  );
}
