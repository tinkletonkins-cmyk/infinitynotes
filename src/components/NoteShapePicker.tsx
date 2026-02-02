import React from 'react';
import { Square, Circle, Hexagon, CloudFog, Scissors, LucideIcon } from 'lucide-react';

export type NoteShape = 'square' | 'circle' | 'hexagon' | 'torn' | 'cloud';

interface NoteShapePickerProps {
  currentShape: NoteShape;
  onShapeSelect: (shape: NoteShape) => void;
}

const shapes: { shape: NoteShape; icon: LucideIcon; label: string }[] = [
  { shape: 'square', icon: Square, label: 'Square' },
  { shape: 'circle', icon: Circle, label: 'Circle' },
  { shape: 'hexagon', icon: Hexagon, label: 'Hexagon' },
  { shape: 'torn', icon: Scissors, label: 'Torn paper' },
  { shape: 'cloud', icon: CloudFog, label: 'Cloud' },
];

export function NoteShapePicker({ currentShape, onShapeSelect }: NoteShapePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const CurrentIcon = shapes.find(s => s.shape === currentShape)?.icon || Square;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:opacity-70 transition-opacity"
        title="Change note shape"
      >
        <CurrentIcon size={16} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 border border-foreground bg-background p-1 flex gap-1">
            {shapes.map(({ shape, icon: Icon, label }) => (
              <button
                key={shape}
                onClick={() => {
                  onShapeSelect(shape);
                  setIsOpen(false);
                }}
                className={`p-1.5 hover:bg-muted transition-colors ${
                  currentShape === shape ? 'bg-foreground text-background' : ''
                }`}
                title={label}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
