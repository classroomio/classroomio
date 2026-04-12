<script lang="ts">
  import { cn } from '../../../tools';
  import { AnimatePresence, Motion } from 'svelte-motion';

  interface Props {
    class?: string;
    /** Applied to the flex row wrapper (e.g. alignment). */
    containerClass?: string;
    words?: string;
    duration?: number;
    delayMultiple?: number;
    framerProps?: {
      hidden: { opacity: number; x: number };
      visible: { opacity: number; x: number };
    };
  }

  let {
    class: className = 'drop-shadow-sm',
    containerClass = '',
    words = 'Gradual Spacing',
    duration = 0.5,
    delayMultiple = 0.04,
    framerProps = {
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0 }
    }
  }: Props = $props();

  const wordsspilit = $derived(words.split(''));
</script>

<div class={cn('flex justify-center space-x-1', containerClass)}>
  <AnimatePresence let:item list={[{ key: wordsspilit }]}>
    {#each wordsspilit as char, i}
      <Motion
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={framerProps}
        transition={{
          duration,
          delay: i * delayMultiple
        }}
        let:motion
      >
        <span use:motion class={cn(className)}>
          {#if char === ' '}
            <span>&nbsp;</span>
          {:else}
            {char}
          {/if}
        </span>
      </Motion>
    {/each}
  </AnimatePresence>
</div>
