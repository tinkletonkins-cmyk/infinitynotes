import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Globe, Lock, Copy, Trash2, LogIn, LogOut, Users } from 'lucide-react';
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
  const currentName = currentVoid?.name || 'Public Void';

  const copyInviteCode = (inviteCode: string) => {
    const inviteUrl = `${window.location.origin}?join=${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: 'Invite link copied!',
      description: 'Share this link with others to invite them.',
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-foreground bg-background hover:bg-muted transition-colors"
      >
        {currentVoidId ? <Lock size={14} /> : <Globe size={14} />}
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
              {/* Public void option */}
              <button
                onClick={() => {
                  onSwitchVoid(null);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left ${
                  !currentVoidId ? 'bg-muted' : ''
                }`}
              >
                <Globe size={16} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono uppercase tracking-wider">Public Void</p>
                  <p className="text-xs text-muted-foreground">Open to everyone</p>
                </div>
              </button>

              {/* Divider */}
              <div className="border-t border-foreground/20" />

              {/* User's voids */}
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
                        <span className="text-sm font-mono uppercase tracking-wider truncate">
                          {void_.name}
                        </span>
                      </button>
                      {void_.invite_code && (
                        <button
                          onClick={() => copyInviteCode(void_.invite_code!)}
                          className="p-1.5 hover:bg-foreground/10 rounded"
                          title="Copy invite link"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                      {void_.owner_id === user.id && (
                        <button
                          onClick={() => onDeleteVoid(void_.id)}
                          className="p-1.5 hover:bg-destructive/20 text-destructive rounded"
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
                    <span className="text-sm font-mono uppercase tracking-wider">Create New Void</span>
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
