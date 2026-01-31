import { parseTextWithUrls } from '@/utils/urlParser';

interface SmartTextProps {
  text: string;
  className?: string;
}

export function SmartText({ text, className = '' }: SmartTextProps) {
  const segments = parseTextWithUrls(text);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'url') {
          return (
            <a
              key={index}
              href={segment.content}
              target="_blank"
              rel="noopener noreferrer"
              className="smart-link"
              onClick={(e) => e.stopPropagation()}
            >
              {segment.content}
            </a>
          );
        }
        return <span key={index}>{segment.content}</span>;
      })}
    </span>
  );
}
