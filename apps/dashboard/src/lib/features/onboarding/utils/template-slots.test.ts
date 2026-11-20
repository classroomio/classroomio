import { describe, expect, it } from 'vitest';
import { slotValues, splitSlots } from './template-slots';

describe('splitSlots', () => {
  it('returns text runs and slots in reading order', () => {
    const values = slotValues(['terms', 'privacy']);
    const translated = `I agree to the ${values.terms} and ${values.privacy}.`;

    expect(splitSlots(translated)).toEqual([
      { kind: 'text', text: 'I agree to the ' },
      { kind: 'slot', name: 'terms' },
      { kind: 'text', text: ' and ' },
      { kind: 'slot', name: 'privacy' },
      { kind: 'text', text: '.' }
    ]);
  });

  it('keeps a slot at the start of the sentence', () => {
    const values = slotValues(['email']);

    expect(splitSlots(`${values.email} is unverified`)).toEqual([
      { kind: 'slot', name: 'email' },
      { kind: 'text', text: ' is unverified' }
    ]);
  });

  it('returns plain text when there are no slots', () => {
    expect(splitSlots('Check your inbox')).toEqual([{ kind: 'text', text: 'Check your inbox' }]);
  });
});
