<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import type { AudienceBulkAction } from '$features/org/utils/types';

  interface Props {
    selectedCount: number;
    /** Total matching the current filters — the ceiling for "select all matching". */
    totalMatching: number;
    /** True once the admin escalated from tick-boxes to the whole filtered set. */
    allMatchingSelected: boolean;
    isApplying?: boolean;
    onSelectAllMatching: () => void;
    onClearSelection: () => void;
    onOpenAssign: () => void;
    onAction: (action: AudienceBulkAction) => void;
  }

  let {
    selectedCount,
    totalMatching,
    allMatchingSelected,
    isApplying = false,
    onSelectAllMatching,
    onClearSelection,
    onOpenAssign,
    onAction
  }: Props = $props();

  const effectiveCount = $derived(allMatchingSelected ? totalMatching : selectedCount);
  // Only worth offering when it would actually widen the selection.
  const canSelectAllMatching = $derived(!allMatchingSelected && totalMatching > selectedCount);
  // Archive leads: it is reversible, it frees a seat, and it is the right answer
  // to almost every "remove them" instinct. Delete sits last and apart.
  const actions: AudienceBulkAction[] = ['archive', 'deactivate', 'reactivate', 'unarchive'];
</script>

<div class="flex w-full flex-col gap-2 rounded-md border px-4 py-2 md:flex-row md:items-center">
  <div class="flex flex-1 flex-wrap items-center gap-2">
    <span class="text-sm font-medium">
      {allMatchingSelected
        ? $t('audience.bulk.all_matching_selected', { count: totalMatching })
        : $t('audience.selected_count', { count: selectedCount })}
    </span>

    {#if canSelectAllMatching}
      <Button
        testId="audience-bulk-select-all-matching"
        variant="ghost"
        size="sm"
        onclick={onSelectAllMatching}
        disabled={isApplying}
      >
        {$t('audience.bulk.select_all_matching', { count: totalMatching })}
      </Button>
    {/if}

    <Button variant="ghost" size="sm" onclick={onClearSelection} disabled={isApplying}>
      {$t('audience.bulk.clear_selection')}
    </Button>
  </div>

  <div class="flex items-center gap-2">
    <Button variant="secondary" size="sm" onclick={onOpenAssign} disabled={isApplying || allMatchingSelected}>
      {$t('audience.assign_courses')}
    </Button>

    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Button {...props} testId="audience-bulk-actions" variant="secondary" size="sm" disabled={isApplying}>
            {$t('audience.bulk.actions')}
            <ChevronDownIcon class="size-4" aria-hidden="true" />
          </Button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" class="w-52">
        {#each actions as action (action)}
          <DropdownMenu.Item onSelect={() => onAction(action)}>
            {$t(`audience.bulk.action.${action}`, { count: effectiveCount })}
          </DropdownMenu.Item>
        {/each}
        <DropdownMenu.Separator />
        <DropdownMenu.Item class="ui:text-destructive ui:focus:text-destructive" onSelect={() => onAction('delete')}>
          {$t('audience.bulk.action.delete', { count: effectiveCount })}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>
</div>
