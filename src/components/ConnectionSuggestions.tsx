import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Zap, Check } from 'lucide-react';
import { Note } from '@/hooks/useNotes';

interface ConnectionSuggestion {
  from: string;
  to: string;
  reason: string;
}

interface ConnectionSuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: ConnectionSuggestion[];
  isLoading: boolean;
  notes: Note[];
  onAccept: (fromId: string, toId: string) => void;
}

export function ConnectionSuggestions({ 
  isOpen, 
  onClose, 
  suggestions, 
  isLoading, 
  notes,
  onAccept 
}: ConnectionSuggestionsProps) {
  const getNotePreview = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return "Unknown note";
    return note.text.slice(0, 40) + (note.text.length > 40 ? "..." : "");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-lg w-full mx-4 border-2 border-foreground bg-background p-6"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-foreground hover:text-background transition-colors"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <Zap size={20} />
              <h2 className="text-lg uppercase tracking-[0.3em] font-bold">
                AI Suggestions
              </h2>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm text-muted-foreground uppercase tracking-wider">
                  Analyzing connections...
                </p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={`${suggestion.from}-${suggestion.to}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-muted p-3 hover:border-foreground transition-colors"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                          <span className="truncate">{getNotePreview(suggestion.from)}</span>
                          <span>↔</span>
                          <span className="truncate">{getNotePreview(suggestion.to)}</span>
                        </div>
                        <p className="text-sm italic opacity-80">
                          "{suggestion.reason}"
                        </p>
                      </div>
                      <button
                        onClick={() => onAccept(suggestion.from, suggestion.to)}
                        className="shrink-0 p-2 border border-foreground hover:bg-foreground hover:text-background transition-colors"
                        title="Accept connection"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No suggestions available. Try adding more notes!
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
