import type { TemplateSegment } from './types';

const SLOT_MARKER = '⁣';

/**
 * Values for `$t` that keep each named placeholder findable, so a translated sentence can be
 * rendered with markup (a link, bold text) in place of the placeholder.
 */
export function slotValues(names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, `${SLOT_MARKER}${name}${SLOT_MARKER}`]));
}

/** Splits a sentence translated with `slotValues` into text runs and named slots, in reading order. */
export function splitSlots(translated: string): TemplateSegment[] {
  return translated
    .split(SLOT_MARKER)
    .map(
      (part, index): TemplateSegment => (index % 2 === 1 ? { kind: 'slot', name: part } : { kind: 'text', text: part })
    )
    .filter((segment) => segment.kind === 'slot' || segment.text.length > 0);
}
