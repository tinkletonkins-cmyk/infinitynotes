import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeIntroProps {
  visible: boolean;
  onDismiss: () => void;
}

export function WelcomeIntro({ visible, onDismiss }: WelcomeIntroProps) {
  const handleDismiss = () => {
    onDismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center px-8 max-w-2xl cursor-pointer"
          >
            <h1 
              className="text-4xl md:text-5xl mb-8 text-foreground leading-relaxed"
              style={{ fontFamily: "'Libre Baskerville', serif" }}
            >
              Welcome to the void!
            </h1>
            <p 
              className="text-xl md:text-2xl text-foreground/80 leading-relaxed mb-12"
              style={{ fontFamily: "'Libre Baskerville', serif" }}
            >
              Feel free to type in what you feel like!
              <br />
              There are no rules in the void.
            </p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="text-sm text-muted-foreground uppercase tracking-widest font-mono"
            >
              Click anywhere to enter
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
