<script lang="ts">
  import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
  import { cn } from '../../tools';
  import CatalogPopover from './add-block-catalog-popover.svelte';
  import type { AddBlockChoice } from './types';

  interface Props {
    choices: AddBlockChoice[];
    label: string;
    size?: 'lg' | 'sm';
    newLabel?: string;
    /** Every block type, shown in the All blocks popover. The All blocks tile is hidden when this is empty. */
    moreChoices?: AddBlockChoice[];
    moreLabel?: string;
    searchLabel?: string;
    noResultsLabel?: string;
    comingSoonLabel?: string;
    testId?: string;
    onSelect: (type: string) => void;
  }

  let {
    choices,
    label,
    size = 'lg',
    newLabel,
    moreChoices = [],
    moreLabel = 'All blocks',
    searchLabel,
    noResultsLabel,
    comingSoonLabel,
    testId,
    onSelect
  }: Props = $props();

  const isLarge = $derived(size === 'lg');
  const showMore = $derived(moreChoices.length > 0);

  const tileClass = $derived(
    cn(
      'ui:border-border ui:bg-card ui:text-foreground ui:relative ui:flex ui:cursor-pointer ui:flex-col ui:items-center ui:justify-center ui:border ui:text-center ui:transition-[border-color,background-color,transform] ui:outline-none',
      isLarge
        ? 'ui:hover:border-primary/55 ui:hover:bg-primary/5 ui:focus-visible:border-primary/55 ui:focus-visible:bg-primary/5 ui:min-h-[76px] ui:gap-2 ui:rounded-lg ui:px-1.5 ui:py-3 ui:shadow-2xs ui:active:scale-[.98]'
        : 'ui:hover:border-primary ui:hover:bg-primary/8 ui:focus-visible:border-primary ui:focus-visible:bg-primary/8 ui:min-h-[58px] ui:gap-[5px] ui:rounded-lg ui:px-0.5 ui:py-2'
    )
  );
  const labelClass = $derived(
    isLarge ? 'ui:text-xs ui:leading-[1.2] ui:font-semibold' : 'ui:text-[10.5px] ui:leading-[1.15] ui:font-medium'
  );
</script>

<div class="ui:@container ui:w-full">
  <div
    class={cn(
      'ui:grid ui:w-full',
      showMore ? 'ui:grid-cols-6' : 'ui:grid-cols-5',
      isLarge
        ? cn('ui:gap-2.5', showMore ? 'ui:@max-[480px]:grid-cols-3' : 'ui:@max-[480px]:grid-cols-2')
        : 'ui:gap-1.5 ui:@max-[380px]:grid-cols-3'
    )}
    role="group"
    aria-label={label}
    data-testid={testId}
  >
    {#each choices as choice (choice.type)}
      {@const ChoiceIcon = choice.icon}
      <button
        type="button"
        class={tileClass}
        data-testid={testId ? `${testId}-${choice.type}` : undefined}
        onclick={() => onSelect(choice.type)}
      >
        <ChoiceIcon size={isLarge ? 18 : 16} class="custom ui:text-muted-foreground" />
        <span class={labelClass}>{choice.label}</span>
        {#if choice.isNew && newLabel}
          <span
            class="ui:bg-primary ui:text-primary-foreground ui:absolute ui:-top-[7px] ui:left-1/2 ui:-translate-x-1/2 ui:rounded-full ui:px-1.5 ui:text-[9px] ui:leading-[14px] ui:font-semibold"
            >{newLabel}</span
          >
        {/if}
      </button>
    {/each}

    {#if showMore}
      <CatalogPopover
        choices={moreChoices}
        label={moreLabel}
        {searchLabel}
        {noResultsLabel}
        {newLabel}
        {comingSoonLabel}
        side="bottom"
        class="ui:flex"
        testId={testId ? `${testId}-more` : undefined}
        {onSelect}
      >
        {#snippet trigger({ open, toggle })}
          <button
            type="button"
            class={cn(tileClass, 'ui:w-full', open && 'ui:border-primary/55 ui:bg-primary/5')}
            aria-expanded={open}
            data-testid={testId ? `${testId}-more` : undefined}
            onclick={toggle}
          >
            <LayoutGridIcon size={isLarge ? 18 : 16} class="custom ui:text-muted-foreground" />
            <span class={labelClass}>{moreLabel}</span>
          </button>
        {/snippet}
      </CatalogPopover>
    {/if}
  </div>
</div>
