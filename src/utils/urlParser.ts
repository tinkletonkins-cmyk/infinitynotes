// URL detection and parsing utility

const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/gi;

export interface TextSegment {
  type: 'text' | 'url';
  content: string;
}

export function parseTextWithUrls(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex state
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }

    // Add the URL
    segments.push({
      type: 'url',
      content: match[0],
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return segments;
}

export function containsUrl(text: string): boolean {
  URL_REGEX.lastIndex = 0;
  return URL_REGEX.test(text);
}
