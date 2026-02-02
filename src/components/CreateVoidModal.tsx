import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface CreateVoidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export function CreateVoidModal({ isOpen, onClose, onSubmit }: CreateVoidModalProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    await onSubmit(name.trim());
    setIsSubmitting(false);
    setName('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/90 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md p-8 border-2 border-foreground bg-background"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold uppercase tracking-widest">
                Create Your Void
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-muted">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider mb-2">
                  Void Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="My Secret Void"
                  className="w-full p-3 border border-foreground bg-background text-foreground font-mono placeholder:text-muted-foreground"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="w-full p-3 border-2 border-foreground bg-foreground text-background font-mono uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Create Void'
                )}
              </button>
            </form>

            <p className="mt-4 text-xs text-muted-foreground text-center">
              You'll get an invite link to share with others
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
