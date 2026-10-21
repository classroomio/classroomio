import { untrack } from 'svelte';
import type { FieldDraftOptions } from './field-draft-types';

function isSameValue<TValue>(left: TValue, right: TValue): boolean {
  return Object.is(left, right) || JSON.stringify(left) === JSON.stringify(right);
}

export class FieldDraft<TValue, TDraft = string> {
  draft: TDraft = $state() as TDraft;

  readonly #options: FieldDraftOptions<TValue, TDraft>;

  constructor(options: FieldDraftOptions<TValue, TDraft>) {
    this.#options = options;
    this.draft = options.format(options.value());

    $effect.pre(() => {
      const stored = options.value();
      const represented = untrack(() => options.parse(this.draft));
      if (represented !== undefined && this.#equals(stored, represented)) return;

      this.draft = options.format(stored);
      untrack(() => options.onReseed?.(stored));
    });
  }

  input(nextDraft: TDraft) {
    this.draft = nextDraft;

    const parsed = this.#options.parse(nextDraft);
    if (parsed === undefined || this.#equals(parsed, this.#options.value())) return;

    this.#options.onChange(parsed);
  }

  commit() {
    const normalized = this.#options.normalize?.(this.draft);
    if (normalized === undefined) return;

    this.draft = this.#options.format(normalized);
    if (!this.#equals(normalized, this.#options.value())) this.#options.onChange(normalized);

    this.#options.onCommit?.(normalized);
  }

  #equals(left: TValue, right: TValue) {
    return (this.#options.equals ?? isSameValue)(left, right);
  }
}
