<script lang="ts">
  import { cn } from '../../../../tools';

  interface Props {
    /** Muted label (already translated by caller). */
    label: string;
    /** Main value text. */
    value: string;
    class?: string;
    valueClass?: string;
  }

  let { label, value, class: className = '', valueClass = '' }: Props = $props();
</script>

<p class={cn('ui:text-sm', className)}>
  <span class="ui:text-muted-foreground">{label}</span>
  {' '}
  <span class={cn('ui:font-medium', valueClass)}>{value}</span>
</p>
