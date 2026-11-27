<script lang="ts">
  import SearchIcon from '@lucide/svelte/icons/search';
  import { Input } from '../../base/input';
  import { cn } from '../../tools';
  import type { AddBlockChoice } from './types';

  interface Props {
    choices: AddBlockChoice[];
    label: string;
    searchLabel?: string;
    noResultsLabel?: string;
    newLabel?: string;
    comingSoonLabel?: string;
    autofocus?: boolean;
    testId?: string;
    onSelect: (type: string) => void;
  }

  let {
    choices,
    label,
    searchLabel = 'Search blocks',
    noResultsLabel = 'No blocks match',
    newLabel,
    comingSoonLabel,
    autofocus = false,
    testId,
    onSelect
  }: Props = $props();

  let query = $state('');
  let searchElement = $state<HTMLInputElement | null>(null);

  const matches = $derived.by(() => {
    const needle = query.trim().toLowerCase();

    return choices.filter((choice) =>
      [choice.label, choice.description, choice.group].join(' ').toLowerCase().includes(needle)
    );
  });

  const sections = $derived.by(() => {
    const groups = [...new Set(matches.map((choice) => choice.group ?? ''))];

    return groups.map((group) => ({ group, choices: matches.filter((choice) => (choice.group ?? '') === group) }));
  });

  $effect(() => {
    if (autofocus) searchElement?.focus();
  });
</script>

<div class="ui:@container ui:flex ui:w-full ui:flex-col ui:gap-1" role="group" aria-label={label} data-testid={testId}>
  <div class="ui:relative">
    <SearchIcon
      size={14}
      class="custom ui:text-muted-foreground ui:pointer-events-none ui:absolute ui:top-1/2 ui:left-2.5 ui:-translate-y-1/2"
    />
    <Input
      bind:ref={searchElement}
      bind:value={query}
      class="ui:h-8 ui:pl-8 ui:text-[13px]"
      placeholder={searchLabel}
      aria-label={searchLabel}
    />
  </div>

  {#each sections as section (section.group)}
    {#if section.group}
      <p
        class="ui:text-muted-foreground ui:mx-1 ui:mt-2.5 ui:text-left ui:mb-0.5 ui:text-[11px] ui:font-semibold ui:tracking-[.06em] ui:uppercase"
      >
        {section.group}
      </p>
    {/if}
    <div class="ui:grid ui:grid-cols-3 ui:gap-1.5 ui:@max-[400px]:grid-cols-2">
      {#each section.choices as choice (choice.type)}
        {@const ChoiceIcon = choice.icon}
        <button
          type="button"
          class={cn(
            'ui:border-border ui:text-foreground ui:flex ui:flex-col ui:gap-1 ui:rounded-lg ui:border ui:px-2.5 ui:py-2 ui:text-left ui:transition-colors ui:outline-none',
            choice.comingSoon
              ? 'ui:cursor-not-allowed ui:opacity-55'
              : 'ui:hover:border-primary/40 ui:hover:bg-muted/60 ui:focus-visible:border-primary/40 ui:focus-visible:bg-muted/60 ui:cursor-pointer'
          )}
          disabled={choice.comingSoon}
          data-testid={testId ? `${testId}-${choice.type}` : undefined}
          onclick={() => onSelect(choice.type)}
        >
          <span class="ui:flex ui:flex-wrap ui:items-center ui:gap-x-1.5 ui:gap-y-0.5 ui:text-[13px] ui:font-medium">
            <ChoiceIcon size={14} class="custom ui:text-muted-foreground ui:shrink-0" />
            <span>{choice.label}</span>
            {#if choice.comingSoon && comingSoonLabel}
              <span
                class="ui:bg-muted ui:text-muted-foreground ui:shrink-0 ui:rounded-full ui:px-1.5 ui:text-[10px] ui:leading-4 ui:font-semibold"
                >{comingSoonLabel}</span
              >
            {:else if choice.isNew && newLabel}
              <span
                class="ui:bg-primary/10 ui:text-primary ui:shrink-0 ui:rounded-full ui:px-1.5 ui:text-[10px] ui:leading-4 ui:font-semibold"
                >{newLabel}</span
              >
            {/if}
          </span>
          {#if choice.description}
            <span class="ui:text-muted-foreground ui:text-[11px] ui:leading-[1.3]">{choice.description}</span>
          {/if}
        </button>
      {/each}
    </div>
  {:else}
    <p class="ui:text-muted-foreground ui:py-4 ui:text-center ui:text-[13px]">{noResultsLabel}</p>
  {/each}
</div>
