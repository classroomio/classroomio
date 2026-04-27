<script lang="ts">
  import {
    COURSE_SORT_OPTIONS,
    DEFAULT_COURSE_SORT,
    DEFAULT_SORT_ORDER,
    type CourseSortBy,
    type CourseSortOrder
  } from '../utils/constants';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Button } from '@cio/ui/base/button';
  import { SortPopover } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  interface FilterTag {
    id: string;
    slug: string;
    name: string;
    color: string;
    courseCount?: number;
  }

  interface FilterTagGroup {
    id: string;
    name: string;
    description?: string | null;
    tags: FilterTag[];
  }

  type SortOption = (typeof COURSE_SORT_OPTIONS)[number];

  interface Props {
    sortKey?: CourseSortBy;
    selectedOrder?: CourseSortOrder;
    selectedTags?: string[];
    tagGroups?: FilterTagGroup[];
    sortOptions?: readonly SortOption[];
    isFiltering?: boolean;
    hasActiveFilters?: boolean;
    publishedStatus?: 'all' | 'published' | 'unpublished';
    courseType?: string;
    courseTypeOptions?: { value: string; label: string }[];
    onToggleTag?: (tagSlug: string, checked: boolean) => void;
    onClearFilters?: () => void | Promise<void>;
    onPublishedStatusChange?: (status: 'all' | 'published' | 'unpublished') => void;
    onCourseTypeChange?: (type: string) => void;
  }

  let {
    sortKey = $bindable(DEFAULT_COURSE_SORT),
    selectedOrder = $bindable(DEFAULT_SORT_ORDER),
    selectedTags = [],
    tagGroups = [],
    sortOptions = COURSE_SORT_OPTIONS,
    isFiltering = false,
    hasActiveFilters: hasActiveFiltersOverride = undefined,
    publishedStatus = $bindable('all'),
    courseType = $bindable('all'),
    courseTypeOptions = [],
    onToggleTag = () => {},
    onClearFilters = () => {},
    onPublishedStatusChange,
    onCourseTypeChange
  }: Props = $props();

  const translatedSortOptions = $derived(
    sortOptions.map((option) => ({ value: option.value, label: $t(option.label) }))
  );

  const hasActiveFilters = $derived(
    hasActiveFiltersOverride !== undefined
      ? hasActiveFiltersOverride
      : sortKey !== DEFAULT_COURSE_SORT ||
          selectedOrder !== DEFAULT_SORT_ORDER ||
          selectedTags.length > 0 ||
          publishedStatus !== 'all' ||
          courseType !== 'all'
  );

  function isTagSelected(tagSlug: string) {
    return selectedTags.includes(tagSlug);
  }

  function setPublishedStatus(status: 'all' | 'published' | 'unpublished') {
    publishedStatus = status;
    onPublishedStatusChange?.(status);
  }

  function setCourseType(type: string) {
    courseType = type;
    onCourseTypeChange?.(type);
  }
</script>

<SortPopover
  sortOptions={translatedSortOptions}
  bind:sortKey
  bind:selectedOrder
  defaultSortKey={DEFAULT_COURSE_SORT}
  defaultSortOrder={DEFAULT_SORT_ORDER}
  {isFiltering}
  {hasActiveFilters}
  {onClearFilters}
>
  {#snippet additionalContent()}
    <div class="space-y-3">
      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">{$t('widgets.filter.status')}</p>
        <div class="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={publishedStatus === 'all' ? 'secondary' : 'outline'}
            onclick={() => setPublishedStatus('all')}>{$t('widgets.filter.all')}</Button
          >
          <Button
            type="button"
            size="sm"
            variant={publishedStatus === 'published' ? 'secondary' : 'outline'}
            onclick={() => setPublishedStatus('published')}>{$t('widgets.status.published')}</Button
          >
          <Button
            type="button"
            size="sm"
            variant={publishedStatus === 'unpublished' ? 'secondary' : 'outline'}
            onclick={() => setPublishedStatus('unpublished')}>{$t('widgets.filter.unpublished')}</Button
          >
        </div>
      </div>

      {#if courseTypeOptions.length > 0}
        <div class="space-y-2">
          <p class="ui:text-muted-foreground text-xs font-semibold uppercase">{$t('widgets.filter.course_type')}</p>
          <div class="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={courseType === 'all' ? 'secondary' : 'outline'}
              onclick={() => setCourseType('all')}>{$t('widgets.filter.all')}</Button
            >
            {#each courseTypeOptions as opt (opt.value)}
              <Button
                type="button"
                size="sm"
                variant={courseType === opt.value ? 'secondary' : 'outline'}
                onclick={() => setCourseType(opt.value)}>{opt.label}</Button
              >
            {/each}
          </div>
        </div>
      {/if}

      {#if tagGroups.length > 0}
        <div class="space-y-2">
          <p class="ui:text-muted-foreground text-xs font-semibold uppercase">{$t('courses.tag_filters.tags')}</p>
          <div class="max-h-[320px] space-y-4 overflow-y-auto pr-1">
            {#each tagGroups as group (group.id)}
              {#if group.tags.length > 0}
                <div class="space-y-2">
                  <div class="space-y-1">
                    <p class="text-sm font-medium">{group.name}</p>
                    {#if group.description}
                      <p class="ui:text-muted-foreground text-xs">{group.description}</p>
                    {/if}
                  </div>
                  <div class="space-y-2">
                    {#each group.tags as tag (tag.id)}
                      <label
                        class="hover:ui:bg-muted/30 flex cursor-pointer items-center justify-between rounded-md border px-3 py-2"
                      >
                        <div class="flex items-center gap-2">
                          <Checkbox
                            checked={isTagSelected(tag.slug)}
                            onCheckedChange={(checked) => onToggleTag(tag.slug, Boolean(checked))}
                          />
                          <span
                            class="inline-block h-2.5 w-2.5 rounded-full border"
                            style={`background-color: ${tag.color}`}
                            aria-hidden="true"
                          ></span>
                          <span class="text-sm">{tag.name}</span>
                        </div>
                        {#if tag.courseCount}
                          <span class="ui:text-muted-foreground text-xs">{tag.courseCount}</span>
                        {/if}
                      </label>
                    {/each}
                  </div>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {:else if tagGroups.length === 0 && courseTypeOptions.length === 0 && publishedStatus === undefined}
        <p class="ui:text-muted-foreground text-sm">{$t('courses.tag_filters.empty_tags')}</p>
      {/if}
    </div>
  {/snippet}
</SortPopover>
