<script lang="ts">
  import { Motion, useMotionValue, useMotionTemplate } from 'svelte-motion';
  import { cn } from '../../../tools';
  import type { Snippet } from 'svelte';

  interface Props {
    gradientSize?: number;
    gradientColor?: string;
    gradientOpacity?: number;
    class?: string;
    children?: Snippet;
  }

  let {
    gradientSize = 200,
    gradientColor = '#262626',
    gradientOpacity = 0.8,
    class: className = '',
    children
  }: Props = $props();

  const gradSize = useMotionValue(200);
  const gradColor = useMotionValue('#262626');
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  $effect(() => {
    gradSize.set(gradientSize);
    gradColor.set(gradientColor);
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  });

  function handleMouseMove(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  function handleMouseLeave() {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }

  const bg = useMotionTemplate`radial-gradient(${gradSize}px circle at ${mouseX}px ${mouseY}px, ${gradColor}, transparent 100%)`;
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  onmousemove={handleMouseMove}
  onmouseleave={handleMouseLeave}
  class={cn(
    'group ui:relative ui:flex ui:size-full ui:justify-center ui:overflow-hidden ui:rounded-xl ui:border ui:bg-neutral-100 ui:py-4 ui:text-black ui:dark:bg-neutral-900 ui:dark:text-white',
    className
  )}
>
  <div class="ui:relative ui:z-10">
    {#if children}
      {@render children()}
    {:else}
      <div class="ui:flex ui:h-full ui:items-center ui:justify-center ui:text-center">
        <p class="ui:text-2xl">Magic Card</p>
      </div>
    {/if}
  </div>
  <Motion
    style={{
      background: bg,
      opacity: gradientOpacity
    }}
    let:motion
  >
    <div
      use:motion
      class="ui:pointer-events-none ui:absolute ui:-inset-px ui:rounded-xl ui:opacity-0 ui:transition-opacity ui:duration-300 ui:group-hover:opacity-100"
    ></div>
  </Motion>
</div>
