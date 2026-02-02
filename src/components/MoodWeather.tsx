import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Note } from '@/hooks/useNotes';
import { analyzeSentiment, EmotionType } from '@/hooks/useSentiment';

interface MoodWeatherProps {
  notes: Note[];
}

// Map emotions to gradient colors
const emotionGradients: Record<EmotionType, { from: string; to: string; glow: string }> = {
  happy: { from: 'rgba(255, 200, 50, 0.15)', to: 'rgba(255, 150, 0, 0.08)', glow: 'rgba(255, 200, 50, 0.3)' },
  angry: { from: 'rgba(255, 50, 50, 0.15)', to: 'rgba(180, 0, 0, 0.08)', glow: 'rgba(255, 50, 50, 0.3)' },
  sad: { from: 'rgba(50, 100, 200, 0.15)', to: 'rgba(30, 60, 150, 0.08)', glow: 'rgba(50, 100, 255, 0.3)' },
  neutral: { from: 'rgba(50, 180, 100, 0.12)', to: 'rgba(30, 120, 60, 0.06)', glow: 'rgba(50, 200, 100, 0.2)' },
  normal: { from: 'rgba(255, 150, 50, 0.12)', to: 'rgba(200, 100, 30, 0.06)', glow: 'rgba(255, 150, 50, 0.2)' },
  weird: { from: 'rgba(200, 200, 200, 0.1)', to: 'rgba(150, 150, 150, 0.05)', glow: 'rgba(255, 255, 255, 0.15)' },
  question: { from: 'rgba(180, 50, 255, 0.15)', to: 'rgba(100, 30, 180, 0.08)', glow: 'rgba(180, 50, 255, 0.3)' },
};

function getCollectiveMood(notes: Note[]): { emotion: EmotionType; intensity: number } {
  if (notes.length === 0) {
    return { emotion: 'neutral', intensity: 0 };
  }

  // Count emotions
  const emotionCounts: Record<EmotionType, number> = {
    happy: 0,
    angry: 0,
    sad: 0,
    neutral: 0,
    normal: 0,
    weird: 0,
    question: 0,
  };

  notes.forEach(note => {
    const emotion = analyzeSentiment(note.text);
    emotionCounts[emotion]++;
  });

  // Find dominant emotion
  let dominantEmotion: EmotionType = 'neutral';
  let maxCount = 0;
  
  (Object.entries(emotionCounts) as [EmotionType, number][]).forEach(([emotion, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantEmotion = emotion;
    }
  });

  // Calculate intensity (0-1) based on how many notes share the dominant emotion
  const intensity = Math.min(maxCount / Math.max(notes.length, 1), 1);

  return { emotion: dominantEmotion, intensity };
}

export function MoodWeather({ notes }: MoodWeatherProps) {
  const { emotion, intensity } = useMemo(() => getCollectiveMood(notes), [notes]);
  const gradient = emotionGradients[emotion];

  // No weather effect if no notes or very low intensity
  if (notes.length === 0 || intensity < 0.1) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-[1]"
      initial={{ opacity: 0 }}
      animate={{ opacity: intensity }}
      transition={{ duration: 2 }}
    >
      {/* Radial gradient from center */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${gradient.from} 0%, ${gradient.to} 50%, transparent 80%)`,
        }}
      />
      
      {/* Edge vignette glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 100%, ${gradient.glow} 0%, transparent 50%)`,
          opacity: 0.5,
        }}
      />
      
      {/* Subtle animated pulse */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(circle at 50% 30%, ${gradient.glow} 0%, transparent 40%)`,
        }}
      />
    </motion.div>
  );
}
