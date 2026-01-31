import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ChatBubbleProps {
  message: string;
  onClose: () => void;
}

export function ChatBubble({ message, onClose }: ChatBubbleProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    setIsTyping(true);

    const interval = setInterval(() => {
      if (index < message.length) {
        setDisplayedText(message.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [message]);

  return (
    <div className="chat-bubble animate-fade-in">
      <button
        onClick={onClose}
        className="absolute -top-3 -right-3 w-6 h-6 bg-background border border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
      >
        <X size={12} />
      </button>
      <p className="leading-relaxed">
        {displayedText}
        {isTyping && <span className="animate-pulse">▌</span>}
      </p>
    </div>
  );
}
