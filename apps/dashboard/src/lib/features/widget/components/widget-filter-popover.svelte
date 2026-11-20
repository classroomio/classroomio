<script lang="ts">
  import * as Popover from '@cio/ui/base/popover';
  import * as ToggleGroup from '@cio/ui/base/toggle-group';
  import { Button } from '@cio/ui/base/button';
  import FilterIcon from '@lucide/svelte/icons/filter';
  import { t } from '$lib/utils/functions/translations';
  import type { TWidgetLayoutType, TWidgetListStatus, TWidgetSelectionMode } from '@cio/utils/validation/widget';
  import { WIDGET_LAYOUT_TYPE_VALUES, WIDGET_LIST_STATUS_VALUES } from '@cio/utils/validation/widget';

  interface FilterOption<T extends string> {
    value: T;
    label: string;
  }

  interface Props {
    mode?: 'active' | 'archived';
    statuses?: TWidgetListStatus[];
    layoutTypes?: TWidgetLayoutType[];
    selectionModes?: TWidgetSelectionMode[];
    activeFilterCount?: number;
    onStatusesChange?: (statuses: TWidgetListStatus[]) => void;
    onLayoutTypesChange?: (layoutTypes: TWidgetLayoutType[]) => void;
    onSelectionModesChange?: (modes: TWidgetSelectionMode[]) => void;
    onToggleStatus?: (status: TWidgetListStatus, checked: boolean) => void;
    onToggleLayoutType?: (layoutType: TWidgetLayoutType, checked: boolean) => void;
    onToggleSelectionMode?: (mode: TWidgetSelectionMode, checked: boolean) => void;
    onClearFilters?: () => void | Promise<void>;
  }

  let {
    mode = 'active',
    statuses = [],
    layoutTypes = [],
    selectionModes = [],
    activeFilterCount = 0,
    onStatusesChange,
    onLayoutTypesChange,
    onSelectionModesChange,
    onToggleStatus,
    onToggleLayoutType,
    onToggleSelectionMode,
    onClearFilters = () => {}
  }: Props = $props();

  const showsStatusGroup = $derived(mode !== 'archived');

  const statusOptions = $derived<FilterOption<TWidgetListStatus>[]>(
    WIDGET_LIST_STATUS_VALUES.map((value) => ({
      value,
      label: $t(`widgets.status.${value.toLowerCase()}`)
    }))
  );

  const layoutTypeOptions = $derived<FilterOption<TWidgetLayoutType>[]>(
    WIDGET_LAYOUT_TYPE_VALUES.map((value) => ({
      value,
      label: $t(`widgets.layout.${value}`)
    }))
  );

  const selectionModeOptions = $derived<FilterOption<TWidgetSelectionMode>[]>(
    (['manual', 'published'] as const).map((value) => ({
      value,
      label: $t(`widgets.selection.${value}`)
    }))
  );

  function handleStatusesChange(nextValues: string[]) {
    const nextStatuses = nextValues as TWidgetListStatus[];
    if (onStatusesChange) {
      onStatusesChange(nextStatuses);
      return;
    }

    if (onToggleStatus) {
      for (const val of WIDGET_LIST_STATUS_VALUES) {
        const wasSelected = statuses.includes(val);
        const isSelected = nextStatuses.includes(val);
        if (wasSelected !== isSelected) {
          onToggleStatus(val, isSelected);
        }
      }
    }
  }

  function handleLayoutTypesChange(nextValues: string[]) {
    const nextLayoutTypes = nextValues as TWidgetLayoutType[];
    if (onLayoutTypesChange) {
      onLayoutTypesChange(nextLayoutTypes);
      return;
    }

    if (onToggleLayoutType) {
      for (const val of WIDGET_LAYOUT_TYPE_VALUES) {
        const wasSelected = layoutTypes.includes(val);
        const isSelected = nextLayoutTypes.includes(val);
        if (wasSelected !== isSelected) {
          onToggleLayoutType(val, isSelected);
        }
      }
    }
  }

  function handleSelectionModesChange(nextValues: string[]) {
    const nextModes = nextValues as TWidgetSelectionMode[];
    if (onSelectionModesChange) {
      onSelectionModesChange(nextModes);
      return;
    }

    if (onToggleSelectionMode) {
      for (const val of ['manual', 'published'] as const) {
        const wasSelected = selectionModes.includes(val);
        const isSelected = nextModes.includes(val);
        if (wasSelected !== isSelected) {
          onToggleSelectionMode(val, isSelected);
        }
      }
    }
  }
</script>

{#snippet filterGroup(
  label: string,
  options: FilterOption<string>[],
  selected: string[],
  onChange: (values: string[]) => void
)}
  <div class="space-y-2">
    <p class="ui:text-muted-foreground text-xs font-semibold uppercase">{label}</p>
    <ToggleGroup.Root
      type="multiple"
      value={selected}
      variant="outline"
      size="sm"
      spacing={2}
      class="w-full flex-wrap justify-start"
      onValueChange={(values) => onChange(values ?? [])}
    >
      {#each options as option (option.value)}
        <ToggleGroup.Item value={option.value} class="px-2.5">
          {option.label}
        </ToggleGroup.Item>
      {/each}
    </ToggleGroup.Root>
  </div>
{/snippet}

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props })}
      <div class="relative">
        <Button
          {...props}
          variant="outline"
          size="sm"
          testId="widgets-filter-trigger"
          aria-label={$t('widgets.filters.filter')}
        >
          <FilterIcon size={16} />
          <span class="hidden md:inline">{$t('widgets.filters.filter')}</span>
        </Button>
        {#if activeFilterCount > 0}
          <span
            class="ui:bg-primary absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white"
            aria-hidden="true"
          ></span>
        {/if}
      </div>
    {/snippet}
  </Popover.Trigger>

  <Popover.Content align="end" class="w-[360px] p-3">
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-2">
        <p class="text-sm font-semibold">{$t('widgets.filters.popover_title')}</p>
        <Button variant="link" class="h-auto p-0" onclick={onClearFilters} disabled={activeFilterCount === 0}>
          {$t('widgets.filters.clear_all')}
        </Button>
      </div>

      {#if showsStatusGroup}
        {@render filterGroup($t('widgets.filters.status'), statusOptions, statuses, handleStatusesChange)}
      {/if}

      {@render filterGroup($t('widgets.filters.layout_type'), layoutTypeOptions, layoutTypes, handleLayoutTypesChange)}

      {@render filterGroup(
        $t('widgets.filters.selection_mode'),
        selectionModeOptions,
        selectionModes,
        handleSelectionModesChange
      )}
    </div>
  </Popover.Content>
</Popover.Root>
