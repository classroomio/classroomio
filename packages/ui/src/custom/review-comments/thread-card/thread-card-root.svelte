<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../../../tools';

  interface Props {
    /** Expanded, with every comment and the reply box. */
    active?: boolean;
    unread?: boolean;
    resolved?: boolean;
    /** Mirrors hovering the thread's highlight, marker or pin on the page. */
    hovered?: boolean;
    /** Accessible name, e.g. the first comment's author and anchor. */
    label?: string;
    onSelect?: () => void;
    onHoverChange?: (hovered: boolean) => void;
    testId?: string;
    class?: string;
    children: Snippet;
  }

  let {
    active = false,
    unread = false,
    resolved = false,
    hovered = false,
    label,
    onSelect,
    onHoverChange,
    testId,
    class: className,
    children
  }: Props = $props();

  const INTERACTIVE = 'button, a, input, textarea, select, [role="menuitem"], [contenteditable="true"]';

  function isFromControl(event: Event): boolean {
    return event.target instanceof Element && Boolean(event.target.closest(INTERACTIVE));
  }

  function handleClick(event: MouseEvent) {
    if (isFromControl(event)) return;

    onSelect?.();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || isFromControl(event)) return;

    event.preventDefault();
    onSelect?.();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_interactions -->
<article
  data-slot="review-thread-card"
  data-testid={testId}
  aria-label={label}
  aria-current={active ? 'true' : undefined}
  tabindex="0"
  class={cn(
    'ui:relative ui:cursor-pointer ui:border-b ui:border-border ui:py-3.5 ui:pr-1.5 ui:pl-2.5 ui:outline-none ui:focus-visible:ring-2 ui:focus-visible:ring-ring',
    active &&
      'ui:my-2 ui:rounded-xl ui:border-[1.5px] ui:border-primary ui:bg-background ui:px-3 ui:shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_16%,transparent)]',
    !active && hovered && 'ui:bg-muted/60',
    resolved && !active && 'ui:opacity-75',
    className
  )}
  onclick={handleClick}
  onkeydown={handleKeydown}
  onmouseenter={() => onHoverChange?.(true)}
  onmouseleave={() => onHoverChange?.(false)}
>
  {#if unread && !active}
    <span class="ui:absolute ui:top-4 ui:bottom-4 ui:left-0 ui:w-0.75 ui:rounded-sm ui:bg-primary" aria-hidden="true"
    ></span>
  {/if}
  {@render children()}
</article>
