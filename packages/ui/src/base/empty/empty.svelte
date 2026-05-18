<script lang="ts">
  import { DotField } from '../../custom/animation/dot-field';
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  type Props = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    /** Renders the marketing-style dot-field canvas behind content (pointer-events none). */
    animatedBackground?: boolean;
  };

  let { ref = $bindable(null), class: className, children, animatedBackground = false, ...restProps }: Props = $props();

  const innerClass =
    'ui:relative ui:z-10 ui:flex ui:min-w-0 ui:flex-1 ui:flex-col ui:items-center ui:justify-center ui:gap-6 ui:text-balance ui:p-6 ui:text-center ui:md:p-12';
</script>

{#if animatedBackground}
  <div
    bind:this={ref}
    data-slot="empty"
    class={cn(
      'ui:relative ui:overflow-hidden ui:flex ui:min-w-0 ui:flex-1 ui:flex-col ui:rounded-lg ui:border ui:border-dashed ui:border-border ui:text-balance',
      className
    )}
    {...restProps}
  >
    <DotField
      dotRadius={1.5}
      dotSpacing={14}
      cursorRadius={420}
      bulgeOnly={true}
      bulgeStrength={56}
      glowRadius={140}
      sparkle={false}
      waveAmplitude={0}
      class="ui:pointer-events-none ui:absolute ui:inset-0 ui:z-0 ui:h-full ui:w-full"
    />
    <div class={innerClass}>
      {@render children?.()}
    </div>
  </div>
{:else}
  <div
    bind:this={ref}
    data-slot="empty"
    class={cn(
      'ui:flex ui:min-w-0 ui:flex-1 ui:flex-col ui:items-center ui:justify-center ui:gap-6 ui:text-balance ui:rounded-lg ui:border-dashed ui:p-6 ui:text-center ui:md:p-12',
      className
    )}
    {...restProps}
  >
    {@render children?.()}
  </div>
{/if}
