<script lang="ts">
  import { Motion, AnimatePresence } from 'svelte-motion';
  import { inview } from 'svelte-inview';
  import { cn } from '../../../tools';
  import type { Snippet } from 'svelte';

  interface Props {
    duration?: number;
    delay?: number;
    yOffset?: number;
    inViewMargin?: string;
    blur?: string;
    once?: boolean;
    class?: string;
    children?: Snippet;
  }

  let {
    duration = 0.4,
    delay = 0,
    yOffset = 6,
    inViewMargin = '-50px',
    blur = '6px',
    once = false,
    class: className = '',
    children
  }: Props = $props();

  const id = crypto.randomUUID().slice(0, 8);
  let isInView = $state<'hidden' | 'visible'>('hidden');

  const defaultVariants = $derived({
    hidden: { opacity: 0, y: yOffset, filter: `blur(${blur})` },
    visible: { opacity: 1, y: 0, filter: `blur(0px)` }
  });
</script>

<AnimatePresence let:_item list={[{ key: id }]}>
  <Motion
    initial="hidden"
    animate={isInView}
    exit="hidden"
    variants={defaultVariants}
    transition={{
      delay: 0.04 + delay,
      duration,
      ease: 'easeOut'
    }}
    let:motion
  >
    <div
      use:inview={{ rootMargin: inViewMargin, unobserveOnEnter: once }}
      use:motion
      oninview_change={({ detail }) => {
        isInView = detail.inView ? 'visible' : 'hidden';
      }}
      class={cn(className)}
    >
      {@render children?.()}
    </div>
  </Motion>
</AnimatePresence>
