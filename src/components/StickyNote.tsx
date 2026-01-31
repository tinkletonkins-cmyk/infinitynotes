import { useState, useCallback, useRef } from 'react';
import Draggable from 'react-draggable';
import { MessageCircle, X, GripVertical, Send } from 'lucide-react';
import { useSentiment, getEmotionClass, EmotionType } from '@/hooks/useSentiment';
import { getAIResponse, getAIChatResponse } from '@/utils/aiResponses';
import { SmartText } from './SmartText';

interface StickyNoteProps {
  id: string;
  initialPosition: { x: number; y: number };
  initialRotation: number;
  onDelete: (id: string) => void;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export function StickyNote({ id, initialPosition, initialRotation, onDelete }: StickyNoteProps) {
  const [text, setText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const emotion: EmotionType = useSentiment(text);
  const emotionClass = getEmotionClass(emotion);

  const handleToggleChat = useCallback(() => {
    if (!showChat) {
      // Opening chat - add initial AI greeting
      const greeting = getAIResponse(emotion, text);
      setChatMessages([{ role: 'ai', content: greeting }]);
      setShowChat(true);
      setTimeout(() => chatInputRef.current?.focus(), 100);
    } else {
      setShowChat(false);
      setChatMessages([]);
      setChatInput('');
    }
  }, [showChat, emotion, text]);

  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');

    // AI responds based on note's current emotion
    setTimeout(() => {
      const aiResponse = getAIChatResponse(emotion, userMessage);
      setChatMessages((prev) => [...prev, { role: 'ai', content: aiResponse }]);
    }, 500);
  }, [chatInput, emotion]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleDragStart = () => setIsDragging(true);
  const handleDragStop = () => setIsDragging(false);

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

        {/* Inline Chat */}
        {showChat && (
          <div className="border-t border-current">
            {/* Chat messages */}
            <div className="note-chat-response">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`mb-1 ${msg.role === 'user' ? 'opacity-60' : ''}`}>
                  <span className="font-bold">{msg.role === 'user' ? 'you: ' : 'ai: '}</span>
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
                placeholder="say something..."
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
