<script lang="ts">
  import { cn } from '../../tools';
  import { getReviewInitials, getReviewPresenceColor } from './presence-colors';

  interface Props {
    /** Viewport position of the pointer tip, in pixels. */
    x: number;
    y: number;
    name: string;
    colorIndex: number;
    /** What the teammate is typing in a new comment, shown in a bubble next to the cursor. */
    typingText?: string | null;
    class?: string;
  }

  let { x, y, name, colorIndex, typingText = null, class: className }: Props = $props();

  const color = $derived(getReviewPresenceColor(colorIndex));
  const firstName = $derived(name.trim().split(/\s+/)[0] ?? name);
</script>

<div
  data-slot="live-cursor"
  aria-hidden="true"
  class={cn(
    'ui:pointer-events-none ui:fixed ui:top-0 ui:left-0 ui:z-modal ui:transition-transform ui:duration-120 ui:ease-linear ui:motion-reduce:transition-none',
    className
  )}
  style:transform="translate({x}px, {y}px)"
  style:--cursor-color={color}
>
  <svg width="16" height="18" viewBox="0 0 16 18" class="ui:drop-shadow">
    <path d="M1 1 L1 15 L5 11 L8 17 L10.5 16 L7.5 10 L13 10 Z" fill={color} stroke="white" stroke-width="1.2" />
  </svg>
  <div class="ui:mt-0.5 ui:ml-3 ui:flex ui:max-w-60 ui:flex-col ui:items-start ui:gap-1">
    <span
      class="ui:inline-flex ui:items-center ui:gap-1 ui:rounded-full ui:px-2 ui:py-0.5 ui:text-[11px] ui:font-semibold ui:whitespace-nowrap ui:text-white"
      style:background-color={color}
    >
      <span class="ui:opacity-80">{getReviewInitials(name)}</span>
      {firstName}
    </span>
    {#if typingText}
      <span
        class="ui:rounded-lg ui:border ui:bg-background ui:px-2 ui:py-1 ui:text-xs ui:break-words ui:text-foreground ui:shadow-sm"
        style:border-color={color}
      >
        {typingText}
      </span>
    {/if}
  </div>
</div>
