import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { MessageCircle, X, GripVertical, Send, Link2, Clock, Lock, Upload } from 'lucide-react';
import { useSentiment, getEmotionClass, EmotionType } from '@/hooks/useSentiment';
import { getAIResponse, getAIChatResponse } from '@/utils/aiResponses';
import { useNoteMessages } from '@/hooks/useNoteMessages';
import { useNoteHistory, HistoryEntry } from '@/hooks/useNoteHistory';
import { SmartText } from './SmartText';
import { ColorPicker } from './ColorPicker';
import { NoteShapePicker, NoteShape } from './NoteShapePicker';
import { NoteReactions } from './NoteReactions';
import { NoteTags } from './NoteTags';
import { NoteHistoryModal } from './NoteHistoryModal';
import { NoteContextMenu } from './NoteContextMenu';
import { useNotePositions } from '@/contexts/NotePositionsContext';
import { TypingIndicator } from './TypingIndicator';
import { useSnapToAlign } from '@/hooks/useSnapToAlign';
import { supabase } from '@/integrations/supabase/client';

// Debounce interval for saving drafts to database (2 seconds)
const DRAFT_SAVE_INTERVAL_MS = 2000;

interface StickyNoteProps {
  id: string;
  initialText: string;
  initialPosition: { x: number; y: number };
  initialRotation: number;
  initialColor: string | null;
  initialShape?: NoteShape;
  initialTags?: string[];
  isLocked: boolean;
  lockedBy: string | null;
  dimmed: boolean;
  isConnecting: boolean;
  isConnectionTarget: boolean;
  reactionCounts: Record<string, number>;
  hasUserReacted: (emoji: string) => boolean;
  onReact: (emoji: string) => void;
  onDelete: (id: string) => void;
  onLock: (id: string) => void;
  onUnlock: (id: string) => void;
  onUpdate: (id: string, updates: { text?: string; position?: { x: number; y: number }; color?: string | null; shape?: NoteShape; tags?: string[] }) => void;
  onDrop: (id: string, position: { x: number; y: number }) => void;
  onStartConnection: (id: string) => void;
  onCompleteConnection: (id: string) => void;
  onDragStateChange?: (id: string, isDragging: boolean, x: number, y: number) => void;
  remoteText?: string;
  remoteColor?: string | null;
  remotePosition?: { x: number; y: number };
  onTyping?: (text: string, color: string | null) => void;
  onTypingComplete?: () => void;
  onPositionChange?: (x: number, y: number) => void;
  onPositionComplete?: () => void;
  onEditingChange?: (isEditing: boolean) => void;
  isDraft?: boolean;
  onPublish?: (id: string) => Promise<boolean>;
  onDiscard?: (id: string) => void;
}

// Direct tracking — no spring delay
const springConfig = {
  stiffness: 10000,
  damping: 500,
  mass: 0.1,
};

export const StickyNote = React.memo(function StickyNote({ 
  id, 
  initialText, 
  initialPosition, 
  initialRotation,
  initialColor,
  initialShape = 'square',
  initialTags = [],
  isLocked,
  lockedBy,
  dimmed,
  isConnecting,
  isConnectionTarget,
  reactionCounts,
  hasUserReacted,
  onReact,
  onDelete, 
  onLock,
  onUnlock,
  onUpdate,
  onDrop,
  onStartConnection,
  onCompleteConnection,
  onDragStateChange,
  remoteText,
  remoteColor,
  remotePosition,
  onTyping,
  onTypingComplete,
  onPositionChange,
  onPositionComplete,
  onEditingChange,
  isDraft = false,
  onPublish,
  onDiscard,
}: StickyNoteProps) {
  const [text, setText] = useState(initialText);
  const [color, setColor] = useState<string | null>(initialColor);
  const [shape, setShape] = useState<NoteShape>(initialShape);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [lastSavedText, setLastSavedText] = useState(initialText);
  const [isLocallyEditing, setIsLocallyEditing] = useState(false);
  
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const lastPositionRef = useRef(initialPosition);
  const draftSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDraftSaveRef = useRef<number>(0);
  const pendingTextRef = useRef<string>(initialText);
  // Track whether user has manually positioned this note — prevent prop sync from snapping it back
  const hasUserPositionedRef = useRef(false);
  // Track mounted state to prevent saves after unmount
  const isMountedRef = useRef(true);
  
  const { updatePosition, positions } = useNotePositions();
  const { snapPosition } = useSnapToAlign(positions, id);

  // Motion values for snappy drag
  const x = useMotionValue(initialPosition.x);
  const y = useMotionValue(initialPosition.y);
  
  // Spring-animated position for smooth follow
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const { messages, username, sendMessage } = useNoteMessages(id);
  const { history, isLoading: isLoadingHistory, addHistoryEntry } = useNoteHistory(showHistory ? id : null);
  
  // Only compute local sentiment when editing locally - skip when receiving remote updates
  const localEmotion: EmotionType = useSentiment(text);
  
  // Use remote color directly when available (skip local sentiment for synced events)
  const isReceivingRemote = !isLocallyEditing && remoteColor !== undefined;
  const emotion: EmotionType = isReceivingRemote ? 'neutral' : localEmotion; // 'neutral' is placeholder when using remote color
  const emotionClass = getEmotionClass(emotion);

  // Sync position from props — only apply remote positions, never override local drags
  useEffect(() => {
    if (isDragging || hasUserPositionedRef.current) return;

    if (remotePosition) {
      x.set(remotePosition.x);
      y.set(remotePosition.y);
      lastPositionRef.current = remotePosition;
      updatePosition(id, remotePosition);
    }
  }, [remotePosition]); // eslint-disable-line react-hooks/exhaustive-deps

  // On first mount, set initial position
  useEffect(() => {
    x.set(initialPosition.x);
    y.set(initialPosition.y);
    lastPositionRef.current = initialPosition;
    updatePosition(id, initialPosition);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync color from props — but never overwrite with null if we already have a color
  useEffect(() => {
    if (initialColor !== null) setColor(initialColor);
  }, [initialColor]);

  useEffect(() => {
    setShape(initialShape);
  }, [initialShape]);

  // Sync tags from props
  useEffect(() => {
    setTags(initialTags);
  }, [initialTags.join(',')]);

  // Debounced draft save - saves to database every 2 seconds while typing
  const saveDraftToDatabase = useCallback(async (draftText: string) => {
    if (!isMountedRef.current) return;
    const now = Date.now();
    // Prevent saving too frequently
    if (now - lastDraftSaveRef.current < DRAFT_SAVE_INTERVAL_MS) return;
    
    lastDraftSaveRef.current = now;
    
    await supabase
      .from('notes')
      .update({ text: draftText })
      .eq('id', id);
      
    console.log(`[StickyNote] Draft saved for note ${id}`);
  }, [id]);

  // Set up debounced save timer when text changes
  useEffect(() => {
    if (!isLocallyEditing) return;
    
    pendingTextRef.current = text;
    
    // Clear existing timer
    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
    }
    
    // Set new timer to save draft after 2 seconds of typing
    draftSaveTimerRef.current = setTimeout(() => {
      saveDraftToDatabase(pendingTextRef.current);
    }, DRAFT_SAVE_INTERVAL_MS);
    
    return () => {
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
      }
    };
  }, [text, isLocallyEditing, saveDraftToDatabase]);

  // Save immediately when user stops editing (blur or component unmount)
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // On unmount, cancel pending timer and save any unsaved text synchronously via beacon
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
      }
      if (pendingTextRef.current !== lastSavedText) {
        supabase
          .from('notes')
          .update({ text: pendingTextRef.current })
          .eq('id', id)
          .then(() => {
            console.log(`[StickyNote] Final save on unmount for note ${id}`);
          });
      }
    };
  }, [id, lastSavedText]);

  // Sync text changes to parent and save history (original behavior)
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (text !== initialText) {
        // Save history entry if text changed significantly
        if (lastSavedText && text !== lastSavedText && lastSavedText.length > 0) {
          await addHistoryEntry(id, lastSavedText, color, shape);
        }
        setLastSavedText(text);
        onUpdate(id, { text });
        // Signal that local editing is complete (text saved)
        setIsLocallyEditing(false);
        onTypingComplete?.();
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [text, id, initialText, onUpdate, lastSavedText, addHistoryEntry, color, shape, onTypingComplete]);

  // Sync local state with database value when not editing (for new tabs)
  useEffect(() => {
    // Only sync when we're NOT locally editing and the DB has newer data
    if (!isLocallyEditing && initialText !== undefined) {
      // Update local text to match DB when not editing
      setText(initialText);
      pendingTextRef.current = initialText;
      setLastSavedText(initialText);
      onTypingComplete?.();
    }
  }, [initialText]); // Only re-run when initialText changes from DB

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleToggleChat = useCallback(() => {
    if (!showChat) {
      if (messages.length === 0) {
        const greeting = getAIResponse(emotion, text);
        sendMessage(greeting, true);
      }
      setShowChat(true);
      setTimeout(() => chatInputRef.current?.focus(), 100);
    } else {
      setShowChat(false);
      setChatInput('');
    }
  }, [showChat, emotion, text, messages.length, sendMessage]);

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    
    await sendMessage(userMessage, false);

    setTimeout(() => {
      const aiResponse = getAIChatResponse(emotion, userMessage);
      sendMessage(aiResponse, true);
    }, 500);
  }, [chatInput, emotion, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleDragStart = () => {
    setIsDragging(true);
    lastPositionRef.current = { x: x.get(), y: y.get() };
    updatePosition(id, lastPositionRef.current);
    onDragStateChange?.(id, true, x.get(), y.get());
  };

  const handleDrag = () => {
    const currentX = x.get();
    const currentY = y.get();
    
    // Update position in shared context for real-time line updates
    updatePosition(id, { x: currentX, y: currentY });
    
    // Broadcast position to other users
    onPositionChange?.(currentX, currentY);
    
    lastPositionRef.current = { x: currentX, y: currentY };
    onDragStateChange?.(id, true, currentX, currentY);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // Mark that this note has been manually positioned — prevent DB re-sync from snapping it back
    hasUserPositionedRef.current = true;
    const currentPos = { x: x.get(), y: y.get() };
    
    // Snap to nearby notes
    const snapped = snapPosition(currentPos);
    const newPos = { x: snapped.x, y: snapped.y };
    
    // Update motion values if snapped
    if (snapped.snappedX || snapped.snappedY) {
      x.set(newPos.x);
      y.set(newPos.y);
    }
    
    updatePosition(id, newPos);
    onDrop(id, newPos);
    onDragStateChange?.(id, false, newPos.x, newPos.y);
    // Signal position change complete (will save to DB in VoidBoard)
    onPositionComplete?.();
  };

  const handleColorChange = useCallback((newColor: string | null) => {
    setColor(newColor);
    onUpdate(id, { color: newColor });
  }, [id, onUpdate]);

  const handleShapeChange = useCallback((newShape: NoteShape) => {
    setShape(newShape);
    onUpdate(id, { shape: newShape });
  }, [id, onUpdate]);

  const handleAddTag = useCallback((tag: string) => {
    const newTags = [...tags, tag];
    setTags(newTags);
    onUpdate(id, { tags: newTags });
  }, [id, tags, onUpdate]);

  const handleRemoveTag = useCallback((tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    onUpdate(id, { tags: newTags });
  }, [id, tags, onUpdate]);

  const handleRestoreHistory = useCallback((entry: HistoryEntry) => {
    setText(entry.text);
    if (entry.color) setColor(entry.color);
    if (entry.shape) setShape(entry.shape as NoteShape);
    onUpdate(id, { 
      text: entry.text, 
      color: entry.color, 
      shape: entry.shape as NoteShape 
    });
    setShowHistory(false);
  }, [id, onUpdate]);

  // Determine background style - use remoteColor when receiving remote typing
  const displayColor = isLocallyEditing ? color : (remoteColor !== undefined ? remoteColor : color);
  const backgroundStyle = displayColor 
    ? { backgroundColor: displayColor }
    : undefined;

  const handleCopyText = useCallback(() => {
    navigator.clipboard.writeText(text);
  }, [text]);

  // Prevent actions on locked notes
  const canEdit = !isLocked;
  const canDrag = !isLocked && !isConnectionTarget;

  return (
    <NoteContextMenu
      isLocked={isLocked}
      lockedBy={lockedBy}
      onLock={() => onLock(id)}
      onUnlock={() => onUnlock(id)}
      onDelete={() => onDelete(id)}
      onCopy={handleCopyText}
      onStartConnection={() => onStartConnection(id)}
    >
      <motion.div
        drag={canDrag}
        dragMomentum={false}
        dragElastic={0.1}
        dragTransition={{
          bounceStiffness: 600,
          bounceDamping: 20,
          power: 0.3,
        }}
        style={{
          x: springX,
          y: springY,
          rotate: initialRotation,
          zIndex: isDragging ? 1000 : 1,
        }}
        onDragStart={canDrag ? handleDragStart : undefined}
        onDrag={canDrag ? handleDrag : undefined}
        onDragEnd={canDrag ? handleDragEnd : undefined}
        onClick={(e: React.MouseEvent) => {
          if (isConnectionTarget) {
            e.stopPropagation();
            onCompleteConnection(id);
          }
        }}
        whileDrag={canDrag ? { 
          scale: 1.02,
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          cursor: "grabbing",
        } : undefined}
        transition={{
          scale: { duration: 0.1 },
          boxShadow: { duration: 0.1 },
        }}
        className={`absolute w-[210px] ${canDrag ? 'cursor-grab' : 'cursor-default'} note-shape-${shape} ${dimmed ? 'opacity-10 pointer-events-none' : ''} ${isConnectionTarget ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-background cursor-pointer' : ''} ${isConnecting ? 'ring-2 ring-yellow-400' : ''} ${isLocked ? 'ring-1 ring-amber-500/50' : ''}`}
      >
      <div
        style={backgroundStyle}
        className={`relative w-full h-full ${!displayColor ? emotionClass : ''} border border-foreground ${shape === 'circle' ? 'aspect-square flex flex-col' : ''} note-glow note-glow-${!displayColor ? emotion : 'custom'}`}
      >
        {/* Header with drag handle */}
        <div className="flex items-center justify-between p-2 border-b border-current">
          <div className="flex items-center gap-1">
            <GripVertical size={16} className={`opacity-50 ${isLocked ? 'opacity-30' : ''}`} />
            {isLocked && (
              <span title={`Locked by ${lockedBy}`}>
                <Lock size={12} className="text-amber-500" />
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onStartConnection(id); }}
              className={`p-1 hover:opacity-70 transition-opacity ${isConnecting ? 'opacity-100 text-yellow-400' : 'opacity-70'}`}
              title="Connect to another note"
            >
              <Link2 size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowHistory(true); }}
              className="p-1 hover:opacity-70 transition-opacity opacity-70"
              title="View history"
            >
              <Clock size={16} />
            </button>
            <ColorPicker currentColor={color} onColorSelect={handleColorChange} />
            <NoteShapePicker currentShape={shape} onShapeSelect={handleShapeChange} />
            <button
              onClick={handleToggleChat}
              className={`p-1 hover:opacity-70 transition-opacity ${showChat ? 'opacity-100' : 'opacity-70'}`}
              title="Chat with this note"
            >
              <MessageCircle size={16} fill={showChat ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => onDelete(id)}
              className="p-1 hover:opacity-70 transition-opacity"
              title="Delete note"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Text area */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => {
              setIsLocallyEditing(true);
              setText(e.target.value);
              onTyping?.(e.target.value, color);
            }}
            onFocus={() => {
              setIsLocallyEditing(true);
              onEditingChange?.(true);
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsLocallyEditing(false);
                onEditingChange?.(false);
              }, 600);
            }}
            placeholder="type your thoughts..."
            className="w-full h-[115px] p-3 bg-transparent resize-none focus:outline-none placeholder:opacity-50 font-handwriting"
            style={{ color: 'inherit', fontFamily: "'Caveat', cursive", fontSize: '1.25rem' }}
          />

          {/* Remote live typing overlay — shown when someone else is typing this note */}
          {remoteText !== undefined && !isLocallyEditing && (
            <div
              className="absolute inset-0 p-3 pointer-events-none overflow-hidden"
              style={{ fontFamily: "'Caveat', cursive", fontSize: '1.25rem', lineHeight: 1.5 }}
            >
              {/* Dim the local text */}
              <div className="absolute inset-0 bg-current opacity-10" />
              {/* Show remote text */}
              <span className="relative whitespace-pre-wrap break-words opacity-90">
                {remoteText}
              </span>
              {/* Blinking cursor at end */}
              <span
                className="relative inline-block w-[2px] h-[1.1em] bg-current align-middle ml-[1px]"
                style={{ animation: 'blink 1s step-end infinite' }}
              />
            </div>
          )}
        </div>

        {/* Remote typing badge */}
        {remoteText !== undefined && !isLocallyEditing && (
          <div className="absolute top-10 right-2 flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest opacity-60">
            <TypingIndicator />
          </div>
        )}

        {/* Tags */}
        <div className="px-3 pb-1">
          <NoteTags 
            tags={tags} 
            onAddTag={handleAddTag} 
            onRemoveTag={handleRemoveTag} 
          />
        </div>

        {/* Reactions */}
        <div className="px-3 pb-1">
          <NoteReactions
            noteId={id}
            reactionCounts={reactionCounts}
            hasUserReacted={(emoji) => hasUserReacted(emoji)}
            onReact={(emoji) => onReact(emoji)}
          />
        </div>

        {/* Draft / Publish bar */}
        {isDraft ? (
          <div className="px-3 pb-2 flex items-center gap-2">
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (!text.trim()) return;
                const ok = await onPublish?.(id);
                if (!ok) {
                  // Publish failed — maybe text is empty
                }
              }}
              disabled={!text.trim()}
              className="flex items-center gap-1 px-2 py-1 text-xs font-mono uppercase tracking-widest bg-foreground/10 hover:bg-foreground/20 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Publish this note to the void"
            >
              <Upload size={12} />
              publish
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDiscard?.(id); }}
              className="text-xs font-mono uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
              title="Discard draft"
            >
              discard
            </button>
            <span className="ml-auto text-[10px] font-mono uppercase tracking-widest opacity-40">draft</span>
          </div>
        ) : (
          <div className="px-3 pb-2 text-xs uppercase tracking-widest opacity-70 font-mono">
            {displayColor ? 'custom' : emotion}
          </div>
        )}

        {/* Inline Chat (multiplayer + AI) */}
        {showChat && (
          <div className="border-t border-current">
            <div ref={chatScrollRef} className="note-chat-response max-h-40 overflow-y-auto">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`mb-1 ${!msg.is_ai && msg.username !== username ? 'opacity-80' : ''} ${!msg.is_ai && msg.username === username ? 'opacity-60' : ''}`}
                >
                  <span className="font-bold text-xs">
                    {msg.is_ai ? 'ai: ' : `${msg.username}: `}
                  </span>
                  <SmartText text={msg.content} />
                </div>
              ))}
            </div>
            
            <div className="flex items-center border-t border-current">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`${username}: say something...`}
                className="note-chat-input flex-1"
              />
              <button
                onClick={handleSendMessage}
                className="p-2 hover:opacity-70 transition-opacity"
                title="Send message"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}

        {/* History Modal */}
        <NoteHistoryModal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          history={history}
          isLoading={isLoadingHistory}
          currentText={text}
          onRestore={handleRestoreHistory}
        />
      </div>
    </motion.div>
    </NoteContextMenu>
  );
});
