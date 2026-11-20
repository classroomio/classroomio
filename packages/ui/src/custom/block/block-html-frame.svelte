<script lang="ts">
  import { cn } from '../../tools';

  interface Props {
    src: string;
    title: string;
    interactive: boolean;
    class?: string;
  }

  let { src, title, interactive, class: className = '' }: Props = $props();
</script>

<iframe
  {src}
  {title}
  sandbox="allow-scripts allow-modals allow-popups"
  referrerpolicy="no-referrer"
  loading="lazy"
  tabindex={interactive ? 0 : -1}
  class={cn(
    'ui:block ui:h-full ui:w-full ui:border-0 ui:bg-white',
    !interactive && 'ui:pointer-events-none',
    className
  )}
></iframe>
