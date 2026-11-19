<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { SortPopover } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { ROLES } from '$lib/utils/constants/roles';
  import type { ListCohortPeopleQuery } from '$features/cohort/utils/types';
  import type { TCohortPeopleActivityWindow } from '@cio/utils/validation/cohort/people';

  interface FilterOption {
    label: string;
    patch: Partial<ListCohortPeopleQuery>;
  }

  interface FilterGroup {
    label: string;
    options: FilterOption[];
  }

  interface Props {
    query: ListCohortPeopleQuery;
    activeFilterCount: number;
    isLoading?: boolean;
    onFilterChange: (patch: Partial<ListCohortPeopleQuery>) => void;
    onClearFilters: () => void;
    onSortChange: (sortBy: ListCohortPeopleQuery['sortBy'], sortOrder: ListCohortPeopleQuery['sortOrder']) => void;
  }

  let { query, activeFilterCount, isLoading = false, onFilterChange, onClearFilters, onSortChange }: Props = $props();

  // SortPopover binds these, so the URL cannot be the only holder of them.
  let localSortKey = $state(query.sortBy);
  let localSortOrder = $state(query.sortOrder);

  $effect(() => {
    localSortKey = query.sortBy;
    localSortOrder = query.sortOrder;
  });

  const sortOptions = $derived([
    { label: $t('cohorts.people.name'), value: 'name' },
    { label: $t('course.navItem.people.role'), value: 'role' },
    { label: $t('cohorts.people.joined'), value: 'joined' },
    { label: $t('course.navItem.people.last_login_at'), value: 'lastLogin' }
  ]);

  const activityWindows: { value: TCohortPeopleActivityWindow; label: string }[] = $derived([
    { value: '7d', label: $t('course.navItem.people.window.7d') },
    { value: '30d', label: $t('course.navItem.people.window.30d') },
    { value: '90d', label: $t('course.navItem.people.window.90d') },
    { value: '180d', label: $t('course.navItem.people.window.180d') },
    { value: 'never', label: $t('course.navItem.people.window.never') }
  ]);

  const groups: FilterGroup[] = $derived([
    {
      label: $t('course.navItem.people.filter.role'),
      options: [
        { label: $t('course.navItem.people.filter.all_roles'), patch: { roleId: undefined } },
        ...ROLES.filter((role) => role.value !== undefined).map((role) => ({
          label: $t(role.label),
          patch: { roleId: role.value as number }
        }))
      ]
    },
    {
      label: $t('course.navItem.people.filter.no_login_since'),
      options: activityWindows.map((window) => ({ label: window.label, patch: { lastLoginBefore: window.value } }))
    }
  ]);

  function isSelected(option: FilterOption) {
    return Object.entries(option.patch).every(([key, value]) => query[key as keyof ListCohortPeopleQuery] === value);
  }

  function toggle(option: FilterOption) {
    onFilterChange(isSelected(option) ? clearPatch(option.patch) : option.patch);
  }

  function clearPatch(patch: Partial<ListCohortPeopleQuery>): Partial<ListCohortPeopleQuery> {
    return Object.fromEntries(Object.keys(patch).map((key) => [key, undefined])) as Partial<ListCohortPeopleQuery>;
  }
</script>

<SortPopover
  {sortOptions}
  bind:sortKey={localSortKey}
  bind:selectedOrder={localSortOrder}
  hasActiveFilters={activeFilterCount > 0}
  isFiltering={isLoading}
  title={$t('cohorts.people.filter_title')}
  {onClearFilters}
  onSortKeyChange={(key) => onSortChange(key as ListCohortPeopleQuery['sortBy'], localSortOrder)}
  onOrderChange={(order) => onSortChange(localSortKey, order)}
>
  {#snippet additionalContent()}
    {#each groups as group (group.label)}
      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">{group.label}</p>
        <div class="flex flex-wrap gap-2">
          {#each group.options as option (option.label)}
            <Button
              type="button"
              size="sm"
              variant={isSelected(option) ? 'secondary' : 'outline'}
              onclick={() => toggle(option)}
            >
              {option.label}
            </Button>
          {/each}
        </div>
      </div>
    {/each}
  {/snippet}
</SortPopover>
