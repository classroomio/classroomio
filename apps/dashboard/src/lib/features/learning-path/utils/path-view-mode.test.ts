import { describe, expect, it } from 'vitest';
import { resolvePathAccessState, resolvePathViewMode } from './path-view-mode';

describe('resolvePathViewMode', () => {
  it('sends org-site visitors to the learner hub', () => {
    expect(resolvePathViewMode(true, null, true)).toBe('learner');
    expect(resolvePathViewMode(true, true, true)).toBe('learner');
  });

  it('sends org students on the app host to the learner hub', () => {
    expect(resolvePathViewMode(true, true, false)).toBe('learner');
  });

  it('sends org admins and tutors on the app host to the staff workspace', () => {
    expect(resolvePathViewMode(false, false, false)).toBe('staff');
  });

  it('stays loading while the org role is unknown outside student experience', () => {
    expect(resolvePathViewMode(false, null, false)).toBe('loading');
  });
});

describe('resolvePathAccessState', () => {
  it('stays loading until the matching record arrives', () => {
    expect(resolvePathAccessState({ isLoaded: false, isNotFound: false, isForbidden: false, loadError: null })).toBe(
      'loading'
    );
  });

  it('resolves ready when the matching record has loaded', () => {
    expect(resolvePathAccessState({ isLoaded: true, isNotFound: false, isForbidden: false, loadError: null })).toBe(
      'ready'
    );
  });

  it('maps a 404 to not_found', () => {
    expect(resolvePathAccessState({ isLoaded: false, isNotFound: true, isForbidden: false, loadError: null })).toBe(
      'not_found'
    );
  });

  it('maps a 403 to forbidden', () => {
    expect(resolvePathAccessState({ isLoaded: false, isNotFound: false, isForbidden: true, loadError: null })).toBe(
      'forbidden'
    );
  });

  it('maps other failures to error', () => {
    expect(
      resolvePathAccessState({
        isLoaded: false,
        isNotFound: false,
        isForbidden: false,
        loadError: 'Failed to load learning path'
      })
    ).toBe('error');
  });
});
