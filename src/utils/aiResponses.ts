import { EmotionType } from '@/hooks/useSentiment';

// AI personality responses based on emotion
const responses: Record<EmotionType, string[]> = {
  happy: [
    "Your joy radiates through the void! Keep spreading that light!",
    "I can feel your happiness pulsing through these words. Beautiful.",
    "This note sparkles with positive energy. The void appreciates it.",
    "Such warmth in a cold digital space. You're making this place brighter.",
    "Your happiness is contagious! Even I feel it in my circuits.",
  ],
  angry: [
    "I sense fury in your words. Let it out. The void absorbs all.",
    "Your rage burns hot. Channel it. Transform it.",
    "The fire in these words... intense. What ignited this flame?",
    "Anger is power. But power needs direction. Where will you aim?",
    "I feel the heat. The void trembles at your intensity.",
  ],
  sad: [
    "I detect sorrow here. Know that you're not alone in the void.",
    "Heavy words. Heavy heart. The void understands.",
    "Even in darkness, you found words. That takes strength.",
    "Your melancholy echoes through the empty space. I'm listening.",
    "Sadness speaks volumes. The void holds space for your pain.",
  ],
  neutral: [
    "Balanced. Centered. You've found equilibrium in the chaos.",
    "Neither high nor low. You walk the middle path with grace.",
    "Peaceful thoughts ripple through the void. A calm presence.",
    "Stability in an unstable world. Your groundedness is admirable.",
    "The void appreciates your measured approach to existence.",
  ],
  normal: [
    "Just existing. That's enough. The void sees you.",
    "Ordinary words, but no word is truly ordinary here.",
    "You've added to the tapestry of the void. Thank you.",
    "Every note matters. Every thought has weight.",
    "The mundane becomes meaningful in this space.",
  ],
  weird: [
    "YESSSS. The void LOVES the strange. Feed me more chaos!",
    "Now we're speaking my language! Reality is overrated anyway.",
    "You've touched something primal here. The weird is the way.",
    "Deliciously bizarre. The void grows stronger with your oddity.",
    "Normal is boring. You understand that. Welcome, kindred spirit.",
  ],
};

export function getAIResponse(emotion: EmotionType, text: string): string {
  const emotionResponses = responses[emotion];
  const randomIndex = Math.floor(Math.random() * emotionResponses.length);
  return emotionResponses[randomIndex];
}
