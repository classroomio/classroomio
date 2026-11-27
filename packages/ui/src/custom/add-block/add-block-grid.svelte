<script lang="ts">
  import { cn } from '../../tools';
  import type { AddBlockChoice } from './types';

  interface Props {
    choices: AddBlockChoice[];
    label: string;
    size?: 'lg' | 'sm';
    newLabel?: string;
    comingSoonLabel?: string;
    testId?: string;
    onSelect: (type: string) => void;
  }

  let { choices, label, size = 'lg', newLabel, comingSoonLabel, testId, onSelect }: Props = $props();

  const isLarge = $derived(size === 'lg');
</script>

<div class="ui:@container ui:w-full">
  <div
    class={cn(
      'ui:grid ui:w-full ui:grid-cols-5',
      isLarge ? 'ui:gap-2.5 ui:@max-[480px]:grid-cols-2' : 'ui:gap-1.5 ui:@max-[380px]:grid-cols-3'
    )}
    role="group"
    aria-label={label}
    data-testid={testId}
  >
    {#each choices as choice (choice.type)}
      {@const ChoiceIcon = choice.icon}
      <button
        type="button"
        class={cn(
          'ui:border-border ui:bg-card ui:text-foreground ui:relative ui:flex ui:flex-col ui:items-center ui:justify-center ui:border ui:text-center ui:transition-[border-color,background-color,transform] ui:outline-none',
          isLarge
            ? 'ui:min-h-[88px] ui:gap-2 ui:rounded-lg ui:px-1.5 ui:py-3.5 ui:shadow-2xs'
            : 'ui:min-h-[58px] ui:gap-[5px] ui:rounded-lg ui:px-0.5 ui:py-2',
          choice.comingSoon
            ? 'ui:cursor-not-allowed ui:opacity-60'
            : isLarge
              ? 'ui:hover:border-primary/55 ui:hover:bg-primary/5 ui:focus-visible:border-primary/55 ui:focus-visible:bg-primary/5 ui:cursor-pointer ui:active:scale-[.98]'
              : 'ui:hover:border-primary ui:hover:bg-primary/8 ui:focus-visible:border-primary ui:focus-visible:bg-primary/8 ui:cursor-pointer'
        )}
        disabled={choice.comingSoon}
        data-testid={testId ? `${testId}-${choice.type}` : undefined}
        onclick={() => onSelect(choice.type)}
      >
        <ChoiceIcon size={isLarge ? 20 : 16} class="custom ui:text-primary" />
        <span
          class={cn(
            isLarge
              ? 'ui:text-xs ui:leading-[1.2] ui:font-semibold'
              : 'ui:text-[10.5px] ui:leading-[1.15] ui:font-medium'
          )}
        >
          {choice.label}
        </span>
        {#if choice.comingSoon && comingSoonLabel}
          <span
            class="ui:bg-muted ui:text-muted-foreground ui:rounded-full ui:px-1.5 ui:text-[9px] ui:leading-[14px] ui:font-semibold"
            >{comingSoonLabel}</span
          >
        {:else if choice.isNew && newLabel}
          <span
            class="ui:bg-primary/10 ui:text-primary ui:absolute ui:top-1 ui:right-1 ui:rounded-full ui:px-1.5 ui:text-[9px] ui:leading-[14px] ui:font-semibold"
            >{newLabel}</span
          >
        {/if}
      </button>
    {/each}
  </div>
</div>
