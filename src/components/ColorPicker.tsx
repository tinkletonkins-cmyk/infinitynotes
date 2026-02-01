import { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  currentColor: string | null;
  onColorSelect: (color: string | null) => void;
}

const PRESET_COLORS = [
  null, // Reset to sentiment-based
  '#FFEB3B', // Yellow
  '#FF5722', // Red/Orange
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#E91E63', // Pink
  '#00BCD4', // Cyan
  '#FFFFFF', // White
  '#607D8B', // Gray
];

export function ColorPicker({ currentColor, onColorSelect }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={pickerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:opacity-70 transition-opacity opacity-70"
        title="Change color"
      >
        <Palette size={16} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 p-2 bg-background border border-foreground z-50 grid grid-cols-4 gap-1 min-w-[120px]">
          {PRESET_COLORS.map((color, i) => (
            <button
              key={i}
              onClick={() => {
                onColorSelect(color);
                setIsOpen(false);
              }}
              className={`w-6 h-6 border border-foreground transition-transform hover:scale-110 ${
                currentColor === color ? 'ring-2 ring-foreground ring-offset-1' : ''
              }`}
              style={{ 
                backgroundColor: color || 'transparent',
                backgroundImage: color === null 
                  ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                  : undefined,
                backgroundSize: color === null ? '8px 8px' : undefined,
                backgroundPosition: color === null ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
              }}
              title={color === null ? 'Auto (sentiment-based)' : color}
            />
          ))}
        </div>
      )}
    </div>
  );
}
