<script lang="ts">
  import * as Popover from '@cio/ui/base/popover';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { t } from '$lib/utils/functions/translations';
  import FilterIcon from '@lucide/svelte/icons/filter';
  import type { FilterPublished } from '../utils/widget-editor-utils';
  import type { WidgetDetail } from '../utils/types';

  interface Props {
    activeFilterCount: number;
    filterPublished: FilterPublished;
    filterCourseType: string;
    filterTagSlugs: string[];
    availableTags: WidgetDetail['availableTags'];
    courseTypeOptions: { value: string; label: string }[];
    onClearAll: () => void;
    onFilterPublishedChange: (value: FilterPublished) => void;
    onFilterCourseTypeChange: (value: string) => void;
    onFilterTagSlugsChange: (slugs: string[]) => void;
  }

  let {
    activeFilterCount,
    filterPublished,
    filterCourseType,
    filterTagSlugs,
    availableTags,
    courseTypeOptions,
    onClearAll,
    onFilterPublishedChange,
    onFilterCourseTypeChange,
    onFilterTagSlugsChange
  }: Props = $props();
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props })}
      <button
        {...props}
        type="button"
        class="ui:border-border ui:bg-background ui:text-foreground ui:hover:bg-muted focus-visible:ui:ring-primary/40 relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-sm shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
        aria-label={$t('courses.tag_filters.filter')}
      >
        <FilterIcon class="size-3.5 shrink-0" />
        <span class="hidden text-xs sm:inline">{$t('courses.tag_filters.filter')}</span>
        {#if activeFilterCount > 0}
          <span
            class="ui:bg-foreground ui:text-background inline-flex min-w-[18px] items-center justify-center rounded-full px-1 py-0.5 text-[10px] leading-none font-semibold"
          >
            {activeFilterCount}
          </span>
        {/if}
      </button>
    {/snippet}
  </Popover.Trigger>

  <Popover.Content
    align="end"
    class="ui:bg-popover ui:text-popover-foreground ui:border-border w-72 border p-0 shadow-lg"
  >
    <div class="ui:border-border flex items-center justify-between border-b px-4 py-3">
      <p class="text-sm font-semibold">{$t('courses.tag_filters.popover_title')}</p>
      <button
        type="button"
        class="ui:text-muted-foreground ui:hover:text-foreground text-xs disabled:pointer-events-none disabled:opacity-40"
        disabled={activeFilterCount === 0}
        onclick={onClearAll}
      >
        {$t('courses.tag_filters.clear_all')}
      </button>
    </div>

    <div class="space-y-4 px-4 py-3">
      <!-- Status -->
      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
          {$t('widgets.filter.status')}
        </p>
        <div class="flex flex-wrap gap-1.5">
          {#each [['all', $t('widgets.filter.all')], ['published', $t('widgets.status.published')], ['unpublished', $t('widgets.filter.unpublished')]] as [val, label] (val)}
            <button
              type="button"
              class="rounded-full border px-3 py-1 text-xs transition-colors {filterPublished === val
                ? 'ui:border-foreground ui:bg-foreground ui:text-background'
                : 'ui:border-border ui:bg-background ui:text-foreground ui:hover:bg-muted'}"
              onclick={() => onFilterPublishedChange(val as FilterPublished)}
            >
              {label}
            </button>
          {/each}
        </div>
      </div>

      <!-- Course type -->
      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
          {$t('widgets.filter.course_type')}
        </p>
        <div class="flex flex-wrap gap-1.5">
          <button
            type="button"
            class="rounded-full border px-3 py-1 text-xs transition-colors {filterCourseType === 'all'
              ? 'ui:border-foreground ui:bg-foreground ui:text-background'
              : 'ui:border-border ui:bg-background ui:text-foreground ui:hover:bg-muted'}"
            onclick={() => onFilterCourseTypeChange('all')}
          >
            {$t('widgets.filter.all')}
          </button>
          {#each courseTypeOptions as opt (opt.value)}
            <button
              type="button"
              class="rounded-full border px-3 py-1 text-xs transition-colors {filterCourseType === opt.value
                ? 'ui:border-foreground ui:bg-foreground ui:text-background'
                : 'ui:border-border ui:bg-background ui:text-foreground ui:hover:bg-muted'}"
              onclick={() => onFilterCourseTypeChange(opt.value)}
            >
              {opt.label}
            </button>
          {/each}
        </div>
      </div>

      <!-- Tags -->
      {#if availableTags.length > 0}
        <div class="space-y-2">
          <p class="ui:text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
            {$t('courses.tag_filters.tags')}
          </p>
          <div class="max-h-48 space-y-1 overflow-y-auto">
            {#each availableTags as tag (tag.id)}
              <label class="ui:hover:bg-muted flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5">
                <Checkbox
                  checked={filterTagSlugs.includes(tag.slug)}
                  onCheckedChange={(checked) => {
                    onFilterTagSlugsChange(
                      checked ? [...filterTagSlugs, tag.slug] : filterTagSlugs.filter((s) => s !== tag.slug)
                    );
                  }}
                />
                <span class="inline-block h-2 w-2 shrink-0 rounded-full" style="background-color: {tag.color}"></span>
                <span class="text-xs">{tag.name}</span>
              </label>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </Popover.Content>
</Popover.Root>
