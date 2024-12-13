<script lang="ts">
  import { cn } from '$lib/utils';

  type TColorProp = string | string[];

  interface Props {
    borderRadius?: number;
    borderWidth?: number;
    duration?: number;
    color?: TColorProp;
    class?: string;
    children?: import('svelte').Snippet;
  }

  let {
    borderRadius = 8,
    borderWidth = 3,
    duration = 14,
    color = ['#4FF9FF'],
    class: className = '',
    children
  }: Props = $props();
  
</script>

<div
  style="--border-radius: {borderRadius}px;"
  class={cn(
    'relative grid h-fit w-fit place-items-center rounded-[var(--border-radius)]',
    className
  )}
>
  <div
    style="
          --border-width: {borderWidth}px;
          --border-radius: {borderRadius}px;
          --shine-pulse-duration: {duration}s;
          --mask-linear-gradient: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          --background-radial-gradient: radial-gradient(transparent, transparent, {Array.isArray(
      color
    )
      ? color.join(',')
      : color}, transparent, transparent);
        "
    class="before:bg-shine-size before:absolute before:inset-0 before:aspect-square before:size-full before:rounded-[var(--border-radius)] before:p-[var(--border-width)] before:will-change-[background-position] before:content-[''] before:![-webkit-mask-composite:xor] before:![mask-composite:exclude] dark:before:[background-image:var(--background-radial-gradient)] dark:before:[background-size:300%_300%] dark:before:[mask:var(--mask-linear-gradient)] dark:motion-safe:before:animate-[shine-pulse_var(--shine-pulse-duration)_infinite_linear]"
  ></div>
  {@render children?.()}
</div>
