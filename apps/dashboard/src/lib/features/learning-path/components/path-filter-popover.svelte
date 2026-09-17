<script lang="ts">
  import {
    PATH_SORT_OPTIONS,
    DEFAULT_PATH_SORT,
    DEFAULT_SORT_ORDER,
    STATUS_FILTER_OPTIONS,
    ENROLLMENT_FILTER_OPTIONS,
    COMPLETION_FILTER_OPTIONS,
    type PathSortBy,
    type PathSortOrder
  } from '../utils/constants';
  import { Button } from '@cio/ui/base/button';
  import { SortPopover } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import type { StatusFilter, EnrollmentFilter, CompletionFilter } from '../utils/types';

  interface Props {
    sortKey?: PathSortBy;
    selectedOrder?: PathSortOrder;
    statusFilter?: StatusFilter;
    enrollmentFilter?: EnrollmentFilter;
    completionFilter?: CompletionFilter;
    isFiltering?: boolean;
    hasActiveFilters?: boolean;
    onStatusChange?: (status: StatusFilter) => void;
    onEnrollmentChange?: (enrollment: EnrollmentFilter) => void;
    onCompletionChange?: (completion: CompletionFilter) => void;
    onClearFilters?: () => void | Promise<void>;
  }

  let {
    sortKey = $bindable(DEFAULT_PATH_SORT),
    selectedOrder = $bindable(DEFAULT_SORT_ORDER),
    statusFilter = $bindable('all'),
    enrollmentFilter = $bindable('all'),
    completionFilter = $bindable('all'),
    isFiltering = false,
    hasActiveFilters: hasActiveFiltersOverride = undefined,
    onStatusChange = () => {},
    onEnrollmentChange = () => {},
    onCompletionChange = () => {},
    onClearFilters = () => {}
  }: Props = $props();

  const translatedSortOptions = $derived(
    PATH_SORT_OPTIONS.map((option) => ({ value: option.value, label: $t(option.label) }))
  );

  const hasActiveFilters = $derived(
    hasActiveFiltersOverride !== undefined
      ? hasActiveFiltersOverride
      : sortKey !== DEFAULT_PATH_SORT ||
          selectedOrder !== DEFAULT_SORT_ORDER ||
          statusFilter !== 'all' ||
          enrollmentFilter !== 'all' ||
          completionFilter !== 'all'
  );

  function setStatus(status: StatusFilter) {
    statusFilter = status;
    onStatusChange?.(status);
  }

  function setEnrollment(enrollment: EnrollmentFilter) {
    enrollmentFilter = enrollment;
    onEnrollmentChange?.(enrollment);
  }

  function setCompletion(completion: CompletionFilter) {
    completionFilter = completion;
    onCompletionChange?.(completion);
  }
</script>

<SortPopover
  sortOptions={translatedSortOptions}
  bind:sortKey
  bind:selectedOrder
  defaultSortKey={DEFAULT_PATH_SORT}
  defaultSortOrder={DEFAULT_SORT_ORDER}
  {isFiltering}
  {hasActiveFilters}
  {onClearFilters}
>
  {#snippet additionalContent()}
    <div class="space-y-4">
      <!-- Status Filter -->
      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">
          {$t('learningPath.listing.filters.group_status')}
        </p>
        <div class="flex flex-wrap gap-2">
          {#each STATUS_FILTER_OPTIONS as option (option.id)}
            <Button
              type="button"
              size="sm"
              variant={statusFilter === option.id ? 'secondary' : 'outline'}
              onclick={() => setStatus(option.id)}
            >
              {$t(option.labelKey)}
            </Button>
          {/each}
        </div>
      </div>

      <!-- Enrollment Filter -->
      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">
          {$t('learningPath.listing.filters.group_enrollment')}
        </p>
        <div class="flex flex-wrap gap-2">
          {#each ENROLLMENT_FILTER_OPTIONS as option (option.id)}
            <Button
              type="button"
              size="sm"
              variant={enrollmentFilter === option.id ? 'secondary' : 'outline'}
              onclick={() => setEnrollment(option.id)}
            >
              {$t(option.labelKey)}
            </Button>
          {/each}
        </div>
      </div>

      <!-- Completion Rate Filter -->
      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">
          {$t('learningPath.listing.filters.group_completion')}
        </p>
        <div class="flex flex-wrap gap-2">
          {#each COMPLETION_FILTER_OPTIONS as option (option.id)}
            <Button
              type="button"
              size="sm"
              variant={completionFilter === option.id ? 'secondary' : 'outline'}
              onclick={() => setCompletion(option.id)}
            >
              {$t(option.labelKey)}
            </Button>
          {/each}
        </div>
      </div>
    </div>
  {/snippet}
</SortPopover>
