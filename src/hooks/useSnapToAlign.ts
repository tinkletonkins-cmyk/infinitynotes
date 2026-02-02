import { useCallback } from 'react';

const SNAP_THRESHOLD = 15; // pixels
const NOTE_WIDTH = 256;
const NOTE_HEIGHT = 200;

interface Position {
  x: number;
  y: number;
}

interface SnapResult {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
}

export function useSnapToAlign(allPositions: Map<string, Position>, currentId: string) {
  const snapPosition = useCallback((currentPos: Position): SnapResult => {
    let finalX = currentPos.x;
    let finalY = currentPos.y;
    let snappedX = false;
    let snappedY = false;

    // Check all other notes for alignment
    allPositions.forEach((otherPos, otherId) => {
      if (otherId === currentId) return;

      // Left edge alignment
      if (Math.abs(currentPos.x - otherPos.x) < SNAP_THRESHOLD) {
        finalX = otherPos.x;
        snappedX = true;
      }
      // Right edge alignment (left of current to right of other)
      if (Math.abs(currentPos.x - (otherPos.x + NOTE_WIDTH)) < SNAP_THRESHOLD) {
        finalX = otherPos.x + NOTE_WIDTH;
        snappedX = true;
      }
      // Right edge to left edge
      if (Math.abs((currentPos.x + NOTE_WIDTH) - otherPos.x) < SNAP_THRESHOLD) {
        finalX = otherPos.x - NOTE_WIDTH;
        snappedX = true;
      }
      // Right edges aligned
      if (Math.abs((currentPos.x + NOTE_WIDTH) - (otherPos.x + NOTE_WIDTH)) < SNAP_THRESHOLD) {
        finalX = otherPos.x;
        snappedX = true;
      }
      // Center X alignment
      if (Math.abs((currentPos.x + NOTE_WIDTH / 2) - (otherPos.x + NOTE_WIDTH / 2)) < SNAP_THRESHOLD) {
        finalX = otherPos.x;
        snappedX = true;
      }

      // Top edge alignment
      if (Math.abs(currentPos.y - otherPos.y) < SNAP_THRESHOLD) {
        finalY = otherPos.y;
        snappedY = true;
      }
      // Bottom edge to top edge
      if (Math.abs((currentPos.y + NOTE_HEIGHT) - otherPos.y) < SNAP_THRESHOLD) {
        finalY = otherPos.y - NOTE_HEIGHT;
        snappedY = true;
      }
      // Top edge to bottom edge
      if (Math.abs(currentPos.y - (otherPos.y + NOTE_HEIGHT)) < SNAP_THRESHOLD) {
        finalY = otherPos.y + NOTE_HEIGHT;
        snappedY = true;
      }
      // Bottom edges aligned
      if (Math.abs((currentPos.y + NOTE_HEIGHT) - (otherPos.y + NOTE_HEIGHT)) < SNAP_THRESHOLD) {
        finalY = otherPos.y;
        snappedY = true;
      }
      // Center Y alignment
      if (Math.abs((currentPos.y + NOTE_HEIGHT / 2) - (otherPos.y + NOTE_HEIGHT / 2)) < SNAP_THRESHOLD) {
        finalY = otherPos.y;
        snappedY = true;
      }
    });

    return { x: finalX, y: finalY, snappedX, snappedY };
  }, [allPositions, currentId]);

  return { snapPosition };
}
