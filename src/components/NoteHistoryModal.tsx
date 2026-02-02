import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ArrowRight } from 'lucide-react';
import { HistoryEntry } from '@/hooks/useNoteHistory';
import { formatDistanceToNow } from 'date-fns';

interface NoteHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  isLoading: boolean;
  currentText: string;
  onRestore: (entry: HistoryEntry) => void;
}

export function NoteHistoryModal({ 
  isOpen, 
  onClose, 
  history, 
  isLoading, 
  currentText,
  onRestore 
}: NoteHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[80vh] bg-background border border-foreground z-[201] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-foreground">
              <div className="flex items-center gap-2">
                <Clock size={18} />
                <h2 className="text-lg font-bold uppercase tracking-wider">Note History</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-foreground hover:text-background transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm uppercase tracking-wider">No history yet</p>
                  <p className="text-xs opacity-70 mt-1">Changes will appear here as you edit</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Current version */}
                  <div className="p-3 border border-foreground bg-foreground/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">Current</span>
                    </div>
                    <p className="text-sm font-handwriting" style={{ fontFamily: "'Caveat', cursive" }}>
                      {currentText || '(empty)'}
                    </p>
                  </div>

                  {/* History entries */}
                  {history.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 border border-foreground/50 hover:border-foreground transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
                        </span>
                        <button
                          onClick={() => onRestore(entry)}
                          className="flex items-center gap-1 px-2 py-1 text-xs uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity hover:bg-foreground hover:text-background"
                        >
                          Restore <ArrowRight size={12} />
                        </button>
                      </div>
                      <p className="text-sm font-handwriting opacity-70" style={{ fontFamily: "'Caveat', cursive" }}>
                        {entry.text || '(empty)'}
                      </p>
                      {(entry.color || entry.shape) && (
                        <div className="flex items-center gap-2 mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {entry.color && (
                            <span className="flex items-center gap-1">
                              <span 
                                className="w-3 h-3 rounded-full border border-foreground/30" 
                                style={{ backgroundColor: entry.color }}
                              />
                              color
                            </span>
                          )}
                          {entry.shape && <span>shape: {entry.shape}</span>}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}