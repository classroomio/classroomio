<script lang="ts">
  import { Motion, AnimatePresence, useAnimation } from 'svelte-motion';
  import { inview } from 'svelte-inview';
  import { cn } from '$lib/utils';

  let {
    duration = 0.4,
    delay = 0,
    yOffset = 6,
    inViewMargin = '-50px',
    blur = '6px',
    once = false,
    class: className = ''
  } = $props();
  let id = $state(crypto.randomUUID().slice(0, 8));
  let isInView = $state('hidden');

  let defaultVariants = {
    hidden: { opacity: 0, y: yOffset, filter: `blur(${blur})` },
    visible: { opacity: 1, y: 0, filter: `blur(0px)` }
  };
</script>

<AnimatePresence let:item list={[{ key: id }]}>
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
      on:inview_change={({ detail }) => {
        isInView = detail.inView ? 'visible' : 'hidden';
      }}
      class={cn(className)}
    >
      <slot>Default</slot>
    </div>
  </Motion>
</AnimatePresence>
