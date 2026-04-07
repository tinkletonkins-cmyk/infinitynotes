import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Copy, Check } from 'lucide-react';

interface CreateVoidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<{ id: string; invite_code: string | null } | null>;
}

export function CreateVoidModal({ isOpen, onClose, onSubmit }: CreateVoidModalProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdVoid, setCreatedVoid] = useState<{ id: string; invite_code: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    setError('');
    
    const result = await onSubmit(name.trim());
    
    if (result) {
      setCreatedVoid(result);
    } else {
      setError('Failed to create void. Sign in to create multiplayer voids.');
    }
    
    setIsSubmitting(false);
  };

  const handleCopyCode = () => {
    if (createdVoid?.invite_code) {
      navigator.clipboard.writeText(createdVoid.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setName('');
    setCreatedVoid(null);
    setError('');
    setCopied(false);
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
          onClick={handleClose}
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
                {createdVoid ? 'Void Created!' : 'Create Multiplayer Void'}
              </h2>
              <button onClick={handleClose} className="p-1 hover:bg-muted">
                <X size={20} />
              </button>
            </div>

            {createdVoid ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your multiplayer void is ready. Share this code with others to invite them:
                </p>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-4 border border-foreground bg-muted text-center">
                    <span className="text-3xl font-mono tracking-[0.5em] font-bold">
                      {createdVoid.invite_code}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-4 border border-foreground hover:bg-foreground hover:text-background transition-colors"
                    title="Copy code"
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
                
                <button
                  onClick={handleClose}
                  className="w-full p-3 border-2 border-foreground bg-foreground text-background font-mono uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors"
                >
                  Enter Void
                </button>
              </div>
            ) : (
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
                  {error && (
                    <p className="mt-2 text-sm text-destructive">{error}</p>
                  )}
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
            )}

            {!createdVoid && (
              <p className="mt-4 text-xs text-muted-foreground text-center">
                You'll get a 5-digit code to share with others
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
