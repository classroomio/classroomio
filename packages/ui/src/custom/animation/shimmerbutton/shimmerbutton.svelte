<script lang="ts">
  import { cn } from '../../../tools';
  import type { Snippet } from 'svelte';

  interface Props {
    href: string;
    target?: string;
    rel?: string;
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
    shimmerColor = '#ffffff',
    shimmerSize = '0.05em',
    shimmerDuration = '3s',
    borderRadius = '100px',
    background = 'rgba(0, 0, 0, 1)',
    class: className = '',
    children
  }: Props = $props();
</script>

<a
  style:--spread="90deg"
  style:--shimmer-color={shimmerColor}
  style:--radius={borderRadius}
  style:--speed={shimmerDuration}
  style:--cut={shimmerSize}
  style:--bg={background}
  class={cn(
    'group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden rounded-(--radius) border border-white/10 px-6 py-3 whitespace-nowrap text-white [background:var(--bg)] dark:text-white',
    'transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px',
    className
  )}
  {href}
  {target}
  {rel}
  data-rewardful
>
  <div class={cn('-z-30 blur-[2px]', '@container-[size] absolute inset-0 overflow-visible')}>
    <div class="animate-magicslide absolute inset-0 aspect-[1] h-[100cqh] rounded-none [mask:none]">
      <div
        class="animate-spin-around absolute -inset-full w-auto [translate:0_0] rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]"
      ></div>
    </div>
  </div>
  {@render children?.()}
  <div
    class={cn(
      'absolute inset-0 h-full w-full',
      'rounded-2xl px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#ffffff1f]',
      'transform-gpu transition-all duration-300 ease-in-out',
      'group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]',
      'group-active:shadow-[inset_0_-10px_10px_#ffffff3f]'
    )}
  ></div>
  <div class={cn('absolute inset-(--cut) -z-20 rounded-(--radius) [background:var(--bg)]')}></div>
</a>
