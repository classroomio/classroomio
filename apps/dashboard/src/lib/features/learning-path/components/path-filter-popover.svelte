<script lang="ts">
  import {
    PATH_SORT_OPTIONS,
    DEFAULT_PATH_SORT,
    DEFAULT_SORT_ORDER,
    type PathSortBy,
    type PathSortOrder
  } from '../utils/constants';
  import { Button } from '@cio/ui/base/button';
  import { SortPopover } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import type { StatusFilter } from '../utils/types';

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
          <Button
            type="button"
            size="sm"
            variant={statusFilter === 'all' ? 'secondary' : 'outline'}
            onclick={() => setStatus('all')}
          >
            {$t('learningPath.listing.filters.all')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={statusFilter === 'published' ? 'secondary' : 'outline'}
            onclick={() => setStatus('published')}
          >
            {$t('courses.course_card.published')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={statusFilter === 'unpublished' ? 'secondary' : 'outline'}
            onclick={() => setStatus('unpublished')}
          >
            {$t('courses.course_card.unpublished')}
          </Button>
        </div>
      </div>

      <!-- Enrollment Filter -->
      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">
          {$t('learningPath.listing.filters.group_enrollment')}
        </p>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={enrollmentFilter === 'all' ? 'secondary' : 'outline'}
            onclick={() => setEnrollment('all')}
          >
            {$t('learningPath.listing.filters.all')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={enrollmentFilter === 'none' ? 'secondary' : 'outline'}
            onclick={() => setEnrollment('none')}
          >
            {$t('learningPath.listing.filters.no_learners')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={enrollmentFilter === '1-49' ? 'secondary' : 'outline'}
            onclick={() => setEnrollment('1-49')}
          >
            {$t('learningPath.listing.filters.enrollment_1_49')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={enrollmentFilter === '50+' ? 'secondary' : 'outline'}
            onclick={() => setEnrollment('50+')}
          >
            {$t('learningPath.listing.filters.enrollment_50_plus')}
          </Button>
        </div>
      </div>

      <!-- Completion Rate Filter -->
      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">
          {$t('learningPath.listing.filters.group_completion')}
        </p>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={completionFilter === 'all' ? 'secondary' : 'outline'}
            onclick={() => setCompletion('all')}
          >
            {$t('learningPath.listing.filters.all')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={completionFilter === 'low' ? 'secondary' : 'outline'}
            onclick={() => setCompletion('low')}
          >
            {$t('learningPath.listing.filters.low')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={completionFilter === 'medium' ? 'secondary' : 'outline'}
            onclick={() => setCompletion('medium')}
          >
            {$t('learningPath.listing.filters.medium')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={completionFilter === 'high' ? 'secondary' : 'outline'}
            onclick={() => setCompletion('high')}
          >
            {$t('learningPath.listing.filters.high')}
          </Button>
        </div>
      </div>
    </div>
  {/snippet}
</SortPopover>
