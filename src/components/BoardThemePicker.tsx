import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette } from 'lucide-react';

export type BoardTheme = 'void' | 'board' | 'wavy' | 'galaxy' | 'blueprint' | 'paper' | 'sunset';

interface BoardThemePickerProps {
  currentTheme: BoardTheme;
  onThemeSelect: (theme: BoardTheme) => void;
}

const themes: { id: BoardTheme; name: string; preview: string }[] = [
  { id: 'void', name: 'The Void', preview: 'linear-gradient(135deg, #000 0%, #111 100%)' },
  { id: 'board', name: 'Cork Board', preview: 'linear-gradient(135deg, #b8956e 0%, #987545 100%)' },
  { id: 'wavy', name: 'Wavy Night', preview: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)' },
  { id: 'galaxy', name: 'Galaxy', preview: 'linear-gradient(135deg, #2d1b4e 0%, #1b2d4e 50%, #4e1b3d 100%)' },
  { id: 'blueprint', name: 'Blueprint', preview: 'linear-gradient(135deg, #1a3a5c 0%, #234d72 100%)' },
  { id: 'paper', name: 'Notebook', preview: 'linear-gradient(135deg, #f5f0e1 0%, #e8e3d4 100%)' },
  { id: 'sunset', name: 'Sunset', preview: 'linear-gradient(180deg, #8b4513 0%, #cd5c5c 50%, #4a2040 100%)' },
];

export function BoardThemePicker({ currentTheme, onThemeSelect }: BoardThemePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border border-foreground bg-background hover:bg-foreground hover:text-background transition-colors"
        title="Change board theme"
      >
        <Palette size={14} />
        <span className="text-xs uppercase tracking-widest font-mono">Theme</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 w-48 border border-foreground bg-background z-50 shadow-lg"
            >
              <div className="p-2 text-xs uppercase tracking-wider text-muted-foreground border-b border-foreground/20">
                Board Theme
              </div>
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    onThemeSelect(theme.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors text-left ${
                    currentTheme === theme.id ? 'bg-muted' : ''
                  }`}
                >
                  <div
                    className="w-6 h-6 border border-foreground/50 flex-shrink-0"
                    style={{ background: theme.preview }}
                  />
                  <span className="text-xs font-mono uppercase tracking-wider">
                    {theme.name}
                  </span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
