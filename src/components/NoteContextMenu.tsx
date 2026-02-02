import React from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { Lock, Unlock, Copy, Trash2, Link2 } from 'lucide-react';

interface NoteContextMenuProps {
  children: React.ReactNode;
  isLocked: boolean;
  lockedBy: string | null;
  onLock: () => void;
  onUnlock: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onStartConnection: () => void;
}

export function NoteContextMenu({
  children,
  isLocked,
  lockedBy,
  onLock,
  onUnlock,
  onDelete,
  onCopy,
  onStartConnection,
}: NoteContextMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content
          className="min-w-[180px] bg-background border border-foreground p-1 z-[300]"
        >
          {isLocked ? (
            <ContextMenu.Item
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-foreground hover:text-background transition-colors outline-none"
              onSelect={onUnlock}
            >
              <Unlock size={14} />
              <span className="uppercase tracking-wider text-xs">Unlock Note</span>
            </ContextMenu.Item>
          ) : (
            <ContextMenu.Item
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-foreground hover:text-background transition-colors outline-none"
              onSelect={onLock}
            >
              <Lock size={14} />
              <span className="uppercase tracking-wider text-xs">Lock Note</span>
            </ContextMenu.Item>
          )}

          <ContextMenu.Separator className="h-px bg-foreground/20 my-1" />

          <ContextMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-foreground hover:text-background transition-colors outline-none"
            onSelect={onStartConnection}
            disabled={isLocked}
          >
            <Link2 size={14} />
            <span className="uppercase tracking-wider text-xs">Connect</span>
          </ContextMenu.Item>

          <ContextMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-foreground hover:text-background transition-colors outline-none"
            onSelect={onCopy}
          >
            <Copy size={14} />
            <span className="uppercase tracking-wider text-xs">Copy Text</span>
          </ContextMenu.Item>

          <ContextMenu.Separator className="h-px bg-foreground/20 my-1" />

          <ContextMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-red-500/20 hover:text-red-400 transition-colors outline-none"
            onSelect={onDelete}
            disabled={isLocked}
          >
            <Trash2 size={14} />
            <span className="uppercase tracking-wider text-xs">
              {isLocked ? 'Locked' : 'Delete'}
            </span>
          </ContextMenu.Item>

          {lockedBy && (
            <>
              <ContextMenu.Separator className="h-px bg-foreground/20 my-1" />
              <div className="px-3 py-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                Locked by: {lockedBy}
              </div>
            </>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
