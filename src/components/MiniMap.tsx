import React, { useRef, useEffect } from 'react';
import { Note } from '@/hooks/useNotes';

interface MiniMapProps {
  notes: Note[];
  panX: number;
  panY: number;
  scale: number;
  onPanTo: (x: number, y: number) => void;
}

const MAP_W = 160;
const MAP_H = 100;
const PADDING = 40;

export function MiniMap({ notes, panX, panY, scale, onPanTo }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, MAP_W, MAP_H);
    // Background always
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, MAP_W, MAP_H);

    if (notes.length === 0) return;

    // Find bounding box of all notes
    const xs = notes.map(n => n.position.x);
    const ys = notes.map(n => n.position.y);
    const minX = Math.min(...xs) - PADDING;
    const maxX = Math.max(...xs) + 210 + PADDING;
    const minY = Math.min(...ys) - PADDING;
    const maxY = Math.max(...ys) + 160 + PADDING;
    const bw = maxX - minX || 1;
    const bh = maxY - minY || 1;

    // Scale to fit map
    const scaleX = MAP_W / bw;
    const scaleY = MAP_H / bh;
    const s = Math.min(scaleX, scaleY);

    const toMapX = (x: number) => (x - minX) * s + (MAP_W - bw * s) / 2;
    const toMapY = (y: number) => (y - minY) * s + (MAP_H - bh * s) / 2;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, MAP_W, MAP_H);

    // Draw notes as colored dots
    for (const note of notes) {
      const nx = toMapX(note.position.x);
      const ny = toMapY(note.position.y);
      const nw = 210 * s;
      const nh = 160 * s;
      ctx.fillStyle = note.color || 'rgba(255,255,255,0.6)';
      ctx.fillRect(nx, ny, Math.max(nw, 3), Math.max(nh, 3));
    }

    // Draw viewport indicator
    // Viewport in board coords: top-left is (-panX/scale, -panY/scale)
    const vx = toMapX(-panX / scale);
    const vy = toMapY(-panY / scale);
    const vw = (window.innerWidth / scale) * s;
    const vh = (window.innerHeight / scale) * s;

    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.strokeRect(vx, vy, vw, vh);
  }, [notes, panX, panY, scale]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || notes.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (MAP_W / rect.width);
    const my = (e.clientY - rect.top) * (MAP_H / rect.height);

    const xs = notes.map(n => n.position.x);
    const ys = notes.map(n => n.position.y);
    const minX = Math.min(...xs) - PADDING;
    const maxX = Math.max(...xs) + 210 + PADDING;
    const minY = Math.min(...ys) - PADDING;
    const maxY = Math.max(...ys) + 160 + PADDING;
    const bw = maxX - minX || 1;
    const bh = maxY - minY || 1;
    const s = Math.min(MAP_W / bw, MAP_H / bh);

    const boardX = (mx - (MAP_W - bw * s) / 2) / s + minX;
    const boardY = (my - (MAP_H - bh * s) / 2) / s + minY;
    onPanTo(boardX, boardY);
  };

  return (
    <canvas
      ref={canvasRef}
      width={MAP_W}
      height={MAP_H}
      onClick={handleClick}
      className="cursor-crosshair block"
      style={{
        width: MAP_W,
        height: MAP_H,
        border: '1px solid rgba(255,255,255,0.4)',
        background: '#111',
      }}
      title="Click to navigate"
    />
  );
}
