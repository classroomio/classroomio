<script lang="ts">
  import * as Popover from '@cio/ui/base/popover';
  import FilterIcon from '@lucide/svelte/icons/filter';
  import { t } from '$lib/utils/functions/translations';
  import { STATUS_FILTER_OPTIONS, ENROLLMENT_FILTER_OPTIONS, COMPLETION_FILTER_OPTIONS } from '../utils/constants';
  import type { StatusFilter, EnrollmentFilter, CompletionFilter } from '../utils/types';

  interface Props {
    status: StatusFilter;
    enrollment: EnrollmentFilter;
    completion: CompletionFilter;
    onStatusChange: (val: StatusFilter) => void;
    onEnrollmentChange: (val: EnrollmentFilter) => void;
    onCompletionChange: (val: CompletionFilter) => void;
    onClearAll: () => void;
  }

  let {
    status = 'all',
    enrollment = 'all',
    completion = 'all',
    onStatusChange,
    onEnrollmentChange,
    onCompletionChange,
    onClearAll
  }: Props = $props();

  let open = $state(false);

  const activeCount = $derived(
    (status !== 'all' ? 1 : 0) + (enrollment !== 'all' ? 1 : 0) + (completion !== 'all' ? 1 : 0)
  );
</script>

<Popover.Root bind:open>
  <Popover.Trigger
    class="border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition focus-visible:ring-1 focus-visible:outline-none"
  >
    <FilterIcon class="text-muted-foreground size-3.5" />
    <span>{$t('learningPath.listing.filters.title')}</span>
    {#if activeCount > 0}
      <span
        class="bg-primary text-primary-foreground inline-flex size-4.5 items-center justify-center rounded-full text-[10.5px] font-bold"
      >
        {activeCount}
      </span>
    {/if}
  </Popover.Trigger>

  <Popover.Content
    class="bg-popover text-popover-foreground border-border w-[320px] rounded-xl border p-4 shadow-lg"
    align="start"
  >
    <div class="border-border mb-3 flex items-center justify-between border-b pb-2.5">
      <span class="text-foreground text-sm font-semibold">
        {$t('learningPath.listing.filters.title')}
      </span>
      {#if activeCount > 0}
        <button
          type="button"
          class="text-primary cursor-pointer text-xs font-medium hover:underline"
          onclick={onClearAll}
        >
          {$t('learningPath.listing.filters.clear_all')}
        </button>
      {/if}
    </div>

    <div class="space-y-3.5">
      <!-- Status Group -->
      <div>
        <div class="text-muted-foreground mb-1.5 text-[11px] font-bold tracking-wider uppercase">
          {$t('learningPath.listing.filters.group_status')}
        </div>
        <div class="flex flex-wrap gap-1.5">
          {#each STATUS_FILTER_OPTIONS as option (option.id)}
            {@const isSelected = status === option.id}
            <button
              type="button"
              class="h-7 cursor-pointer rounded-full px-3 text-xs font-medium transition {isSelected
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'border-input bg-card text-muted-foreground hover:bg-accent hover:text-foreground border'}"
              onclick={() => onStatusChange(option.id)}
            >
              {$t(option.labelKey) || option.fallback}
            </button>
          {/each}
        </div>
      </div>

      <!-- Enrollment Group -->
      <div>
        <div class="text-muted-foreground mb-1.5 text-[11px] font-bold tracking-wider uppercase">
          {$t('learningPath.listing.filters.group_enrollment')}
        </div>
        <div class="flex flex-wrap gap-1.5">
          {#each ENROLLMENT_FILTER_OPTIONS as option (option.id)}
            {@const isSelected = enrollment === option.id}
            <button
              type="button"
              class="h-7 cursor-pointer rounded-full px-3 text-xs font-medium transition {isSelected
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'border-input bg-card text-muted-foreground hover:bg-accent hover:text-foreground border'}"
              onclick={() => onEnrollmentChange(option.id)}
            >
              {$t(option.labelKey) || option.fallback}
            </button>
          {/each}
        </div>
      </div>

      <!-- Completion Rate Group -->
      <div>
        <div class="text-muted-foreground mb-1.5 text-[11px] font-bold tracking-wider uppercase">
          {$t('learningPath.listing.filters.group_completion')}
        </div>
        <div class="flex flex-wrap gap-1.5">
          {#each COMPLETION_FILTER_OPTIONS as option (option.id)}
            {@const isSelected = completion === option.id}
            <button
              type="button"
              class="h-7 cursor-pointer rounded-full px-3 text-xs font-medium transition {isSelected
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'border-input bg-card text-muted-foreground hover:bg-accent hover:text-foreground border'}"
              onclick={() => onCompletionChange(option.id)}
            >
              {$t(option.labelKey) || option.fallback}
            </button>
          {/each}
        </div>
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
