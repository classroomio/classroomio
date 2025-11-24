<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  interface Props {
    className?: string;
    value?: string | number;
    size?: string;
    shape?: string;
  }

  let { className = '', value = '', size = '', shape = 'rounded-md' }: Props = $props();
</script>

<Badge
  class="{className} {size === 'sm' ? 'px-1 py-1' : 'px-2 py-2'} org-avatar {className.includes('bg-')
    ? ''
    : 'bg-gray-200 dark:text-black'} {shape} flex items-center justify-center text-center">{value}</Badge
>

<style>
  .org-avatar {
    width: fit-content;
  }
</style>
