import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmilePlus } from 'lucide-react';

interface NoteReactionsProps {
  noteId: string;
  reactionCounts: Record<string, number>;
  hasUserReacted: (emoji: string) => boolean;
  onReact: (emoji: string) => void;
}

const AVAILABLE_EMOJIS = ['👍', '❤️', '🔥', '💡', '🎯', '✨', '🤔', '👀'];

export function NoteReactions({ 
  noteId, 
  reactionCounts, 
  hasUserReacted, 
  onReact 
}: NoteReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onReact(emoji);
    setShowPicker(false);
  };

  const existingEmojis = Object.entries(reactionCounts).filter(([_, count]) => count > 0);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Existing reactions */}
      {existingEmojis.map(([emoji, count]) => (
        <motion.button
          key={emoji}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => onReact(emoji)}
          className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded border transition-colors ${
            hasUserReacted(emoji) 
              ? 'bg-foreground/20 border-foreground' 
              : 'border-foreground/30 hover:border-foreground'
          }`}
        >
          <span>{emoji}</span>
          <span className="font-mono text-[10px]">{count}</span>
        </motion.button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1 opacity-50 hover:opacity-100 transition-opacity"
          title="Add reaction"
        >
          <SmilePlus size={14} />
        </button>

        <AnimatePresence>
          {showPicker && (
            <>
              <div 
                className="fixed inset-0 z-[100]" 
                onClick={() => setShowPicker(false)} 
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                className="absolute bottom-full left-0 mb-1 z-[101] bg-background border border-foreground p-1.5 shadow-lg"
              >
                <div className="flex gap-1">
                  {AVAILABLE_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className={`p-1 text-lg hover:bg-foreground/20 transition-colors rounded ${
                        hasUserReacted(emoji) ? 'bg-foreground/10' : ''
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
