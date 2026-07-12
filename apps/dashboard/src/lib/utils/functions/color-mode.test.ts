import { describe, expect, it } from 'vitest';

import { MODE_STORAGE_KEY, readStoredColorMode } from './color-mode';

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

describe('readStoredColorMode', () => {
  it('defaults to light when nothing is stored', () => {
    expect(readStoredColorMode(createMemoryStorage())).toBe('light');
  });

  it('returns the stored sidebar preference', () => {
    const storage = createMemoryStorage({ [MODE_STORAGE_KEY]: 'dark' });

    expect(readStoredColorMode(storage)).toBe('dark');
  });
});
