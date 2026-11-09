<script lang="ts">
  import { cn } from '../../tools';
  import type { AddBlockChoice } from './types';

  interface Props {
    choice: AddBlockChoice;
    compact?: boolean;
    hideLabelOnMobile?: boolean;
    testId?: string;
    onSelect: (type: string) => void;
  }

  let { choice, compact = false, hideLabelOnMobile = false, testId, onSelect }: Props = $props();

  const ChoiceIcon = $derived(choice.icon);
</script>

<button
  type="button"
  class={cn(
    'ui:text-muted-foreground ui:hover:bg-muted ui:hover:text-primary ui:flex ui:flex-col ui:items-center ui:gap-0.5 ui:font-medium ui:transition ui:active:scale-95',
    compact
      ? 'ui:rounded-lg ui:px-2.5 ui:py-1 ui:text-[10px]'
      : 'ui:mx-1 ui:cursor-pointer ui:rounded-md ui:px-2.5 ui:py-1.5 ui:text-[12px]'
  )}
  onclick={() => onSelect(choice.type)}
  title={choice.label}
  aria-label={choice.label}
  data-testid={testId}
>
  <ChoiceIcon size={14} class="custom" />
  <span class={cn(hideLabelOnMobile && 'ui:hidden ui:sm:inline')}>{choice.label}</span>
</button>
