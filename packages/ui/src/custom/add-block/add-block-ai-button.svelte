<script lang="ts">
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import { cn } from '../../tools';
  import type { AddBlockShortcut } from './types';

  interface Props {
    label: string;
    shortcut?: AddBlockShortcut | null;
    variant?: 'pill' | 'menu';
    expanded?: boolean;
    testId?: string;
    onclick: () => void;
  }

  let { label, shortcut = null, variant = 'pill', expanded, testId, onclick }: Props = $props();

  const isPill = $derived(variant === 'pill');
</script>

<button
  type="button"
  class={cn(
    'ui:border-border ui:bg-card ui:text-foreground ui:cursor-pointer ui:items-center ui:border ui:transition-colors ui:outline-none',
    isPill
      ? 'ui:hover:border-primary/45 ui:focus-visible:border-primary/45 ui:inline-flex ui:gap-3 ui:rounded-xl ui:py-2 ui:pr-2.5 ui:pl-4 ui:text-[15px] ui:font-semibold ui:shadow-md'
      : 'ui:hover:border-primary ui:focus-visible:border-primary ui:flex ui:w-full ui:justify-center ui:gap-2 ui:rounded-lg ui:px-2.5 ui:py-[7px] ui:text-xs ui:font-medium'
  )}
  aria-expanded={expanded}
  data-testid={testId}
  {onclick}
>
  <SparklesIcon size={isPill ? 16 : 14} class="custom ui:text-primary" />
  {label}
  {#if shortcut}
    {#if isPill}
      <span class="ui:bg-border ui:w-px ui:self-stretch" aria-hidden="true"></span>
      <span class="ui:flex ui:gap-1">
        {#each [shortcut.modifier, shortcut.key] as key (key)}
          <kbd
            class="ui:bg-muted ui:text-muted-foreground ui:inline-grid ui:h-6 ui:min-w-6 ui:place-items-center ui:rounded-md ui:px-[5px] ui:font-sans ui:text-xs ui:font-semibold"
            >{key}</kbd
          >
        {/each}
      </span>
    {:else}
      <kbd class="ui:text-muted-foreground ui:font-sans ui:text-[10.5px]">{shortcut.modifier} {shortcut.key}</kbd>
    {/if}
  {/if}
</button>
