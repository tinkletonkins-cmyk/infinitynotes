import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Sparkles } from 'lucide-react';

interface VoidSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string | null;
  isLoading: boolean;
}

export function VoidSummaryModal({ isOpen, onClose, summary, isLoading }: VoidSummaryModalProps) {
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
            className="relative max-w-lg w-full mx-4 border-2 border-foreground bg-background p-8"
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
              <Sparkles size={20} />
              <h2 className="text-lg uppercase tracking-[0.3em] font-bold">
                Void Summary
              </h2>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm text-muted-foreground uppercase tracking-wider">
                  Reading the void...
                </p>
              </div>
            ) : summary ? (
              <div className="space-y-4">
                <p className="font-serif text-lg leading-relaxed italic opacity-90" style={{ fontFamily: "'Libre Baskerville', serif" }}>
                  "{summary}"
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest text-right">
                  — The Void Speaks
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No summary available
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
