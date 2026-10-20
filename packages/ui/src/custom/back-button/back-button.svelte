<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import { cn } from '../../tools';
  import { Button } from '../../base/button';

  interface Props {
    href: string;
    label?: string;
    class?: string;
    testId?: string;
  }

  let { href, label, class: className, testId }: Props = $props();
</script>

<Button variant="link" class={cn('ui:h-fit! ui:justify-start! ui:px-0! ui:py-0!', className)} {href} {testId}>
  <ArrowLeftIcon class="custom" />
  {#if label}
    <span class="ui:text-xs">{label}</span>
  {/if}
</Button>
