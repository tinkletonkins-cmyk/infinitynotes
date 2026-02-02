import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, X } from 'lucide-react';

interface NoteTagsProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  compact?: boolean;
}

const PRESET_TAGS = ['idea', 'todo', 'question', 'important', 'later', 'done'];

export function NoteTags({ tags, onAddTag, onRemoveTag, compact = false }: NoteTagsProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = useCallback(() => {
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onAddTag(trimmed);
    }
    setInputValue('');
    setShowInput(false);
  }, [inputValue, tags, onAddTag]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setShowInput(false);
      setInputValue('');
    }
  };

  const handlePresetClick = (tag: string) => {
    if (!tags.includes(tag)) {
      onAddTag(tag);
    }
    setShowInput(false);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider bg-foreground/10 border border-foreground/30"
          >
            #{tag}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Existing tags */}
      {tags.map(tag => (
        <motion.span
          key={tag}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wider bg-foreground/10 border border-foreground/30 group"
        >
          #{tag}
          <button
            onClick={() => onRemoveTag(tag)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={10} />
          </button>
        </motion.span>
      ))}

      {/* Add tag button */}
      <div className="relative">
        <button
          onClick={() => setShowInput(!showInput)}
          className="p-0.5 opacity-50 hover:opacity-100 transition-opacity"
          title="Add tag"
        >
          {showInput ? <X size={12} /> : <Plus size={12} />}
        </button>

        <AnimatePresence>
          {showInput && (
            <>
              <div 
                className="fixed inset-0 z-[100]" 
                onClick={() => setShowInput(false)} 
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                className="absolute bottom-full left-0 mb-1 z-[101] bg-background border border-foreground p-2 shadow-lg min-w-[160px]"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="new tag..."
                  className="w-full px-2 py-1 text-xs bg-transparent border border-foreground/30 focus:border-foreground focus:outline-none mb-2"
                  autoFocus
                />
                <div className="flex flex-wrap gap-1">
                  {PRESET_TAGS.filter(t => !tags.includes(t)).slice(0, 4).map(tag => (
                    <button
                      key={tag}
                      onClick={() => handlePresetClick(tag)}
                      className="px-1.5 py-0.5 text-[10px] uppercase tracking-wider border border-foreground/30 hover:bg-foreground hover:text-background transition-colors"
                    >
                      {tag}
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
