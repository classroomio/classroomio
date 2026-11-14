export type RunnerSoundName = 'tick' | 'go' | 'jump' | 'point' | 'crash' | 'record';

export interface RunnerSoundPlayer {
  play: (sound: RunnerSoundName) => void;
}

interface ToneStep {
  frequency: number;
  endFrequency?: number;
  at: number;
  duration: number;
  type: OscillatorType;
  volume: number;
}

const TAIL_SECONDS = 0.02;
const SILENT_GAIN = 0.0001;

const SOUNDS: Record<RunnerSoundName, ToneStep[]> = {
  tick: [{ frequency: 660, at: 0, duration: 0.07, type: 'square', volume: 0.04 }],
  go: [{ frequency: 988, at: 0, duration: 0.2, type: 'square', volume: 0.05 }],
  jump: [{ frequency: 320, endFrequency: 700, at: 0, duration: 0.14, type: 'square', volume: 0.05 }],
  point: [
    { frequency: 988, at: 0, duration: 0.05, type: 'square', volume: 0.03 },
    { frequency: 1319, at: 0.06, duration: 0.09, type: 'square', volume: 0.03 }
  ],
  crash: [
    { frequency: 220, endFrequency: 55, at: 0, duration: 0.4, type: 'sawtooth', volume: 0.07 },
    { frequency: 110, endFrequency: 40, at: 0.04, duration: 0.32, type: 'square', volume: 0.05 }
  ],
  record: [
    { frequency: 523, at: 0, duration: 0.12, type: 'square', volume: 0.045 },
    { frequency: 659, at: 0.11, duration: 0.12, type: 'square', volume: 0.045 },
    { frequency: 784, at: 0.22, duration: 0.12, type: 'square', volume: 0.045 },
    { frequency: 1047, at: 0.33, duration: 0.3, type: 'square', volume: 0.05 }
  ]
};

const silentPlayer: RunnerSoundPlayer = { play: () => undefined };

/**
 * Creates a player that synthesizes the game's sound effects with the Web Audio API, so no audio files load.
 * Returns a silent player when the browser has no Web Audio support.
 */
export function createSoundPlayer(): RunnerSoundPlayer {
  if (typeof AudioContext === 'undefined') return silentPlayer;

  const context = new AudioContext();

  return {
    play(sound) {
      if (context.state === 'suspended') void context.resume();

      const startAt = context.currentTime;

      for (const step of SOUNDS[sound]) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const begin = startAt + step.at;
        const end = begin + step.duration;

        oscillator.type = step.type;
        oscillator.frequency.setValueAtTime(step.frequency, begin);
        if (step.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(step.endFrequency, end);

        gain.gain.setValueAtTime(step.volume, begin);
        gain.gain.exponentialRampToValueAtTime(SILENT_GAIN, end);

        oscillator.connect(gain).connect(context.destination);
        oscillator.start(begin);
        oscillator.stop(end + TAIL_SECONDS);
      }
    }
  };
}
