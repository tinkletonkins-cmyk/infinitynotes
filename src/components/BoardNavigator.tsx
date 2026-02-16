import { Home, ZoomIn, ZoomOut } from 'lucide-react';

interface BoardNavigatorProps {
  zoom: number;
  onRecenter: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function BoardNavigator({ zoom, onRecenter, onZoomIn, onZoomOut }: BoardNavigatorProps) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="flex items-center gap-1 p-1 bg-background/90 backdrop-blur-sm border border-foreground w-fit">
      <button
        onClick={onZoomOut}
        className="p-2 hover:bg-foreground hover:text-background transition-colors"
        title="Zoom out"
        disabled={zoom <= 0.25}
      >
        <ZoomOut size={14} />
      </button>
      
      <div className="px-2 min-w-[48px] text-center font-mono text-xs uppercase tracking-wide">
        {zoomPercent}%
      </div>
      
      <button
        onClick={onZoomIn}
        className="p-2 hover:bg-foreground hover:text-background transition-colors"
        title="Zoom in"
        disabled={zoom >= 3}
      >
        <ZoomIn size={14} />
      </button>
      
      <div className="w-px h-6 bg-foreground/30 mx-1" />
      
      <button
        onClick={onRecenter}
        className="p-2 hover:bg-foreground hover:text-background transition-colors"
        title="Recenter view (Home)"
      >
        <Home size={14} />
      </button>
    </div>
  );
}
