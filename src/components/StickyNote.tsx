import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, PanInfo, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, GripVertical, Send, Link2, RotateCcw } from 'lucide-react';
import { useSentiment, getEmotionClass, EmotionType } from '@/hooks/useSentiment';
import { getAIResponse, getAIChatResponse } from '@/utils/aiResponses';
import { useNoteMessages } from '@/hooks/useNoteMessages';
import { SmartText } from './SmartText';
import { ColorPicker } from './ColorPicker';
import { useNotePositions } from '@/contexts/NotePositionsContext';

interface StickyNoteProps {
  id: string;
  initialText: string;
  initialPosition: { x: number; y: number };
  initialRotation: number;
  initialColor: string | null;
  parentId: string | null;
  stackDepth: number;
  dimmed: boolean;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: { text?: string; position?: { x: number; y: number }; color?: string | null }) => void;
  onDrop: (id: string, position: { x: number; y: number }) => void;
  onDrag: (parentId: string, deltaX: number, deltaY: number) => void;
}

// Snappy spring physics for responsive feel
const springConfig = {
  stiffness: 600,
  damping: 20,
  mass: 0.5,
};

export function StickyNote({ 
  id, 
  initialText, 
  initialPosition, 
  initialRotation,
  initialColor,
  parentId,
  stackDepth,
  dimmed,
  onDelete, 
  onUpdate,
  onDrop,
  onDrag,
}: StickyNoteProps) {
  const [text, setText] = useState(initialText);
  const [color, setColor] = useState<string | null>(initialColor);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const lastPositionRef = useRef(initialPosition);
  
  const { updatePosition } = useNotePositions();

  // Motion values for snappy drag
  const x = useMotionValue(initialPosition.x);
  const y = useMotionValue(initialPosition.y);
  
  // Spring-animated position for smooth follow
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const { messages, username, sendMessage } = useNoteMessages(id);
  const emotion: EmotionType = useSentiment(text);
  const emotionClass = getEmotionClass(emotion);

  // Sync position from props (for when parent drags this child)
  useEffect(() => {
    x.set(initialPosition.x);
    y.set(initialPosition.y);
    lastPositionRef.current = initialPosition;
    // Update shared position context
    updatePosition(id, initialPosition);
  }, [initialPosition, x, y, id, updatePosition]);

  // Sync color from props
  useEffect(() => {
    setColor(initialColor);
  }, [initialColor]);

  // Sync text changes to database (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (text !== initialText) {
        onUpdate(id, { text });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [text, id, initialText, onUpdate]);

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
  };

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const currentX = x.get();
    const currentY = y.get();
    const deltaX = currentX - lastPositionRef.current.x;
    const deltaY = currentY - lastPositionRef.current.y;
    
    // Update position in shared context for real-time line updates
    updatePosition(id, { x: currentX, y: currentY });
    
    // Move children along with this note
    if (deltaX !== 0 || deltaY !== 0) {
      onDrag(id, deltaX, deltaY);
    }
    
    lastPositionRef.current = { x: currentX, y: currentY };
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const newPos = { x: x.get(), y: y.get() };
    updatePosition(id, newPos);
    onDrop(id, newPos);
  };

  const handleColorChange = useCallback((newColor: string | null) => {
    setColor(newColor);
    onUpdate(id, { color: newColor });
  }, [id, onUpdate]);

  const handleFlip = useCallback(() => {
    if (!isDragging) {
      setIsFlipped(prev => !prev);
    }
  }, [isDragging]);

  // Determine background style
  const backgroundStyle = color 
    ? { backgroundColor: color }
    : undefined;

  return (
    <motion.div
      drag
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
        zIndex: isDragging ? 1000 : (isFlipped ? 999 : stackDepth + 1),
        boxShadow: stackDepth > 0 ? `${stackDepth * 2}px ${stackDepth * 2}px 8px rgba(0,0,0,0.3)` : undefined,
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileDrag={{ 
        scale: 1.02,
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        cursor: "grabbing",
      }}
      transition={{
        scale: { duration: 0.1 },
        boxShadow: { duration: 0.1 },
      }}
      className={`absolute w-64 cursor-grab ${dimmed ? 'opacity-10 pointer-events-none' : ''}`}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{ 
          transformStyle: 'preserve-3d',
          ...backgroundStyle,
        }}
        className={`relative w-full ${!color ? emotionClass : ''} border border-foreground`}
      >
        {/* Front of note */}
        <motion.div
          style={{ backfaceVisibility: 'hidden' }}
          className="w-full"
        >
          {/* Header with drag handle */}
          <div className="flex items-center justify-between p-2 border-b border-current">
            <div className="flex items-center gap-1">
              <GripVertical size={16} className="opacity-50" />
              {parentId && (
                <Link2 size={12} className="opacity-50" />
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleFlip}
                className="p-1 hover:opacity-70 transition-opacity"
                title="Flip to see stacked notes"
              >
                <RotateCcw size={16} />
              </button>
              <ColorPicker currentColor={color} onColorSelect={handleColorChange} />
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
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="type your thoughts..."
            className="w-full h-32 p-3 bg-transparent resize-none focus:outline-none placeholder:opacity-50 font-mono text-sm"
            style={{ color: 'inherit' }}
          />

          {/* Emotion indicator */}
          <div className="px-3 pb-2 text-xs uppercase tracking-widest opacity-70 font-mono">
            {color ? 'custom' : emotion}
          </div>

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
        </motion.div>

        {/* Back of note - shown when flipped */}
        <motion.div
          style={{ 
            backfaceVisibility: 'hidden',
            rotateY: 180,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
          className={`${!color ? emotionClass : ''} border border-foreground opacity-30`}
        >
          <div className="flex items-center justify-between p-2 border-b border-current">
            <span className="text-xs font-mono opacity-70">viewing stack...</span>
            <button
              onClick={handleFlip}
              className="p-1 hover:opacity-70 transition-opacity"
              title="Flip back"
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="p-3 text-xs font-mono opacity-70">
            Click the flip button to return
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
