<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import { cn } from '../../tools';
  import { Button } from '../../base/button';

  interface Props {
    href: string;
    label?: string;
    class?: string;
  }

  let { href, label, class: className }: Props = $props();
</script>

<Button variant="link" class={cn('ui:h-fit! ui:justify-start! ui:p-0', className)} {href}>
  <ArrowLeftIcon class="custom" />
  {#if label}
    <span class="ui:text-xs">{label}</span>
  {/if}
</Button>
