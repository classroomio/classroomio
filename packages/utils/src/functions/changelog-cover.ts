export type ChangelogCoverLayout = {
  fontSize: number;
  lineHeight: number;
  lines: string[];
};

const FALLBACK_TITLE = 'ClassroomIO changelog';

const TIERS = [
  { fontSize: 112, maxChars: 22, maxLines: 3 },
  { fontSize: 88, maxChars: 28, maxLines: 4 },
  { fontSize: 70, maxChars: 36, maxLines: 5 }
] as const;

const LINE_HEIGHT_RATIO = 1.02;

function wrapWords(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let current = '';

  for (const word of text.split(' ')) {
    const chunks = word.length > maxChars ? (word.match(new RegExp(`.{1,${maxChars}}`, 'g')) ?? [word]) : [word];

    for (const chunk of chunks) {
      if (!current) {
        current = chunk;
      } else if (`${current} ${chunk}`.length <= maxChars) {
        current = `${current} ${chunk}`;
      } else {
        lines.push(current);
        current = chunk;
      }
    }
  }

  if (current) lines.push(current);

  return lines;
}

/**
 * Wraps a changelog title into the fewest lines that fit the cover and picks the largest font size that allows it.
 * A title too long for the smallest size is cut with an ellipsis on its last line.
 */
export function layoutChangelogTitle(title: string): ChangelogCoverLayout {
  const text = title.replace(/\s+/g, ' ').trim() || FALLBACK_TITLE;

  for (const tier of TIERS) {
    const lines = wrapWords(text, tier.maxChars);

    if (lines.length <= tier.maxLines) {
      return { fontSize: tier.fontSize, lineHeight: Math.round(tier.fontSize * LINE_HEIGHT_RATIO), lines };
    }
  }

  const smallest = TIERS[TIERS.length - 1];
  const lines = wrapWords(text, smallest.maxChars).slice(0, smallest.maxLines);
  const lastLine = lines[lines.length - 1];

  lines[lines.length - 1] = `${lastLine.slice(0, smallest.maxChars - 1).trimEnd()}…`;

  return { fontSize: smallest.fontSize, lineHeight: Math.round(smallest.fontSize * LINE_HEIGHT_RATIO), lines };
}
