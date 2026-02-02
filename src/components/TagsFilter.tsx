import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Check } from 'lucide-react';

interface TagsFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearAll: () => void;
}

export function TagsFilter({ 
  availableTags, 
  selectedTags, 
  onTagToggle, 
  onClearAll 
}: TagsFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (availableTags.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 border border-foreground transition-colors ${
          selectedTags.length > 0 
            ? 'bg-foreground text-background' 
            : 'bg-background hover:bg-foreground hover:text-background'
        }`}
      >
        <Filter size={14} />
        <span className="text-xs uppercase tracking-widest font-mono">
          {selectedTags.length > 0 ? `${selectedTags.length} Tags` : 'Filter'}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[90]" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 z-[91] bg-background border border-foreground p-3 shadow-lg min-w-[180px]"
            >
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-foreground/20">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Filter by tag</span>
                {selectedTags.length > 0 && (
                  <button
                    onClick={onClearAll}
                    className="text-[10px] uppercase tracking-wider hover:text-foreground transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => onTagToggle(tag)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 text-left text-xs uppercase tracking-wider transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-foreground text-background'
                        : 'hover:bg-foreground/10'
                    }`}
                  >
                    <span>#{tag}</span>
                    {selectedTags.includes(tag) && <Check size={12} />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
