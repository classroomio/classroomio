<script lang="ts">
  import { tv } from 'tailwind-variants';
  import { usePasswordStrength } from './password-util.svelte';
  import type { PasswordStrengthProps } from './types';
  import { Meter } from 'bits-ui';
  import { cn } from '../../tools';

  let { strength = $bindable(), class: className }: PasswordStrengthProps = $props();

  const state = usePasswordStrength();

  const score = $derived(state.strength.score);

  $effect(() => {
    strength = state.strength;
  });

  const color = tv({
    base: '',
    variants: {
      score: {
        0: 'ui:bg-red-500',
        1: 'ui:bg-red-500',
        2: 'ui:bg-yellow-500',
        3: 'ui:bg-yellow-500',
        4: 'ui:bg-green-500'
      }
    }
  });
</script>

<Meter.Root
  value={state.strength.score}
  class={cn('ui:bg-accent ui:relative ui:h-[6px] ui:w-full ui:gap-1 ui:overflow-hidden ui:rounded-full', className)}
  min={0}
  max={4}
>
  <div
    class={cn('ui:h-full ui:transition-all ui:duration-500', color({ score }))}
    style="width: {(score / 4) * 100}%;"
  ></div>
  <!-- This creates the gaps between the bars -->
  <div class="ui:absolute ui:left-0 ui:top-0 ui:z-10 ui:flex ui:h-[6px] ui:w-full ui:place-items-center ui:gap-1">
    {#each Array.from({ length: 4 }) as _, i (i)}
      <div class="ui:ring-background ui:ring-3 ui:h-[6px] ui:w-1/4 ui:rounded-full"></div>
    {/each}
  </div>
</Meter.Root>
