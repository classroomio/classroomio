<script lang="ts">
  import { cn } from '../../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<SVGElement> {
    class?: string;
  }

  let { class: className = '', ...rest }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  width={24}
  height={24}
  stroke-width="1"
  stroke-linecap="round"
  stroke="currentColor"
  class={cn('ui:absolute ui:text-black ui:dark:text-white', className)}
  {...rest}
>
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6" />
</svg>
