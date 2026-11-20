import type { DebouncedSearchOptions } from '$lib/utils/types/search';

export class DebouncedSearch {
  draft = $state('');
  applied = $state('');

  readonly #delayMs: number;
  readonly #onApply: (search: string) => void;
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor({ initial = '', delayMs = 300, onApply }: DebouncedSearchOptions) {
    this.draft = initial;
    this.applied = initial.trim();
    this.#delayMs = delayMs;
    this.#onApply = onApply;
  }

  input(value: string) {
    this.draft = value;
    this.#cancel();
    if (value.trim() === '') {
      this.flush();
      return;
    }

    this.#timer = setTimeout(() => this.flush(), this.#delayMs);
  }

  flush() {
    this.#cancel();
    const nextSearch = this.draft.trim();
    if (nextSearch === this.applied) return;

    this.applied = nextSearch;
    this.#onApply(nextSearch);
  }

  takePending(): string {
    this.#cancel();
    this.applied = this.draft.trim();

    return this.applied;
  }

  reset() {
    this.#cancel();
    this.draft = '';
    this.applied = '';
  }

  sync(externalSearch: string) {
    if (externalSearch.trim() === this.applied) return;

    this.#cancel();
    this.draft = externalSearch;
    this.applied = externalSearch.trim();
  }

  destroy() {
    this.#cancel();
  }

  #cancel() {
    if (this.#timer === undefined) return;

    clearTimeout(this.#timer);
    this.#timer = undefined;
  }
}
