<script lang="ts">
  import NumberBadge from '$src/base/number-badge/number-badge.svelte';
  import { cn } from '../../tools';

  interface Props {
    /** 1-indexed number shown in the badge. Resets per section. */
    number: number;
    title: string;
    /** Nested outline depth (0 = top level). */
    depth?: number;
    /** Is this the active (currently-viewed) row? */
    active?: boolean;
    /** Locked rows show a lock icon and a muted treatment. */
    locked?: boolean;
    /** Link href for the row. If omitted, the row renders as a button (story/testing). */
    href?: string;
    onClick?: () => void;
    class?: string;
  }

  let { number, title, depth = 0, active = false, locked = false, href, onClick, class: className }: Props = $props();

  const rowClass = $derived(
    cn(
      'ui:group ui:flex ui:items-center ui:gap-1.5 ui:py-1 ui:pr-4 ui:rounded-sm ui:text-sm ui:leading-snug ui:w-full ui:text-left ui:transition-colors',
      active && 'ui:bg-transparent',
      locked && !active && 'ui:text-muted-foreground',
      className
    )
  );

  const rowStyle = $derived(`padding-left: ${12 + depth * 14}px`);

  const titleClass = $derived(
    cn(
      'ui:text-wrap ui:transition-colors ui:text-[13px]',
      'ui:group-hover:text-primary',
      active ? 'ui:text-primary' : 'ui:text-foreground/70 ui:group-hover:text-foreground',
      locked && !active && 'ui:text-muted-foreground'
    )
  );

  // function handleAnchorClick(event: MouseEvent) {
  //   if (
  //     !onClick ||
  //     event.defaultPrevented ||
  //     event.button !== 0 ||
  //     event.metaKey ||
  //     event.ctrlKey ||
  //     event.shiftKey ||
  //     event.altKey
  //   ) {
  //     return;
  //   }

  //   event.preventDefault();
  //   onClick();
  // }
</script>

{#snippet body()}
  <NumberBadge {number} {active} {locked} />
  <span class={titleClass}>{title}</span>
{/snippet}

{#if href}
  <a {href} class={rowClass} style={rowStyle} aria-current={active ? 'page' : undefined}>
    {@render body()}
  </a>
{:else}
  <button
    type="button"
    class={rowClass}
    style={rowStyle}
    aria-current={active ? 'page' : undefined}
    aria-disabled={locked || undefined}
    onclick={onClick}
  >
    {@render body()}
  </button>
{/if}
