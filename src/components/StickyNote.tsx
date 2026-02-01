import { useState, useCallback, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { MessageCircle, X, GripVertical, Send, Layers } from 'lucide-react';
import { useSentiment, getEmotionClass, EmotionType } from '@/hooks/useSentiment';
import { getAIResponse, getAIChatResponse } from '@/utils/aiResponses';
import { useNoteMessages } from '@/hooks/useNoteMessages';
import { SmartText } from './SmartText';

interface StickyNoteProps {
  id: string;
  initialText: string;
  initialPosition: { x: number; y: number };
  initialRotation: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: { text?: string; position?: { x: number; y: number } }) => void;
  onStack: (parentId: string, position: { x: number; y: number }) => void;
}

export function StickyNote({ 
  id, 
  initialText, 
  initialPosition, 
  initialRotation, 
  onDelete, 
  onUpdate,
  onStack 
}: StickyNoteProps) {
  const [text, setText] = useState(initialText);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const nodeRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const { messages, username, sendMessage } = useNoteMessages(id);
  const emotion: EmotionType = useSentiment(text);
  const emotionClass = getEmotionClass(emotion);

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
      // Opening chat - add AI greeting if no messages yet
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
    
    // Send user message
    await sendMessage(userMessage, false);

    // AI responds based on note's current emotion
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

  const handleDragStart = () => setIsDragging(true);
  const handleDragStop = (_e: any, data: { x: number; y: number }) => {
    setIsDragging(false);
    const newPos = { x: data.x, y: data.y };
    setPosition(newPos);
    onUpdate(id, { position: newPos });
  };

  const handleStack = () => {
    onStack(id, position);
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={initialPosition}
      handle=".drag-handle"
      onStart={handleDragStart}
      onStop={handleDragStop}
    >
      <div
        ref={nodeRef}
        className={`absolute w-64 ${emotionClass} border border-foreground transition-colors duration-300`}
        style={{
          transform: `rotate(${initialRotation}deg)`,
          zIndex: isDragging ? 1000 : 1,
        }}
      >
        {/* Header with drag handle */}
        <div className="drag-handle flex items-center justify-between p-2 border-b border-current cursor-grab active:cursor-grabbing">
          <GripVertical size={16} className="opacity-50" />
          <div className="flex gap-1">
            <button
              onClick={handleStack}
              className="p-1 hover:opacity-70 transition-opacity opacity-70"
              title="Stack a new note"
            >
              <Layers size={16} />
            </button>
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
          {emotion}
        </div>

        {/* Inline Chat (multiplayer + AI) */}
        {showChat && (
          <div className="border-t border-current">
            {/* Chat messages */}
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
            
            {/* Chat input */}
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
      </div>
    </Draggable>
  );
}
