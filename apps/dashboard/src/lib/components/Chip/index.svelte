<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';

  interface Props {
    value?: number;
    className?: string;
  }

  let { value = 0, className = '' }: Props = $props();

  // -- added this logic to adjust padding for double digit numbers
  const isDoubleDigit = $derived(value >= 10);
  const paddingClass = $derived(isDoubleDigit ? 'py-1.5' : '');
</script>

<Badge
  variant="outline"
  class="{className
    ? className
    : 'mt-2 bg-[#d1d5da80]'} flex items-center justify-center border {paddingClass} text-center text-xs font-medium"
  >{value}</Badge
>
