import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Layers3, Move, MousePointer2, Plus, X } from 'lucide-react';

interface WelcomeIntroProps {
  visible: boolean;
  onDismiss: () => void;
}

export function WelcomeIntro({ visible, onDismiss }: WelcomeIntroProps) {
  const handleDismiss = () => {
    onDismiss();
  };

  const steps = [
    { icon: Plus, label: 'Create', text: 'Click the + button or press N to add a sticky note.' },
    { icon: Move, label: 'Drag', text: 'Grab a note by its top bar and move it anywhere on the board.' },
    { icon: MousePointer2, label: 'Select', text: 'Press Select, then drag a box around multiple notes.' },
    { icon: Layers3, label: 'Stack', text: 'Use Stack from the selection popup to layer notes like paper.' },
    { icon: Link2, label: 'Wire', text: 'Press Wire, then click two notes to connect them.' },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative w-full max-w-3xl border border-foreground bg-background p-6 shadow-[8px_8px_0_0_hsl(var(--foreground)/0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleDismiss}
              className="absolute right-3 top-3 p-2 opacity-70 transition-opacity hover:opacity-100"
              title="Close tutorial"
            >
              <X size={18} />
            </button>

            <div className="mb-6 pr-10">
              <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground font-mono">Quick tutorial</p>
              <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-wider leading-tight text-foreground">
                How to use the board
              </h2>
            </div>

            <div className="grid gap-3 md:grid-cols-5">
              {steps.map(({ icon: Icon, label, text }) => (
                <div key={label} className="border border-foreground/40 bg-muted/40 p-3 min-h-[150px]">
                  <Icon size={22} className="mb-3" />
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-widest font-mono">{label}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-foreground/30 pt-5 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">Tip: Shift + drag also works for selecting notes, even when Select mode is off.</p>
              <button
                onClick={handleDismiss}
                className="border border-foreground bg-foreground px-5 py-2 text-sm font-bold uppercase tracking-widest text-background transition-opacity hover:opacity-80"
              >
                Start
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
