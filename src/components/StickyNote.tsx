import { useState, useCallback, useRef } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { MessageCircle, X, GripVertical } from 'lucide-react';
import { useSentiment, getEmotionClass, EmotionType } from '@/hooks/useSentiment';
import { getAIResponse } from '@/utils/aiResponses';
import { ChatBubble } from './ChatBubble';

interface StickyNoteProps {
  id: string;
  initialPosition: { x: number; y: number };
  initialRotation: number;
  onDelete: (id: string) => void;
}

export function StickyNote({ id, initialPosition, initialRotation, onDelete }: StickyNoteProps) {
  const [text, setText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const emotion: EmotionType = useSentiment(text);
  const emotionClass = getEmotionClass(emotion);

  const handleTalk = useCallback(() => {
    const response = getAIResponse(emotion, text);
    setChatMessage(response);
    setShowChat(true);
  }, [emotion, text]);

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
              onClick={handleTalk}
              className="p-1 hover:opacity-70 transition-opacity"
              title="Talk to this note"
            >
              <MessageCircle size={16} />
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

        {/* Chat bubble */}
        {showChat && (
          <ChatBubble
            message={chatMessage}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>
    </Draggable>
  );
}
