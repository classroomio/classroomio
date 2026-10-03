<script lang="ts">
  import Maximize2Icon from '@lucide/svelte/icons/maximize-2';
  import { cn } from '../../tools';

  interface Props {
    src: string;
    alt: string;
    enlargeLabel: string;
    onclick: () => void;
    class?: string;
    imageClass?: string;
  }

  let { src, alt, enlargeLabel, onclick, class: className = '', imageClass = '' }: Props = $props();
</script>

<button
  type="button"
  class={cn(
    'ui:group ui:relative ui:block ui:w-full ui:cursor-zoom-in ui:overflow-hidden ui:rounded-md ui:border ui:bg-muted ui:focus-visible:outline-none ui:focus-visible:ring-2 ui:focus-visible:ring-ring',
    className
  )}
  aria-label={enlargeLabel}
  {onclick}
>
  <img {src} {alt} class={cn('ui:block ui:h-full ui:w-full ui:object-contain', imageClass)} />
  <span
    class="ui:pointer-events-none ui:absolute ui:bottom-2 ui:right-2 ui:inline-flex ui:translate-y-0.5 ui:items-center ui:gap-1.5 ui:rounded-md ui:bg-black/70 ui:px-2 ui:py-1 ui:text-xs ui:text-white ui:opacity-0 ui:transition ui:duration-150 ui:group-hover:translate-y-0 ui:group-hover:opacity-100 ui:group-focus-visible:translate-y-0 ui:group-focus-visible:opacity-100"
  >
    <Maximize2Icon class="ui:size-3.5" />
    {enlargeLabel}
  </span>
</button>
