<script module lang="ts">
  let pendingRuntime: Promise<typeof import('./mathlive-runtime')> | null = null;

  function loadRuntime() {
    pendingRuntime ??= import('./mathlive-runtime');
    return pendingRuntime;
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import katex from 'katex';
  import type { MathfieldElement } from 'mathlive';
  import { cn } from '../../tools';
  import { resolveMathKeyboard, textToLatex } from './utils';
  import type { MathInputValue, MathKeyboard } from './types';
  import 'katex/dist/katex.min.css';

  interface Props {
    /** LaTeX. */
    value?: string;
    /** Virtual keyboard layouts: a preset or a list of built-in and custom MathLive layouts. */
    keyboard?: MathKeyboard;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    invalid?: boolean;
    autofocus?: boolean;
    ariaLabel?: string;
    class?: string;
    /** Called on every edit with the LaTeX and its MathJSON. */
    onInput?: (value: MathInputValue) => void;
    /** Called when Enter or the virtual keyboard's return key is pressed. */
    onSubmit?: () => void;
  }

  let {
    value = $bindable(''),
    keyboard = 'algebra',
    placeholder = '',
    disabled = false,
    readonly = false,
    invalid = false,
    autofocus = false,
    ariaLabel,
    class: className = '',
    onInput,
    onSubmit
  }: Props = $props();

  let runtime = $state.raw<Awaited<ReturnType<typeof loadRuntime>> | null>(null);
  let mathFieldElement = $state<HTMLElement | null>(null);
  const mathField = $derived(mathFieldElement as MathfieldElement | null);

  const previewHtml = $derived(value ? katex.renderToString(value, { throwOnError: false }) : '');

  /** Inserts a MathLive template at the caret, replacing the selection, and focuses the field. */
  export function insert(latex: string) {
    if (!mathField) return;

    mathField.insert(latex, { selectionMode: 'placeholder', focus: true });
    handleInput();
  }

  export function focus() {
    mathField?.focus();
  }

  function handleInput(event?: Event) {
    if (!mathField || !runtime) return;

    if (event instanceof InputEvent && event.inputType === 'insertLineBreak') {
      onSubmit?.();
      return;
    }

    value = mathField.value;
    onInput?.({ latex: value, mathjson: runtime.toMathJson(value) });
  }

  function handleFocusIn() {
    runtime?.useKeyboardLayouts(resolveMathKeyboard(keyboard));
  }

  onMount(() => {
    let isDestroyed = false;

    void loadRuntime().then((loadedRuntime) => {
      if (isDestroyed) return;

      runtime = loadedRuntime;
    });

    return () => {
      isDestroyed = true;
    };
  });

  $effect(() => {
    if (!mathField) return;

    mathField.disabled = disabled;
    mathField.readOnly = readonly;
    mathField.placeholder = textToLatex(placeholder);
    if (ariaLabel) mathField.setAttribute('aria-label', ariaLabel);
  });

  $effect(() => {
    const nextValue = value;
    if (!mathField || mathField.value === nextValue) return;

    mathField.setValue(nextValue, { silenceNotifications: true });
  });

  $effect(() => {
    if (!mathField || !autofocus) return;

    mathField.focus();
  });
</script>

<div
  class={cn(
    'ui:border-input ui:bg-background ui:dark:bg-input/30 ui:shadow-xs ui:flex ui:min-h-10 ui:w-full ui:min-w-0 ui:items-center ui:rounded-md ui:border ui:px-2 ui:transition-[color,box-shadow]',
    'ui:focus-within:border-ring ui:focus-within:ring-ring/50 ui:focus-within:ring-[3px]',
    invalid && 'ui:border-destructive ui:ring-destructive/20 ui:dark:ring-destructive/40',
    disabled && 'ui:cursor-not-allowed ui:opacity-50',
    className
  )}
  data-slot="math-input"
>
  {#if runtime}
    <math-field
      bind:this={mathFieldElement}
      class="cio-math-field ui:block ui:w-full ui:min-w-0 ui:border-0 ui:bg-transparent ui:py-1 ui:text-lg ui:outline-none"
      oninput={handleInput}
      onfocusin={handleFocusIn}
    ></math-field>
  {:else}
    <div class="ui:min-w-0 ui:flex-1 ui:overflow-x-auto ui:py-1.5 ui:text-lg" aria-busy="true">
      {#if previewHtml}
        {@html previewHtml}
      {:else}
        <span class="ui:text-muted-foreground ui:text-sm">{placeholder}</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .cio-math-field {
    --caret-color: var(--primary);
    --selection-background-color: color-mix(in oklab, var(--primary) 20%, transparent);
    --contains-highlight-background-color: transparent;
  }

  .cio-math-field::part(menu-toggle) {
    display: none;
  }
</style>
