import { useState, useCallback, useRef, useEffect } from 'react';

interface ZoomPanState {
  scale: number;
  x: number;
  y: number;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.15;

export function useZoomPan() {
  const [state, setState] = useState<ZoomPanState>({ scale: 1, x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const spacePressed = useRef(false);
  const middleMouseDown = useRef(false);

  const handleWheel = useCallback((e: WheelEvent) => {
    // Cmd/Ctrl + Scroll to zoom
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      
      setState((prev) => {
        const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.scale + delta));
        
        // Zoom toward cursor position
        const rect = (e.target as HTMLElement).getBoundingClientRect?.();
        if (rect) {
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          const scaleRatio = newScale / prev.scale;
          const newX = mouseX - (mouseX - prev.x) * scaleRatio;
          const newY = mouseY - (mouseY - prev.y) * scaleRatio;
          
          return { scale: newScale, x: newX, y: newY };
        }
        
        return { ...prev, scale: newScale };
      });
    }
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Middle mouse button or Space + Left click
    if (e.button === 1 || (spacePressed.current && e.button === 0)) {
      e.preventDefault();
      isPanning.current = true;
      middleMouseDown.current = e.button === 1;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      document.body.style.cursor = 'grabbing';
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current) return;
    
    const deltaX = e.clientX - lastMouse.current.x;
    const deltaY = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    
    setState((prev) => ({
      ...prev,
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (isPanning.current && (e.button === 1 || (e.button === 0 && !middleMouseDown.current))) {
      isPanning.current = false;
      middleMouseDown.current = false;
      document.body.style.cursor = '';
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !e.repeat) {
      spacePressed.current = true;
      document.body.style.cursor = 'grab';
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      spacePressed.current = false;
      if (!isPanning.current) {
        document.body.style.cursor = '';
      }
    }
  }, []);

  const zoomIn = useCallback(() => {
    setState((prev) => ({
      ...prev,
      scale: Math.min(MAX_ZOOM, prev.scale + ZOOM_STEP),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setState((prev) => ({
      ...prev,
      scale: Math.max(MIN_ZOOM, prev.scale - ZOOM_STEP),
    }));
  }, []);

  const recenter = useCallback(() => {
    setState({ scale: 1, x: 0, y: 0 });
  }, []);

  // Register event listeners
  useEffect(() => {
    const options = { passive: false };
    
    window.addEventListener('wheel', handleWheel, options);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown, handleKeyUp]);

  return {
    scale: state.scale,
    x: state.x,
    y: state.y,
    zoomIn,
    zoomOut,
    recenter,
    isPanning: isPanning.current,
  };
}
