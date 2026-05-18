<script lang="ts">
  import LockIcon from '@lucide/svelte/icons/lock';
  import { cn } from '../../tools';

  interface Props {
    /** 1-indexed value shown when not `locked`. */
    number: number;
    /** When true, uses primary styling (e.g. active sidebar row or current question). */
    active?: boolean;
    /** Locked badges show a lock icon and muted treatment. */
    locked?: boolean;
    class?: string;
  }

  let { number, active = false, locked = false, class: className }: Props = $props();

  const badgeClass = $derived(
    cn(
      'ui:inline-flex ui:items-center ui:justify-center ui:shrink-0',
      'ui:size-7 ui:rounded-md ui:text-xs ui:font-medium ui:tabular-nums ui:tracking-tight',
      'ui:transition-colors',
      active
        ? 'ui:bg-primary ui:text-primary-foreground'
        : 'ui:border ui:bg-muted ui:text-muted-foreground ui:group-hover:bg-muted-foreground/15 ui:group-hover:text-foreground',
      className
    )
  );
</script>

<span class={badgeClass} aria-hidden="true">
  {#if locked}
    <LockIcon class="ui:size-3.5 custom" />
  {:else}
    {number}
  {/if}
</span>
