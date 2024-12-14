<script lang="ts">
  import { Motion, useMotionValue, useMotionTemplate } from 'svelte-motion';
  import CardAnimatedBorder from '../cardborder/CardAnimatedBorder.svelte';
  import { onMount } from 'svelte';
  import { cn } from '$lib/utils';

  interface Props {
    gradientSize?: number;
    gradientColor?: string;
    gradientOpacity?: number;
    index?: number;
    class?: string;
    children?: import('svelte').Snippet;
  }

  let {
    gradientSize = 200,
    gradientColor = '#262626',
    gradientOpacity = 0.8,
    index = 1,
    class: className = '',
    children
  }: Props = $props();

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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
onmousemove={handleMouseMove}
onmouseleave={handleMouseLeave}
class={cn('group relative flex w-fit justify-center rounded  bg-neutral-900', className)}
>
<CardAnimatedBorder index={index + 1}>
  <div class="relative z-10">
    
      {@render children?.()}
  
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
      ></div>    
    </Motion>
  </CardAnimatedBorder>
  </div>
