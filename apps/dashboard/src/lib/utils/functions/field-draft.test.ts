import { describe, expect, it, vi } from 'vitest';
import { FieldDraft } from '@cio/ui/hooks/field-draft.svelte';

function parseList(draft: string): string[] {
  return draft
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
}

function formatList(value: string[]): string {
  return value.join(', ');
}

describe('FieldDraft', () => {
  it('does not rewrite own emit', () => {
    let stored: string[] = [];
    const onChange = vi.fn((next: string[]) => {
      stored = next;
    });
    const field = new FieldDraft<string[], string>({
      value: () => stored,
      format: formatList,
      parse: parseList,
      onChange
    });

    field.input('a, ');

    expect(onChange).toHaveBeenCalledWith(['a']);
    expect(field.draft).toBe('a, ');
  });

  it('emits nothing for unparsable text', () => {
    const onChange = vi.fn();
    const field = new FieldDraft<string[], string>({
      value: () => ['a'],
      format: formatList,
      parse: () => undefined,
      onChange
    });

    field.input('a, ');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('commit normalizes and emits once', () => {
    let stored: string[] = ['a'];
    const onChange = vi.fn((next: string[]) => {
      stored = next;
    });
    const field = new FieldDraft<string[], string>({
      value: () => stored,
      format: formatList,
      parse: () => undefined,
      normalize: (draft) => parseList(draft),
      onChange
    });

    field.input('a, b, ');
    expect(onChange).not.toHaveBeenCalled();
    expect(field.draft).toBe('a, b, ');
    field.commit();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
    expect(field.draft).toBe('a, b');
  });

  it('commit does nothing when normalize returns undefined', () => {
    const onChange = vi.fn();
    const field = new FieldDraft<string[], string>({
      value: () => ['a'],
      format: formatList,
      parse: parseList,
      normalize: () => undefined,
      onChange
    });

    field.input('a, b');
    onChange.mockClear();
    field.commit();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('input with value equal to stored value emits nothing', () => {
    const onChange = vi.fn();
    const field = new FieldDraft<string[], string>({
      value: () => ['a', 'b'],
      format: formatList,
      parse: parseList,
      onChange
    });

    field.input('a, b');
    expect(onChange).not.toHaveBeenCalled();
  });

  // Vitest compiles Svelte for SSR, where $effect.pre never runs, so live
  // re-seeding is covered by the manual take-renderer checks in prd/realtime-input-ux.
  it('formats external values for re-seed', () => {
    expect(formatList(['a', 'b'])).toBe('a, b');
    expect(parseList('a, b')).toEqual(['a', 'b']);
  });
});
