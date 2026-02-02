import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SyncIndicatorProps {
  isSyncing: boolean;
  lastSyncTime: number;
}

export function SyncIndicator({ isSyncing, lastSyncTime }: SyncIndicatorProps) {
  const [showPulse, setShowPulse] = useState(false);

  // Pulse effect when sync happens
  useEffect(() => {
    if (lastSyncTime > 0) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 300);
      return () => clearTimeout(timer);
    }
  }, [lastSyncTime]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      {/* Sync status dot */}
      <div className="relative">
        {/* Base dot */}
        <div 
          className={`w-2 h-2 rounded-full transition-colors duration-200 ${
            isSyncing ? 'bg-yellow-400' : 'bg-emerald-400'
          }`}
        />
        
        {/* Pulse ring */}
        <AnimatePresence>
          {showPulse && (
            <motion.div
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400"
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Syncing text (only shows when actively syncing) */}
      <AnimatePresence>
        {isSyncing && (
          <motion.span
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ duration: 0.15 }}
            className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono"
          >
            Syncing...
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
