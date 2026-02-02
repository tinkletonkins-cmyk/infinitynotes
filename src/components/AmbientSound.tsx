import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AmbientSoundProps {
  noteCount: number;
}

// Create ambient oscillator-based sounds that evolve with note count
export function AmbientSound({ noteCount }: AmbientSoundProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);

  // Initialize audio on first user interaction
  const initAudio = () => {
    if (audioContextRef.current) return;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;

    // Create gain node for volume control
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0;
    gainNodeRef.current = gainNode;

    // Create low-pass filter for that cosmic muffled sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 1;
    filterNodeRef.current = filter;

    // Connect the chain
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Create multiple oscillators for a rich drone
    const frequencies = [55, 82.5, 110, 165]; // A1, E2, A2, E3 - a nice harmonic series
    const oscillators: OscillatorNode[] = [];

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      
      // Add subtle detuning for richness
      osc.detune.value = (Math.random() - 0.5) * 10;
      
      osc.connect(filter);
      osc.start();
      oscillators.push(osc);
    });

    oscillatorsRef.current = oscillators;
    setHasInteracted(true);
  };

  // Update sound based on note count
  useEffect(() => {
    if (!audioContextRef.current || !isPlaying) return;

    const ctx = audioContextRef.current;
    const gain = gainNodeRef.current;
    const filter = filterNodeRef.current;

    if (!gain || !filter) return;

    // Volume increases subtly with more notes (max 0.15 for ambient)
    const targetVolume = Math.min(0.05 + (noteCount * 0.01), 0.15);
    gain.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + 1);

    // Filter opens up with more notes (more "activity")
    const targetFreq = 150 + (noteCount * 30);
    filter.frequency.linearRampToValueAtTime(
      Math.min(targetFreq, 800),
      ctx.currentTime + 2
    );

    // Adjust oscillator detuning for movement
    oscillatorsRef.current.forEach((osc, i) => {
      const detune = Math.sin(Date.now() / 10000 + i) * 5 + (noteCount * 0.5);
      osc.detune.linearRampToValueAtTime(detune, ctx.currentTime + 0.5);
    });
  }, [noteCount, isPlaying]);

  // Animate oscillators over time
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      oscillatorsRef.current.forEach((osc, i) => {
        if (audioContextRef.current) {
          const detune = Math.sin(Date.now() / 8000 + i * 1.5) * 8;
          osc.detune.linearRampToValueAtTime(
            detune,
            audioContextRef.current.currentTime + 0.3
          );
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const toggleSound = () => {
    if (!hasInteracted) {
      initAudio();
    }

    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      const gain = gainNodeRef.current;
      if (gain) {
        if (isPlaying) {
          // Fade out
          gain.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.5);
        } else {
          // Fade in
          const targetVolume = Math.min(0.05 + (noteCount * 0.01), 0.15);
          gain.gain.linearRampToValueAtTime(targetVolume, audioContextRef.current.currentTime + 1);
        }
      }
    }

    setIsPlaying(!isPlaying);
  };

  return (
    <button
      onClick={toggleSound}
      className="fixed top-32 left-4 z-50 flex items-center gap-2 px-3 py-2 border border-foreground bg-background hover:bg-foreground hover:text-background transition-colors"
      title={isPlaying ? 'Mute ambient sounds' : 'Play ambient sounds'}
    >
      {isPlaying ? <Volume2 size={14} /> : <VolumeX size={14} />}
      <span className="text-xs uppercase tracking-widest font-mono">Ambient</span>
    </button>
  );
}
