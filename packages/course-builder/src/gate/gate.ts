import type { SourceOutcome } from '../read/types';
import type { CorpusPage } from '../corpus/types';

export interface GateResult {
  passed: boolean;
  teachablePages: number;
  words: number;
  reason: 'enough-material' | 'too-few-pages' | 'too-few-words' | 'all-sources-blocked' | 'login-only';
}

export const GATE_DEFAULTS = { minPages: 3, minWords: 1500 };

/**
 * Decides whether a corpus holds enough product material to build courses from. Runs before any model call, so a
 * site with nothing to teach costs nothing. Thresholds are tuned on development sites only.
 */
export function usefulnessGate(pages: CorpusPage[], outcomes: SourceOutcome[], thresholds = GATE_DEFAULTS): GateResult {
  const teachable = pages.filter((page) => !page.excluded && !page.referenceOnly);
  const words = teachable.reduce((total, page) => total + page.wordCount, 0);

  if (teachable.length === 0 && outcomes.length && outcomes.every((outcome) => outcome === 'blocked')) {
    return { passed: false, teachablePages: 0, words, reason: 'all-sources-blocked' };
  }
  if (teachable.length === 0 && outcomes.some((outcome) => outcome === 'needs-login')) {
    return { passed: false, teachablePages: 0, words, reason: 'login-only' };
  }
  if (teachable.length < thresholds.minPages) {
    return { passed: false, teachablePages: teachable.length, words, reason: 'too-few-pages' };
  }
  if (words < thresholds.minWords) {
    return { passed: false, teachablePages: teachable.length, words, reason: 'too-few-words' };
  }

  return { passed: true, teachablePages: teachable.length, words, reason: 'enough-material' };
}
