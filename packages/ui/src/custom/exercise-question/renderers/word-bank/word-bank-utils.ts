/** Marker teachers use in the template for each blank (three underscores). */
export const WORD_BANK_BLANK_MARKER = '___';

/** Any run of 3+ underscores counts as a single blank, so `___` and `______` behave the same. */
export const WORD_BANK_BLANK_PATTERN = /_{3,}/g;

export type WordBankSegment = { type: 'text'; value: string } | { type: 'blank'; index: number };

export function countWordBankBlanks(template: string): number {
  if (!template) return 0;
  const matches = template.match(WORD_BANK_BLANK_PATTERN);
  return matches ? matches.length : 0;
}

/** Splits template into alternating text runs and blank slots (indices0..n-1). */
export function parseWordBankTemplate(template: string): WordBankSegment[] {
  const segments: WordBankSegment[] = [];
  if (!template) return segments;

  const parts = template.split(WORD_BANK_BLANK_PATTERN);
  let blankIndex = 0;

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].length > 0) {
      segments.push({ type: 'text', value: parts[i] });
    }
    if (i < parts.length - 1) {
      segments.push({ type: 'blank', index: blankIndex });
      blankIndex += 1;
    }
  }

  return segments;
}

export type WordBankChip = { id: string; label: string };

/** One chip per correct blank (by index) plus each distractor; labels may repeat. */
export function buildWordBankChips(correctAnswers: string[], distractors: string[]): WordBankChip[] {
  const chips: WordBankChip[] = [];

  correctAnswers.forEach((raw, index) => {
    const label = String(raw ?? '').trim();
    chips.push({ id: `correct-${index}`, label });
  });

  distractors.forEach((raw, index) => {
    const label = String(raw ?? '').trim();
    if (!label) return;
    chips.push({ id: `distractor-${index}`, label });
  });

  return chips;
}

/** Fisher–Yates shuffle (copy). */
export function shuffleWordBankChips<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Maps student answer strings to chip ids (first unused chip matching each label, in order).
 */
export function matchFilledBlanksToChipIds(filledBlanks: string[], chips: WordBankChip[]): (string | null)[] {
  const used = new Set<string>();
  const result: (string | null)[] = [];

  for (const raw of filledBlanks) {
    const target = String(raw ?? '')
      .trim()
      .toLowerCase();
    if (!target) {
      result.push(null);
      continue;
    }

    const chip = chips.find((c) => !used.has(c.id) && String(c.label).trim().toLowerCase() === target);
    if (chip) {
      used.add(chip.id);
      result.push(chip.id);
    } else {
      result.push(null);
    }
  }

  return result;
}

export function filledBlanksFromPlacements(
  placementByBlank: (string | null)[],
  chipById: Map<string, WordBankChip>
): string[] {
  return placementByBlank.map((id) => {
    if (!id) return '';
    return chipById.get(id)?.label ?? '';
  });
}
