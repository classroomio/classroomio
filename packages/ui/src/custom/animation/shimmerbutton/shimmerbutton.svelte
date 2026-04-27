<script lang="ts">
  import { cn } from '../../../tools';
  import type { Snippet } from 'svelte';

  interface Props {
    href?: string;
    target?: string;
    rel?: string;
    onclick?: (event: MouseEvent) => void;
    shimmerColor?: string;
    shimmerSize?: string;
    shimmerDuration?: string;
    borderRadius?: string;
    background?: string;
    class?: string;
    children?: Snippet;
  }

  let {
    href,
    target = '',
    rel = '',
    onclick,
    shimmerColor = '#ffffff',
    shimmerSize = '0.05em',
    shimmerDuration = '3s',
    borderRadius = '100px',
    background = 'rgba(0, 0, 0, 1)',
    class: className = '',
    children
  }: Props = $props();
</script>

{#snippet shimmerContent()}
  <div class={cn('ui:-z-30 ui:blur-[2px]', 'ui:@container-[size] ui:absolute ui:inset-0 ui:overflow-visible')}>
    <div
      class="ui:animate-magicslide ui:absolute ui:inset-0 ui:aspect-[1] ui:h-[100cqh] ui:rounded-none ui:[mask:none]"
    >
      <div
        class="ui:animate-spin-around ui:absolute ui:-inset-full ui:w-auto ui:[translate:0_0] ui:rotate-0 ui:[background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]"
      ></div>
    </div>
  </div>
  {@render children?.()}
  <div
    class={cn(
      'ui:absolute ui:inset-0 ui:h-full ui:w-full',
      'ui:rounded-2xl ui:px-4 ui:py-1.5 ui:text-sm ui:font-medium ui:shadow-[inset_0_-8px_10px_#ffffff1f]',
      'ui:transform-gpu ui:transition-all ui:duration-300 ui:ease-in-out',
      'ui:group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]',
      'ui:group-active:shadow-[inset_0_-10px_10px_#ffffff3f]'
    )}
  ></div>
  <div class={cn('ui:absolute ui:inset-(--cut) ui:-z-20 ui:rounded-(--radius) ui:[background:var(--bg)]')}></div>
{/snippet}

{#if href}
  <a
    style:--spread="90deg"
    style:--shimmer-color={shimmerColor}
    style:--radius={borderRadius}
    style:--speed={shimmerDuration}
    style:--cut={shimmerSize}
    style:--bg={background}
    class={cn(
      'ui:group ui:relative ui:z-0 ui:flex ui:cursor-pointer ui:items-center ui:justify-center ui:overflow-hidden ui:rounded-(--radius) ui:border ui:border-white/10 ui:px-6 ui:py-3 ui:whitespace-nowrap ui:text-white ui:[background:var(--bg)] ui:dark:text-white',
      'ui:transform-gpu ui:transition-transform ui:duration-300 ui:ease-in-out ui:active:translate-y-px',
      className
    )}
    {href}
    {target}
    {rel}
    data-rewardful
  >
    {@render shimmerContent()}
  </a>
{:else}
  <button
    style:--spread="90deg"
    style:--shimmer-color={shimmerColor}
    style:--radius={borderRadius}
    style:--speed={shimmerDuration}
    style:--cut={shimmerSize}
    style:--bg={background}
    class={cn(
      'ui:group ui:relative ui:z-0 ui:flex ui:cursor-pointer ui:items-center ui:justify-center ui:overflow-hidden ui:rounded-(--radius) ui:border ui:border-white/10 ui:px-6 ui:py-3 ui:whitespace-nowrap ui:text-white ui:[background:var(--bg)] ui:dark:text-white',
      'ui:transform-gpu ui:transition-transform ui:duration-300 ui:ease-in-out ui:active:translate-y-px',
      className
    )}
    {onclick}
  >
    {@render shimmerContent()}
  </button>
{/if}
