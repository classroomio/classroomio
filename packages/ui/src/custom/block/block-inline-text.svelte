<script lang="ts">
  import { cn } from '../../tools';

  type InlineTextTag = 'span' | 'p' | 'div' | 'h2' | 'h3' | 'h4';

  interface Props {
    value: string;
    editable?: boolean;
    multiline?: boolean;
    placeholder?: string;
    ariaLabel?: string;
    maxLength?: number;
    tag?: InlineTextTag;
    class?: string;
    testId?: string;
    ref?: HTMLElement | null | undefined;
    onInput?: (value: string) => void;
  }

  let {
    value,
    editable = false,
    multiline = false,
    placeholder = '',
    ariaLabel,
    maxLength,
    tag = 'span',
    class: className = '',
    testId,
    ref = $bindable(),
    onInput
  }: Props = $props();

  $effect(() => {
    if (!editable || !ref || ref.textContent === value) return;

    ref.textContent = value;
  });

  function readText(element: HTMLElement): string {
    const raw = element.textContent ?? '';
    const singleLine = multiline ? raw : raw.replace(/\n+/g, ' ');
    const text = maxLength === undefined ? singleLine : singleLine.slice(0, maxLength);
    if (text !== raw) element.textContent = text;

    return text;
  }

  function handleInput(event: Event) {
    const element = event.currentTarget as HTMLElement;
    const text = readText(element);
    if (text === '') element.replaceChildren();

    onInput?.(text);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (multiline || event.key !== 'Enter') return;

    event.preventDefault();
    (event.currentTarget as HTMLElement).blur();
  }
</script>

{#if editable}
  <svelte:element
    this={tag}
    bind:this={ref}
    contenteditable="plaintext-only"
    role="textbox"
    tabindex="0"
    aria-label={ariaLabel ?? placeholder}
    aria-multiline={multiline}
    data-placeholder={placeholder}
    data-testid={testId}
    class={cn(
      'ui:cursor-text ui:rounded-sm ui:outline-none ui:focus-visible:ring-ring/50 ui:focus-visible:ring-2 ui:empty:before:pointer-events-none ui:empty:before:text-muted-foreground ui:empty:before:content-[attr(data-placeholder)]',
      multiline ? 'ui:whitespace-pre-wrap' : 'ui:break-words',
      className
    )}
    oninput={handleInput}
    onkeydown={handleKeydown}
  ></svelte:element>
{:else}
  <svelte:element this={tag} data-testid={testId} class={cn(multiline && 'ui:whitespace-pre-wrap', className)}
    >{value}</svelte:element
  >
{/if}
