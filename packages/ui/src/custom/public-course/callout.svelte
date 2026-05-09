<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import { cn } from '../../tools';
  import type { PublicCourseCalloutData } from './types';

  interface Props {
    callout: PublicCourseCalloutData | null;
    /** "inline" sits below the lesson body; "full" replaces it for locked items. */
    variant?: 'inline' | 'full';
    /** Shown when callout is null and variant === 'full'. */
    lockedFallbackTitle?: string;
    lockedFallbackDescription?: string;
    class?: string;
  }

  let {
    callout,
    variant = 'inline',
    lockedFallbackTitle = 'This lesson is locked',
    lockedFallbackDescription = 'The creator hasn’t shared a link for this lesson yet. Check back later.',
    class: className
  }: Props = $props();

  const cardBase = 'ui:rounded-xl ui:border ui:border-border ui:bg-card ui:text-card-foreground ui:transition-colors';

  const rootClass = $derived(
    variant === 'full'
      ? cn(
          cardBase,
          'ui:my-10 ui:mx-auto ui:w-full ui:max-w-xl ui:p-8 ui:text-center ui:border-dashed ui:bg-muted/30',
          className
        )
      : cn(cardBase, 'ui:mt-10 ui:p-6', className)
  );
</script>

{#if callout}
  <aside class={rootClass}>
    <h3 class={cn('ui:font-semibold ui:text-foreground', variant === 'full' ? 'ui:text-xl' : 'ui:text-base')}>
      {callout.title}
    </h3>
    <p class={cn('ui:mt-2 ui:text-sm ui:text-muted-foreground', variant === 'full' && 'ui:mx-auto ui:max-w-md')}>
      {callout.description}
    </p>
    <a
      href={callout.buttonUrl}
      target="_blank"
      rel="noopener"
      class={cn(
        'ui:mt-4 ui:inline-flex ui:items-center ui:gap-1.5 ui:rounded-md ui:bg-primary ui:px-4 ui:py-2 ui:text-sm ui:font-medium ui:text-primary-foreground ui:transition-colors ui:hover:bg-primary/90'
      )}
    >
      {callout.buttonLabel}
      <ArrowUpRightIcon class="ui:size-4" />
    </a>
  </aside>
{:else if variant === 'full'}
  <aside class={rootClass}>
    <h3 class="ui:text-xl ui:font-semibold ui:text-foreground">{lockedFallbackTitle}</h3>
    <p class="ui:mt-2 ui:mx-auto ui:max-w-md ui:text-sm ui:text-muted-foreground">{lockedFallbackDescription}</p>
  </aside>
{/if}
