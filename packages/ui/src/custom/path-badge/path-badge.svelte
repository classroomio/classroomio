<script lang="ts">
  import { cn } from '../../tools';

  interface Props {
    type?: 'learning-path' | 'course';
    variant?: 'cover' | 'body';
    class?: string;
    label?: string;
  }

  let { type = 'learning-path', variant = 'cover', class: className = '', label }: Props = $props();

  const displayLabel = $derived(label ?? (type === 'course' ? 'Course' : 'Learning Path'));
</script>

<span
  class={cn(
    'ui:inline-flex ui:items-center ui:rounded-full ui:px-2.5 ui:py-0.5 ui:text-[10.5px] ui:font-bold ui:tracking-wider ui:uppercase ui:backdrop-blur-md ui:border ui:transition-colors',
    variant === 'cover'
      ? 'ui:bg-white/20 ui:text-white ui:border-white/35'
      : 'ui:bg-primary/15 ui:text-primary ui:border-primary/30',
    className
  )}
>
  {displayLabel}
</span>
