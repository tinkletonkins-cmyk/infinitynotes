import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ScrollText } from 'lucide-react';

interface Release {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

const RELEASES: Release[] = [
  {
    version: 'v0.6.0',
    date: '2026-04-05',
    title: 'Cursors, Colors & Click-to-Create',
    changes: [
      'Live cursors now interpolate smoothly using spring physics — no more jumping',
      'Your own cursor now shows as a styled colored arrow (no name label for you, but others see yours)',
      'Notes now spawn with randomized colors from the color picker palette',
      'Click anywhere on the empty board to instantly create a note at that position',
      'System cursor hidden on the board — your styled cursor takes over completely',
    ],
  },
  {
    version: 'v0.5.0',
    date: '2026-04-05',
    title: 'Minimap & Zoom Controls',
    changes: [
      'Added minimap in the bottom-left corner — shows all notes as colored dots',
      'Click anywhere on the minimap to jump to that area of the board',
      'Zoom controls moved above the minimap for a cleaner layout',
      'Viewport indicator on minimap shows exactly what area you\'re looking at',
    ],
  },
  {
    version: 'v0.4.0',
    date: '2026-04-05',
    title: 'Live Typing & Private Voids',
    changes: [
      'See other users typing in real-time — text appears as an overlay on the note',
      'Blinking cursor shows at the end of remote text while someone is typing',
      'Private voids now save to localStorage — no account needed',
      'Void switcher dropdown opens upward over the ambient button',
      'Removed sign-up requirement — everything works for guests',
    ],
  },
  {
    version: 'v0.3.0',
    date: '2026-04-05',
    title: 'Board Polish & Tools',
    changes: [
      'Right-side tool buttons restored to original layout',
      'Theme picker expands inline, pushing buttons down to make space',
      'Trackpad two-finger pan now works (previously only Ctrl+scroll zoomed)',
      'N key shortcut to add a new note from anywhere on the board',
      'Loading state replaced with shimmer skeleton notes',
      'Footer no longer shows full email — displays username only',
      'Toast notification when note creation fails',
    ],
  },
  {
    version: 'v0.2.0',
    date: '2026-04-05',
    title: 'Bug Fixes & Performance',
    changes: [
      'Fixed channelRef never assigned in useRealtimeTyping — broadcasts were silently failing',
      'Fixed recentlyDraggedRef never cleaning up — notes were permanently blocking position sync',
      'Fixed addNote not awaiting DB insert before clearing pendingNoteIdsRef',
      'Fixed draft save timer firing after component unmount',
      'NotePositionsContext now batches re-renders via requestAnimationFrame — massive drag perf improvement',
      'removeConnectionsForNote now runs deletes in parallel instead of sequentially',
      'clearAllDrawings now runs deletes in parallel',
      'Error handling added to addNote, updateNote, deleteNote, removeConnection',
    ],
  },
  {
    version: 'v0.1.0',
    date: '2026-02-01',
    title: 'Initial Release',
    changes: [
      'Multiplayer sticky note board with real-time sync',
      'Emotion-based note colors using sentiment analysis',
      'Note connections with rubber-band line preview',
      'Drawing canvas overlay',
      'AI summary and connection suggestions',
      'Equipment Bay with board effects',
      'Board themes: Void, Cork, Wavy, Galaxy, Blueprint, Paper, Sunset',
      'Zoom, pan, and recenter controls',
      'Note history, tags, reactions, and chat',
    ],
  },
];

interface UpdateLogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpdateLog({ isOpen, onClose }: UpdateLogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-background/80"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg max-h-[75vh] border border-foreground bg-background flex flex-col mx-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-foreground/20">
              <div className="flex items-center gap-2">
                <ScrollText size={15} />
                <span className="text-sm font-mono uppercase tracking-widest">Updates</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-foreground hover:text-background transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
              {RELEASES.map(release => (
                <div key={release.version}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm font-mono font-bold">{release.version}</span>
                    <span className="text-[10px] font-mono text-foreground/40">{release.date}</span>
                  </div>
                  <p className="text-xs font-mono text-foreground/70 mb-2 uppercase tracking-wider">
                    {release.title}
                  </p>
                  <ul className="space-y-1">
                    {release.changes.map((change, i) => (
                      <li key={i} className="flex gap-2 text-[11px] font-mono text-foreground/60 leading-relaxed">
                        <span className="text-foreground/30 flex-shrink-0">—</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
