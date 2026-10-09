<script lang="ts">
  import * as Popover from '@cio/ui/base/popover';
  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Input } from '@cio/ui/base/input';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import type { SubmissionFilterOption } from '$features/course/utils/submission-board-filters';

  interface Props {
    label: string;
    searchPlaceholder: string;
    selectAllLabel: string;
    clearLabel: string;
    onlyLabel: string;
    emptyLabel: string;
    options: SubmissionFilterOption[];
    selectedIds: string[];
    testId: string;
    onSelectedIdsChange: (ids: string[]) => void;
  }

  let {
    label,
    searchPlaceholder,
    selectAllLabel,
    clearLabel,
    onlyLabel,
    emptyLabel,
    options,
    selectedIds,
    testId,
    onSelectedIdsChange
  }: Props = $props();

  let open = $state(false);
  let search = $state('');

  const visibleOptions = $derived(
    options.filter((option) => option.label.toLowerCase().includes(search.trim().toLowerCase()))
  );

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;

    if (!isOpen) {
      search = '';
    }
  }

  function toggle(id: string, checked: boolean) {
    if (checked) {
      onSelectedIdsChange([...selectedIds, id]);
      return;
    }

    onSelectedIdsChange(selectedIds.filter((selectedId) => selectedId !== id));
  }

  function selectAll() {
    const nextIds = [...selectedIds];
    for (const option of visibleOptions) {
      if (nextIds.includes(option.id)) continue;

      nextIds.push(option.id);
    }
    onSelectedIdsChange(nextIds);
  }
</script>

<Popover.Root {open} onOpenChange={handleOpenChange}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button {...props} type="button" variant="outline" size="sm" {testId}>
        {label}
        {#if selectedIds.length > 0}
          <span
            class="ui:bg-foreground ui:text-background inline-flex min-w-5 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-semibold"
          >
            {selectedIds.length}
          </span>
        {/if}
        <ChevronDownIcon class="size-3.5" />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content align="start" class="ui:bg-popover ui:text-popover-foreground ui:border-border w-80 border p-0">
    <div class="ui:border-border space-y-2 border-b p-3">
      <Input bind:value={search} placeholder={searchPlaceholder} />
      <div class="flex items-center justify-between gap-2">
        <button type="button" class="ui:text-primary text-xs font-medium" onclick={selectAll}>
          {selectAllLabel}
        </button>
        <button
          type="button"
          class="ui:text-muted-foreground ui:hover:text-foreground text-xs disabled:opacity-40"
          disabled={selectedIds.length === 0}
          onclick={() => onSelectedIdsChange([])}
        >
          {clearLabel}
        </button>
      </div>
    </div>
    <div class="max-h-64 space-y-1 overflow-y-auto p-2">
      {#if visibleOptions.length === 0}
        <p class="ui:text-muted-foreground px-2 py-3 text-sm">{emptyLabel}</p>
      {:else}
        {#each visibleOptions as option (option.id)}
          <div class="ui:hover:bg-muted flex items-center gap-2 rounded-md px-2 py-1.5">
            <Checkbox
              checked={selectedIds.includes(option.id)}
              onCheckedChange={(checked) => toggle(option.id, checked === true)}
            />
            <span class="min-w-0 flex-1 truncate text-sm">{option.label}</span>
            <span class="ui:text-muted-foreground text-xs">{option.count}</span>
            <button
              type="button"
              class="ui:text-primary text-xs font-medium"
              onclick={() => onSelectedIdsChange([option.id])}
            >
              {onlyLabel}
            </button>
          </div>
        {/each}
      {/if}
    </div>
  </Popover.Content>
</Popover.Root>
