import { describe, expect, it } from 'vitest';

import { resolveAppliedColorMode } from './color-mode-document';
import {
  MODE_EXPLICIT_STORAGE_KEY,
  MODE_STORAGE_KEY,
  hasExplicitColorModePreference,
  markColorModeExplicit,
  readStoredColorMode,
  resolveStoredColorMode
} from './color-mode';

function createMemoryStorage(initial: Record<string, string> = {}): Storage {
  const store = new Map(Object.entries(initial));

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    }
  };
}

describe('resolveAppliedColorMode', () => {
  it('defaults to light for missing or stale system preferences', () => {
    expect(resolveAppliedColorMode('light', false)).toBe('light');
    expect(resolveAppliedColorMode('light', true)).toBe('light');
    expect(resolveAppliedColorMode('system', true)).toBe('light');
  });

  it('follows the OS only for explicit system preferences', () => {
    expect(resolveAppliedColorMode('system', false)).toBe('dark');
    expect(resolveAppliedColorMode('dark', true)).toBe('dark');
  });
});

describe('resolveStoredColorMode', () => {
  it('defaults to light when nothing is stored', () => {
    expect(resolveStoredColorMode(createMemoryStorage())).toBe('light');
  });

  it('returns stored light or dark preferences', () => {
    const lightStorage = createMemoryStorage({ [MODE_STORAGE_KEY]: 'light' });
    const darkStorage = createMemoryStorage({ [MODE_STORAGE_KEY]: 'dark' });

    expect(resolveStoredColorMode(lightStorage)).toBe('light');
    expect(resolveStoredColorMode(darkStorage)).toBe('dark');
  });

  it('treats stale system values as light until the user explicitly chooses system', () => {
    const staleSystemStorage = createMemoryStorage({ [MODE_STORAGE_KEY]: 'system' });

    expect(resolveStoredColorMode(staleSystemStorage)).toBe('light');
  });

  it('honors system when the user explicitly chose it', () => {
    const explicitSystemStorage = createMemoryStorage({
      [MODE_STORAGE_KEY]: 'system',
      [MODE_EXPLICIT_STORAGE_KEY]: 'true'
    });

    expect(resolveStoredColorMode(explicitSystemStorage)).toBe('system');
  });
});

describe('readStoredColorMode', () => {
  it('delegates to resolveStoredColorMode', () => {
    expect(readStoredColorMode(createMemoryStorage())).toBe('light');
  });
});

describe('markColorModeExplicit', () => {
  it('marks the preference as user-selected', () => {
    const storage = createMemoryStorage();

    expect(hasExplicitColorModePreference(storage)).toBe(false);

    markColorModeExplicit(storage);

    expect(hasExplicitColorModePreference(storage)).toBe(true);
  });
});
