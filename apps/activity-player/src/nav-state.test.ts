import { describe, expect, it } from 'vitest';
import { computeNavState } from './nav-state';

const unit = (identifier: string, overrides: Partial<{ completed: boolean; locked: boolean }> = {}) => ({
  identifier,
  title: `Module ${identifier}`,
  completed: false,
  locked: false,
  ...overrides
});

describe('computeNavState', () => {
  it('hides the menu for single-module packages', () => {
    const state = computeNavState([unit('a')], 'a');

    expect(state.hasMenu).toBe(false);
    expect(state.previous.disabled).toBe(true);
    expect(state.next.disabled).toBe(true);
  });

  it('links to the neighbouring modules', () => {
    const state = computeNavState([unit('a'), unit('b'), unit('c')], 'b');

    expect(state).toMatchObject({
      hasMenu: true,
      currentIndex: 1,
      currentTitle: 'Module b',
      previous: { identifier: 'a', disabled: false, locked: false },
      next: { identifier: 'c', disabled: false, locked: false }
    });
  });

  it('disables a step into a locked module', () => {
    const state = computeNavState([unit('a'), unit('b', { locked: true })], 'a');

    expect(state.next).toEqual({ identifier: 'b', locked: true, disabled: true });
  });

  it('disables both steps when the open module is unknown', () => {
    const state = computeNavState([unit('a'), unit('b')], 'missing');

    expect(state.currentIndex).toBe(-1);
    expect(state.currentTitle).toBeNull();
    expect(state.previous.disabled).toBe(true);
    expect(state.next.disabled).toBe(true);
  });

  it('counts completed modules', () => {
    const state = computeNavState([unit('a', { completed: true }), unit('b'), unit('c', { completed: true })], 'b');

    expect(state.completedCount).toBe(2);
  });
});
