<script lang="ts">
  import PencilLineIcon from '@lucide/svelte/icons/pencil-line';
  import { cn } from '../../../tools';

  interface Props {
    label: string;
    onclick: () => void;
    disabled?: boolean;
    class?: string;
    testId?: string;
  }

  let { label, onclick, disabled = false, class: className = '', testId }: Props = $props();
</script>

<button
  type="button"
  class={cn(
    'ui:bg-background/95 ui:border-border ui:text-foreground ui:hover:bg-muted ui:focus-visible:ring-ring ui:flex ui:cursor-pointer ui:items-center ui:gap-1.5 ui:rounded-md ui:border ui:px-2 ui:py-1.5 ui:text-xs ui:font-medium ui:shadow-sm ui:transition ui:focus-visible:ring-2 ui:focus-visible:outline-none ui:disabled:cursor-not-allowed ui:disabled:opacity-60',
    className
  )}
  {disabled}
  data-testid={testId}
  onclick={(event) => {
    event.stopPropagation();
    onclick();
  }}
>
  <PencilLineIcon size={12} aria-hidden="true" />
  {label}
</button>
