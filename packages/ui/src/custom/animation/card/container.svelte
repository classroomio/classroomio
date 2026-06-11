<script lang="ts">
  import { cn } from '../../../tools';
  import Ellipses from './ellipses.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    className?: string;
    children?: Snippet;
  }

  let { className, children }: Props = $props();
</script>

<div
  class={cn(
    'ui:relative ui:mx-auto ui:w-full ui:border ui:border-dashed ui:border-zinc-300 ui:px-8 ui:shadow-sm ui:sm:px-6 ui:md:px-8 ui:dark:border-zinc-800 ui:dark:bg-[#09090B]',
    className
  )}
>
  <div
    class="ui:absolute ui:top-4 ui:left-0 ui:z-0 ui:h-px ui:w-full ui:bg-zinc-400 ui:sm:top-6 ui:md:top-8 ui:dark:bg-zinc-700"
  ></div>
  <div
    class="ui:absolute ui:bottom-4 ui:left-0 ui:z-0 ui:h-px ui:w-full ui:bg-zinc-400 ui:sm:bottom-6 ui:md:bottom-8 ui:dark:bg-zinc-700"
  ></div>
  <div class="ui:relative ui:w-full ui:border-x ui:border-zinc-400 ui:dark:border-zinc-700">
    <Ellipses />
    <div class="ui:relative ui:z-20 ui:mx-auto ui:py-8">
      {@render children?.()}
    </div>
  </div>
</div>
