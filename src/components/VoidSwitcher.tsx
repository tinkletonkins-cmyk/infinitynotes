import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Lock, Copy, Trash2, LogIn, LogOut, Users } from 'lucide-react';
import { Void } from '@/hooks/useVoids';
import { useToast } from '@/hooks/use-toast';

interface VoidSwitcherProps {
  currentVoidId: string | null;
  voids: Void[];
  user: { id: string; email?: string } | null;
  onSwitchVoid: (voidId: string | null) => void;
  onCreateVoid: () => void;
  onDeleteVoid: (id: string) => void;
  onJoinVoid: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function VoidSwitcher({
  currentVoidId,
  voids,
  user,
  onSwitchVoid,
  onCreateVoid,
  onDeleteVoid,
  onJoinVoid,
  onSignIn,
  onSignOut,
}: VoidSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const currentVoid = currentVoidId ? voids.find(v => v.id === currentVoidId) : null;
  const currentName = currentVoid?.name || 'Select Void';

  const copyInviteCode = (inviteCode: string) => {
    navigator.clipboard.writeText(inviteCode);
    toast({
      title: 'Invite code copied!',
      description: `Share "${inviteCode}" with friends to invite them.`,
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-foreground bg-background hover:bg-muted transition-colors"
      >
        <Lock size={14} />
        <span className="text-sm font-mono uppercase tracking-wider max-w-32 truncate">
          {currentName}
        </span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 w-72 border border-foreground bg-background z-50 shadow-lg"
            >
              {/* User's private voids */}
              {user && voids.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider">
                    Your Voids
                  </div>
                  {voids.map(void_ => (
                    <div
                      key={void_.id}
                      className={`flex items-center gap-2 px-4 py-3 hover:bg-muted transition-colors ${
                        currentVoidId === void_.id ? 'bg-muted' : ''
                      }`}
                    >
                      <button
                        onClick={() => {
                          onSwitchVoid(void_.id);
                          setIsOpen(false);
                        }}
                        className="flex-1 flex items-center gap-3 text-left min-w-0"
                      >
                        <Lock size={16} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-mono uppercase tracking-wider truncate block">
                            {void_.name}
                          </span>
                          {void_.invite_code && (
                            <span className="text-xs text-muted-foreground font-mono">
                              Code: {void_.invite_code}
                            </span>
                          )}
                        </div>
                      </button>
                      {void_.invite_code && (
                        <button
                          onClick={() => copyInviteCode(void_.invite_code!)}
                          className="p-1.5 hover:bg-foreground/10"
                          title="Copy invite code"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                      {void_.owner_id === user.id && (
                        <button
                          onClick={() => onDeleteVoid(void_.id)}
                          className="p-1.5 hover:bg-destructive/20 text-destructive"
                          title="Delete void"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="border-t border-foreground/20" />
                </>
              )}

              {user && voids.length === 0 && (
                <div className="px-4 py-4 text-xs text-muted-foreground text-center">
                  No voids yet. Create one or join with a code.
                </div>
              )}

              {/* Actions */}
              {user ? (
                <>
                  <button
                    onClick={() => {
                      onCreateVoid();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                  >
                    <Plus size={16} />
                    <span className="text-sm font-mono uppercase tracking-wider">Create Void</span>
                  </button>
                  <button
                    onClick={() => {
                      onJoinVoid();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                  >
                    <Users size={16} />
                    <span className="text-sm font-mono uppercase tracking-wider">Join with Code</span>
                  </button>
                  <div className="border-t border-foreground/20" />
                  <button
                    onClick={() => {
                      onSignOut();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left text-muted-foreground"
                  >
                    <LogOut size={16} />
                    <span className="text-sm font-mono uppercase tracking-wider">Sign Out</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onSignIn();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                >
                  <LogIn size={16} />
                  <span className="text-sm font-mono uppercase tracking-wider">Sign In to Create Voids</span>
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
