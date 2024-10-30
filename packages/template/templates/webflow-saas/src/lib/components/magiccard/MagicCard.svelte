<script lang="ts">
  import { Motion, useMotionValue, useMotionTemplate } from 'svelte-motion';
  import CardAnimatedBorder from '../cardborder/CardAnimatedBorder.svelte';
  import { onMount } from 'svelte';
  import { cn } from '$lib/utils';

  export let gradientSize: number = 200;
  export let gradientColor: string = '#262626';
  export let gradientOpacity: number = 0.8;
  export let index = 1;
  let className: string = '';
  export { className as class };

  let gradSize = useMotionValue(gradientSize);
  let gradColor = useMotionValue(gradientColor);
  let mouseX = useMotionValue(-gradientSize);
  let mouseY = useMotionValue(-gradientSize);

  function handleMouseMove(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  function handleMouseLeave() {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }

  onMount(() => {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  });
  let bg = useMotionTemplate`radial-gradient(${gradSize}px circle at ${mouseX}px ${mouseY}px, ${gradColor}, transparent 100%)`;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  on:mousemove={handleMouseMove}
  on:mouseleave={handleMouseLeave}
  class={cn(
    'group relative flex w-fit  rounded bg-neutral-100 dark:bg-neutral-900   justify-center',
    className
  )}
>
  <CardAnimatedBorder index={index + 1}>
    <div class="relative z-10">
      <slot />
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
        class="pointer-events-none absolute inset-px rounded opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
    </Motion>
  </CardAnimatedBorder>
</div>
