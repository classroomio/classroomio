import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DebouncedSearch } from './debounced-search.svelte';

describe('DebouncedSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces rapid keystrokes into a single apply after 300 ms', () => {
    const onApply = vi.fn();
    const search = new DebouncedSearch({ initial: '', onApply });

    search.input('d');
    search.input('da');
    search.input('dat');
    expect(onApply).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith('dat');
    search.destroy();
  });

  it('applies immediately when typing to empty', () => {
    const onApply = vi.fn();
    const search = new DebouncedSearch({ initial: 'data', onApply });

    search.input('dat');
    vi.advanceTimersByTime(300);
    expect(onApply).toHaveBeenCalledWith('dat');

    search.input('');
    expect(onApply).toHaveBeenCalledWith('');
    expect(onApply).toHaveBeenCalledTimes(2);
    search.destroy();
  });

  it('flush applies pending text immediately', () => {
    const onApply = vi.fn();
    const search = new DebouncedSearch({ initial: '', onApply });

    search.input('data science');
    search.flush();
    expect(onApply).toHaveBeenCalledWith('data science');

    vi.advanceTimersByTime(1000);
    expect(onApply).toHaveBeenCalledTimes(1);
    search.destroy();
  });

  it('takePending cancels the timer and returns the trimmed draft', () => {
    const onApply = vi.fn();
    const search = new DebouncedSearch({ initial: '', onApply });

    search.input('  data  ');
    expect(search.takePending()).toBe('data');

    vi.advanceTimersByTime(1000);
    expect(onApply).not.toHaveBeenCalled();
    search.destroy();
  });

  it('reset clears draft and applied without applying', () => {
    const onApply = vi.fn();
    const search = new DebouncedSearch({ initial: 'data', onApply });

    search.input('dat');
    search.reset();
    expect(search.draft).toBe('');
    expect(search.applied).toBe('');

    vi.advanceTimersByTime(1000);
    expect(onApply).not.toHaveBeenCalled();
    search.destroy();
  });

  it('sync ignores its own applied value and re-seeds on a different value', () => {
    const onApply = vi.fn();
    const search = new DebouncedSearch({ initial: 'data', onApply });

    search.input('data ');
    search.sync('data');
    expect(search.draft).toBe('data ');

    search.sync('science');
    expect(search.draft).toBe('science');
    expect(search.applied).toBe('science');
    search.destroy();
  });
});
