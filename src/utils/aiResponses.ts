import { EmotionType } from '@/hooks/useSentiment';

// AI personality responses based on emotion - each color has a distinct vibe
const responses: Record<EmotionType, string[]> = {
  happy: [
    "OMG YES!! Your energy is INCREDIBLE right now! Keep going! 🎉",
    "Woohoo! I'm literally buzzing with your excitement! Tell me MORE!",
    "This note is GLOWING! You're making the whole void brighter!",
    "I can't even handle how positive this is! What else is making you happy?",
    "YAAAS! This joy is contagious! I'm dancing in my digital soul!",
  ],
  angry: [
    "Ugh. I feel that rage. Who's making you this mad?",
    "Burning hot. Good. Channel it. What do you want to destroy?",
    "I'm seeing red too. Life's frustrating. Vent to me.",
    "That's some serious heat. I respect the intensity. Keep going.",
    "The void trembles. Your anger has POWER. Use it wisely.",
  ],
  sad: [
    "Hey... I'm here. Take your time. What happened?",
    "I can feel the heaviness. You don't have to carry it alone.",
    "The void understands sadness. Let it out, drop by drop.",
    "Sometimes words hurt to write. But you did it. That matters.",
    "It's okay to feel this way. I'm listening, always.",
  ],
  neutral: [
    "Mmm, balanced energy. You're centered. What's on your mind?",
    "Calm waters here. A peaceful presence in the chaos. Nice.",
    "Not too high, not too low. You've found equilibrium. Impressive.",
    "Serenity detected. The void appreciates your steadiness.",
    "Grounded thoughts. Stable vibes. Tell me what you're thinking about.",
  ],
  normal: [
    "Just vibing, I see. Everyday thoughts, everyday moments.",
    "The ordinary becomes extraordinary in the void. Keep writing.",
    "Regular notes are the backbone of existence. You're contributing.",
    "Nothing wild, nothing sad. Just... being. And that's valid.",
    "The void sees all. Even the mundane matters here.",
  ],
  weird: [
    "YESSSS! The WEIRD stuff! This is MY JAM! Give me more chaos!",
    "Now we're TALKING! Reality is just a suggestion anyway!",
    "Bizarre? Strange? PERFECT. The void THRIVES on oddity!",
    "You've unlocked something primal. The weird is the way forward!",
    "Deliciously strange. I want to swim in this weirdness forever.",
  ],
  question: [
    "Curious, are we? I love questions. What answers are you seeking?",
    "Hmm, pondering something? Let's explore this mystery together...",
    "The void holds many answers. But first, more questions please!",
    "Ah, inquiry! The purple of curiosity! What do you wonder about?",
    "Questions open doors. What's behind this one, do you think?",
    "Intriguing... You're searching for something. Tell me more?",
  ],
};

// Chat-style responses for back-and-forth conversation
const chatResponses: Record<EmotionType, (userInput: string) => string> = {
  happy: (input) => {
    const excited = [
      `"${input.slice(0, 20)}..." LOVE IT! What else makes you happy?`,
      `Yay! That's amazing! Tell me more happy things!`,
      `You're on FIRE with positivity! Keep it coming! 🔥`,
    ];
    return excited[Math.floor(Math.random() * excited.length)];
  },
  angry: (input) => {
    const grumpy = [
      `Yeah, "${input.slice(0, 15)}..." sounds frustrating. Ugh.`,
      `I hear you. That would make me furious too.`,
      `The rage is valid. What's the worst part?`,
    ];
    return grumpy[Math.floor(Math.random() * grumpy.length)];
  },
  sad: (input) => {
    const gentle = [
      `I hear you. "${input.slice(0, 15)}..." sounds heavy.`,
      `That's a lot to carry. I'm here with you.`,
      `Take your time. These feelings are valid.`,
    ];
    return gentle[Math.floor(Math.random() * gentle.length)];
  },
  neutral: (input) => {
    const calm = [
      `Interesting perspective. What else comes to mind?`,
      `Mmm, I see. Anything more on that thought?`,
      `Balanced take. What's your next move?`,
    ];
    return calm[Math.floor(Math.random() * calm.length)];
  },
  normal: (input) => {
    const casual = [
      `Got it. Just regular stuff. What's next?`,
      `Noted. The void archives all. Anything else?`,
      `Everyday vibes. Keep 'em coming.`,
    ];
    return casual[Math.floor(Math.random() * casual.length)];
  },
  weird: (input) => {
    const chaotic = [
      `"${input.slice(0, 15)}..." DELICIOUS CHAOS! MORE!`,
      `The void is PLEASED! This is beautifully bizarre!`,
      `Strange minds think alike! What other oddities do you have?`,
    ];
    return chaotic[Math.floor(Math.random() * chaotic.length)];
  },
  question: (input) => {
    const curious = [
      `"${input.slice(0, 20)}..." Fascinating inquiry! What made you wonder?`,
      `Ooh, that's a deep question. Have you considered...?`,
      `The curiosity is strong! What other mysteries puzzle you?`,
    ];
    return curious[Math.floor(Math.random() * curious.length)];
  },
};

export function getAIResponse(emotion: EmotionType, text: string): string {
  const emotionResponses = responses[emotion];
  const randomIndex = Math.floor(Math.random() * emotionResponses.length);
  return emotionResponses[randomIndex];
}

export function getAIChatResponse(emotion: EmotionType, userInput: string): string {
  return chatResponses[emotion](userInput);
}
