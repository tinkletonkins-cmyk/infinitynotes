import { Home, ZoomIn, ZoomOut, Map } from 'lucide-react';

interface BoardNavigatorProps {
  zoom: number;
  onRecenter: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onOpenNavigator?: () => void;
}

export function BoardNavigator({ zoom, onRecenter, onZoomIn, onZoomOut, onOpenNavigator }: BoardNavigatorProps) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="flex flex-col items-center gap-1 p-1 bg-background/90 backdrop-blur-sm border border-foreground w-fit">
      <button
        onClick={onZoomIn}
        className="p-2 hover:bg-foreground hover:text-background transition-colors"
        title="Zoom in"
        disabled={zoom >= 3}
      >
        <ZoomIn size={14} />
      </button>
      
      <div className="py-1 min-w-[36px] text-center font-mono text-xs uppercase tracking-wide">
        {zoomPercent}%
      </div>
      
      <button
        onClick={onZoomOut}
        className="p-2 hover:bg-foreground hover:text-background transition-colors"
        title="Zoom out"
        disabled={zoom <= 0.25}
      >
        <ZoomOut size={14} />
      </button>
      
      <div className="h-px w-6 bg-foreground/30 my-1" />
      
      <button
        onClick={onRecenter}
        className="p-2 hover:bg-foreground hover:text-background transition-colors"
        title="Recenter view (Home)"
      >
        <Home size={14} />
      </button>

      {onOpenNavigator && (
        <>
          <div className="h-px w-6 bg-foreground/30 my-1" />
          <button
            onClick={onOpenNavigator}
            className="p-2 hover:bg-foreground hover:text-background transition-colors"
            title="Multiverse Navigator"
          >
            <Map size={14} />
          </button>
        </>
      )}
    </div>
  );
}
