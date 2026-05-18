<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import { DotField } from '../animation/dot-field';
  import { Waves } from '../animation/waves';
  import { cn } from '../../tools';
  import type { PublicCourseCalloutAnimation, PublicCourseCalloutData } from './types';

  interface Props {
    callout: PublicCourseCalloutData | null;
    /** "inline" sits below the lesson body; "full" replaces it for locked items. */
    variant?: 'inline' | 'full';
    /** Shown when callout is null and variant === 'full'. */
    lockedFallbackTitle?: string;
    lockedFallbackDescription?: string;
    animation?: PublicCourseCalloutAnimation;
    class?: string;
  }

  let {
    callout,
    variant = 'inline',
    lockedFallbackTitle = 'This lesson is locked',
    lockedFallbackDescription = 'The creator hasn’t shared a link for this lesson yet. Check back later.',
    animation = 'waves',
    class: className
  }: Props = $props();

  const motionClass = 'ui:pointer-events-none ui:absolute ui:inset-0 ui:z-0 ui:h-full ui:w-full';

  const cardBase = 'ui:rounded-xl ui:border ui:border-primary/50 ui:text-card-foreground ui:transition-colors';

  const rootClass = $derived(
    variant === 'full'
      ? cn(
          cardBase,
          'ui:relative ui:overflow-hidden ui:my-10 ui:mx-auto ui:w-full ui:h-full ui:max-w-4xl ui:max-h-4xl ui:p-8 ui:flex ui:flex-col ui:items-center ui:justify-center ui:border-2 ui:border-primary/50 ui:border-dashed',
          className
        )
      : cn(cardBase, 'ui:relative ui:overflow-hidden ui:mt-10 ui:p-6', className)
  );
</script>

{#snippet calloutMotionBackground()}
  {#if animation === 'waves'}
    <Waves class={motionClass} />
  {:else if animation === 'dotted'}
    <DotField
      dotRadius={1.5}
      dotSpacing={14}
      cursorRadius={420}
      bulgeOnly={true}
      bulgeStrength={56}
      glowRadius={140}
      sparkle={false}
      waveAmplitude={0}
      maxGlowOpacity={0.5}
      class={motionClass}
    />
  {/if}
{/snippet}

{#if callout}
  <aside class={rootClass}>
    {@render calloutMotionBackground()}
    <div class="ui:relative ui:z-10 ui:flex ui:flex-col ui:items-center">
      <h3 class={cn('', variant === 'full' ? 'ui:text-3xl' : 'ui:text-xl')}>
        {callout.title}
      </h3>
      <p
        class={cn(
          'ui:mt-2 ui:text-md ui:text-muted-foreground ui:text-center',
          variant === 'full' && 'ui:mx-auto ui:max-w-md'
        )}
      >
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
        <ArrowUpRightIcon class="ui:size-4 custom" />
      </a>
    </div>
  </aside>
{:else if variant === 'full'}
  <aside class={rootClass}>
    {@render calloutMotionBackground()}
    <div class="ui:relative ui:z-10">
      <h3 class="ui:text-xl ui:font-semibold ui:text-foreground">{lockedFallbackTitle}</h3>
      <p class="ui:mt-2 ui:mx-auto ui:max-w-md ui:text-sm ui:text-muted-foreground">{lockedFallbackDescription}</p>
    </div>
  </aside>
{/if}
