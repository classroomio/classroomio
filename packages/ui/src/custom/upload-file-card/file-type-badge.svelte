<script lang="ts">
  import { cn } from '../../tools';
  import { getFileBadge } from './file-badge';

  interface Props {
    /** File name; the badge shows its extension. */
    name: string;
    size?: 'sm' | 'md';
    class?: string;
  }

  let { name, size = 'md', class: className = '' }: Props = $props();

  const badge = $derived(getFileBadge(name));
</script>

<span
  class={cn(
    'ui:bg-primary/10 ui:text-primary ui:flex ui:shrink-0 ui:items-center ui:justify-center ui:font-bold',
    size === 'sm' ? 'ui:size-8 ui:rounded-md ui:text-[9px]' : 'ui:size-10 ui:rounded-lg ui:text-[10px]',
    className
  )}
>
  {badge.label}
</span>
