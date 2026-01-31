import { useMemo } from 'react';
import Sentiment from 'sentiment';

export type EmotionType = 'happy' | 'angry' | 'sad' | 'neutral' | 'normal' | 'weird' | 'question';

const sentiment = new Sentiment();

// Words that indicate "weird" content
const weirdWords = [
  'weird', 'strange', 'bizarre', 'odd', 'peculiar', 'unusual', 'surreal',
  'absurd', 'crazy', 'insane', 'wild', 'trippy', 'psychedelic', 'alien',
  'paranormal', 'supernatural', 'uncanny', 'eerie', 'mysterious', 'enigmatic'
];

export function analyzeSentiment(text: string): EmotionType {
  if (!text.trim()) return 'normal';
  
  const lowerText = text.toLowerCase();
  
  // Check for questions first - highest priority override
  if (text.includes('?')) return 'question';
  
  // Check for weird words
  const hasWeirdWord = weirdWords.some(word => lowerText.includes(word));
  if (hasWeirdWord) return 'weird';
  
  const result = sentiment.analyze(text);
  const score = result.comparative;
  
  // Determine emotion based on score
  if (score > 0.5) return 'happy';
  if (score > 0.1) return 'neutral';
  if (score < -0.5) return 'angry';
  if (score < -0.1) return 'sad';
  
  // Score is exactly 0 or very close - neutral (green)
  if (Math.abs(score) <= 0.1) return 'neutral';
  
  return 'normal';
}

export function useSentiment(text: string): EmotionType {
  return useMemo(() => analyzeSentiment(text), [text]);
}

export function getEmotionClass(emotion: EmotionType): string {
  const classes: Record<EmotionType, string> = {
    happy: 'note-happy',
    angry: 'note-angry',
    sad: 'note-sad',
    neutral: 'note-neutral',
    normal: 'note-normal',
    weird: 'note-weird',
    question: 'note-question',
  };
  return classes[emotion];
}
