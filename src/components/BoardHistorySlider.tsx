import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, Copy, Play, Pause } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { NoteShape } from './NoteShapePicker';

interface HistoricalNote {
  id: string;
  text: string;
  position: { x: number; y: number };
  rotation: number;
  color: string | null;
  shape: NoteShape;
}

interface BoardHistorySliderProps {
  voidId: string | null;
  currentNotes: Array<{ id: string; text: string }>;
  onCopyNote: (text: string) => void;
  forceOpen?: boolean;
}

export function BoardHistorySlider({ voidId, currentNotes, onCopyNote, forceOpen }: BoardHistorySliderProps) {
  const [isOpen, setIsOpen] = useState(forceOpen ?? false);
  const [timeOffset, setTimeOffset] = useState(0); // Minutes ago (0 = now)
  const [historicalNotes, setHistoricalNotes] = useState<HistoricalNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Allow external control (echo_archive equipment)
  useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen]);
  const maxMinutes = 60;

  // Format time offset for display
  const formatTimeAgo = (minutes: number) => {
    if (minutes === 0) return 'Live';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  // Fetch historical state when time offset changes
  useEffect(() => {
    if (!isOpen || timeOffset === 0) {
      setHistoricalNotes([]);
      return;
    }

    const fetchHistoricalState = async () => {
      setIsLoading(true);
      const targetTime = new Date(Date.now() - timeOffset * 60 * 1000).toISOString();

      // Get the most recent history entry for each note before the target time
      const { data: historyData, error } = await supabase
        .from('note_history')
        .select('*')
        .lte('changed_at', targetTime)
        .order('changed_at', { ascending: false });

      if (!error && historyData) {
        // Group by note_id and take the most recent for each
        const noteMap = new Map<string, HistoricalNote>();
        
        for (const entry of historyData) {
          if (!noteMap.has(entry.note_id)) {
            noteMap.set(entry.note_id, {
              id: entry.note_id,
              text: entry.text,
              position: { x: 100, y: 100 }, // We don't track position in history
              rotation: 0,
              color: entry.color,
              shape: (entry.shape as NoteShape) || 'square',
            });
          }
        }

        setHistoricalNotes(Array.from(noteMap.values()));
      }
      setIsLoading(false);
    };

    fetchHistoricalState();
  }, [isOpen, timeOffset, voidId]);

  // Auto-play through history
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimeOffset(prev => {
        if (prev <= 0) {
          setIsPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Find deleted notes (in history but not in current)
  const deletedNotes = useMemo(() => {
    const currentIds = new Set(currentNotes.map(n => n.id));
    return historicalNotes.filter(n => !currentIds.has(n.id));
  }, [historicalNotes, currentNotes]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    onCopyNote(text);
  }, [onCopyNote]);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-28 right-4 z-50 flex items-center gap-2 px-3 py-2 border border-foreground transition-colors ${isOpen ? 'bg-foreground text-background' : 'bg-background hover:bg-foreground hover:text-background'}`}
        title="View board history"
      >
        <Clock size={14} />
        <span className="text-xs uppercase tracking-widest font-mono">History</span>
      </button>

      {/* History panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-40 right-4 z-50 w-80 bg-background border border-foreground p-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <h3 className="text-sm font-bold uppercase tracking-wider">Time Travel</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-foreground hover:text-background transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Time display */}
            <div className="text-center mb-4">
              <span className="text-2xl font-mono font-bold">
                {formatTimeAgo(timeOffset)}
              </span>
            </div>

            {/* Slider */}
            <div className="mb-4">
              <Slider
                value={[maxMinutes - timeOffset]}
                onValueChange={([val]) => setTimeOffset(maxMinutes - val)}
                max={maxMinutes}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>60m ago</span>
                <span>Now</span>
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1 px-3 py-1 border border-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                <span className="text-xs uppercase">{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                onClick={() => setTimeOffset(0)}
                className="px-3 py-1 border border-foreground hover:bg-foreground hover:text-background transition-colors text-xs uppercase"
              >
                Live
              </button>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Deleted notes recovery */}
            {!isLoading && timeOffset > 0 && (
              <div className="border-t border-foreground pt-3">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  {deletedNotes.length > 0 ? 'Deleted Notes (click to copy)' : 'No deleted notes found'}
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {deletedNotes.map(note => (
                    <button
                      key={note.id}
                      onClick={() => handleCopy(note.text)}
                      className="w-full text-left p-2 border border-foreground/30 hover:border-foreground transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-handwriting line-clamp-2" style={{ fontFamily: "'Caveat', cursive" }}>
                          {note.text || '(empty note)'}
                        </p>
                        <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>

                {/* All historical notes */}
                {historicalNotes.length > deletedNotes.length && (
                  <>
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground mt-3 mb-2">
                      All Notes at {formatTimeAgo(timeOffset)}
                    </h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {historicalNotes.filter(n => !deletedNotes.includes(n)).map(note => (
                        <button
                          key={note.id}
                          onClick={() => handleCopy(note.text)}
                          className="w-full text-left p-2 border border-foreground/20 hover:border-foreground/50 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs opacity-70 line-clamp-1" style={{ fontFamily: "'Caveat', cursive" }}>
                              {note.text || '(empty)'}
                            </p>
                            <Copy size={10} className="opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Live mode message */}
            {!isLoading && timeOffset === 0 && (
              <p className="text-center text-xs text-muted-foreground">
                Drag the slider to view past board states
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
