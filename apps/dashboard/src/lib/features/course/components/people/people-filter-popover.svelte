<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { SortPopover } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { ROLES } from '$lib/utils/constants/roles';
  import type { ListPeopleQuery } from '$features/course/utils/types';
  import type { TCoursePeopleActivityWindow, TCoursePeopleEnrolledWindow } from '@cio/utils/validation/course/people';

  interface FilterOption {
    label: string;
    patch: Partial<ListPeopleQuery>;
  }

  interface FilterGroup {
    label: string;
    options: FilterOption[];
  }

  interface Props {
    query: ListPeopleQuery;
    activeFilterCount: number;
    isLoading?: boolean;
    onFilterChange: (patch: Partial<ListPeopleQuery>) => void;
    onClearFilters: () => void;
    onSortChange: (sortBy: ListPeopleQuery['sortBy'], sortOrder: ListPeopleQuery['sortOrder']) => void;
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
    { label: $t('course.navItem.people.name'), value: 'name' },
    { label: $t('course.navItem.people.role'), value: 'role' },
    { label: $t('course.navItem.people.progress'), value: 'progress' },
    { label: $t('course.navItem.people.last_login_at'), value: 'lastLogin' },
    { label: $t('course.navItem.people.enrolled_at'), value: 'enrolledAt' },
    { label: $t('course.navItem.people.certificate_earned'), value: 'certificate' }
  ]);

  const activityWindows: { value: TCoursePeopleActivityWindow; label: string }[] = $derived([
    { value: '7d', label: $t('course.navItem.people.window.7d') },
    { value: '30d', label: $t('course.navItem.people.window.30d') },
    { value: '90d', label: $t('course.navItem.people.window.90d') },
    { value: '180d', label: $t('course.navItem.people.window.180d') },
    { value: 'never', label: $t('course.navItem.people.window.never') }
  ]);

  const enrolledWindows: { value: TCoursePeopleEnrolledWindow; label: string }[] = $derived([
    { value: '7d', label: $t('course.navItem.people.window.7d') },
    { value: '30d', label: $t('course.navItem.people.window.30d') },
    { value: '90d', label: $t('course.navItem.people.window.90d') },
    { value: '180d', label: $t('course.navItem.people.window.180d') }
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
      label: $t('course.navItem.people.filter.progress'),
      options: [
        { label: $t('course.navItem.people.not_started'), patch: { progress: 'not_started' as const } },
        { label: $t('course.navItem.people.filter.in_progress'), patch: { progress: 'in_progress' as const } },
        { label: $t('course.navItem.people.filter.completed'), patch: { progress: 'completed' as const } }
      ]
    },
    {
      label: $t('course.navItem.people.filter.certificate'),
      options: [
        { label: $t('course.navItem.people.filter.earned'), patch: { certificateEarned: true } },
        { label: $t('course.navItem.people.filter.not_earned'), patch: { certificateEarned: false } }
      ]
    },
    {
      label: $t('course.navItem.people.filter.no_login_since'),
      options: activityWindows.map((window) => ({ label: window.label, patch: { lastLoginBefore: window.value } }))
    },
    {
      label: $t('course.navItem.people.filter.joined_within'),
      options: enrolledWindows.map((window) => ({ label: window.label, patch: { enrolledWithin: window.value } }))
    }
  ]);

  function isSelected(option: FilterOption) {
    return Object.entries(option.patch).every(([key, value]) => query[key as keyof ListPeopleQuery] === value);
  }

  function toggle(option: FilterOption) {
    onFilterChange(isSelected(option) ? clearPatch(option.patch) : option.patch);
  }

  function clearPatch(patch: Partial<ListPeopleQuery>): Partial<ListPeopleQuery> {
    return Object.fromEntries(Object.keys(patch).map((key) => [key, undefined])) as Partial<ListPeopleQuery>;
  }
</script>

<SortPopover
  {sortOptions}
  bind:sortKey={localSortKey}
  bind:selectedOrder={localSortOrder}
  hasActiveFilters={activeFilterCount > 0}
  isFiltering={isLoading}
  title={$t('course.navItem.people.filter.title')}
  {onClearFilters}
  onSortKeyChange={(key) => onSortChange(key as ListPeopleQuery['sortBy'], localSortOrder)}
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
