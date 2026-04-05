import React, { useState } from 'react';
import { Pencil, Sparkles, BookOpen, Zap, Palette, ChevronDown, ChevronLeft } from 'lucide-react';
import { BoardTheme, themes } from './BoardThemePicker';

interface BoardToolbarProps {
  boardTheme: BoardTheme;
  onThemeSelect: (theme: BoardTheme) => void;
  showConstellation: boolean;
  onToggleConstellation: () => void;
  onGenerateSummary: () => void;
  onSuggestConnections: () => void;
  isLoadingSummary: boolean;
  isLoadingConnections: boolean;
  notesCount: number;
  onOpenDrawing: () => void;
}

interface BtnProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

function Btn({ icon, label, onClick, active, disabled }: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`relative flex items-center justify-center w-full px-3 py-[7px] text-xs font-mono uppercase tracking-widest transition-colors duration-100
        ${active ? 'bg-foreground text-background' : 'text-foreground hover:bg-foreground hover:text-background'}
        disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      <span className="absolute left-3 opacity-60">{icon}</span>
      {label}
    </button>
  );
}

type Panel = 'tools' | 'theme';

export function BoardToolbar({
  boardTheme, onThemeSelect,
  showConstellation, onToggleConstellation,
  onGenerateSummary, onSuggestConnections,
  isLoadingSummary, isLoadingConnections,
  notesCount, onOpenDrawing,
}: BoardToolbarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [panel, setPanel] = useState<Panel>('tools');

  return (
    <div className="fixed top-32 right-4 z-50 border border-foreground bg-background w-36">
      {/* Header */}
      <div className="flex items-center border-b border-foreground/20">
        {panel === 'theme' && (
          <button
            onClick={() => setPanel('tools')}
            className="px-2 py-[7px] text-foreground/50 hover:text-foreground transition-colors"
            title="Back"
          >
            <ChevronLeft size={13} />
          </button>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center justify-between flex-1 px-3 py-[7px] text-xs font-mono uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors"
        >
          <span>{panel === 'theme' ? 'Theme' : 'Tools'}</span>
          {panel === 'tools' && (
            <ChevronDown
              size={12}
              style={{
                transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 150ms ease',
              }}
            />
          )}
        </button>
      </div>

      {!collapsed && (
        panel === 'tools' ? (
          <>
            <Btn icon={<Pencil size={13} />}   label="Draw"    onClick={onOpenDrawing} />
            <Btn icon={<Sparkles size={13} />} label="Stars"   onClick={onToggleConstellation} active={showConstellation} />
            <Btn icon={<BookOpen size={13} />} label="Summary" onClick={onGenerateSummary} disabled={isLoadingSummary || notesCount === 0} />
            <Btn icon={<Zap size={13} />}      label="Connect" onClick={onSuggestConnections} disabled={isLoadingConnections || notesCount < 2} />
            <div className="border-t border-foreground/15 mx-3" />
            <Btn icon={<Palette size={13} />}  label="Theme"   onClick={() => setPanel('theme')} />
          </>
        ) : (
          <div>
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => { onThemeSelect(t.id); setPanel('tools'); }}
                className={`relative flex items-center justify-center w-full px-3 py-[7px] text-xs font-mono uppercase tracking-widest transition-colors duration-100
                  ${boardTheme === t.id ? 'bg-foreground text-background' : 'text-foreground hover:bg-foreground hover:text-background'}`}
              >
                <span
                  className="absolute left-3 w-3 h-3 border border-foreground/40"
                  style={{ background: t.preview }}
                />
                {t.name}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}
