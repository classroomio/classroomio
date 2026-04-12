<script lang="ts">
  import {
    COURSE_SORT_OPTIONS,
    DEFAULT_COURSE_SORT,
    DEFAULT_SORT_ORDER,
    type CourseSortBy,
    type CourseSortOrder
  } from '../utils/constants';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { SortPopover } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  interface FilterTag {
    id: string;
    slug: string;
    name: string;
    color: string;
    courseCount: number;
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
    onToggleTag?: (tagSlug: string, checked: boolean) => void;
    onClearFilters?: () => void | Promise<void>;
  }

  let {
    sortKey = $bindable(DEFAULT_COURSE_SORT),
    selectedOrder = $bindable(DEFAULT_SORT_ORDER),
    selectedTags = [],
    tagGroups = [],
    sortOptions = COURSE_SORT_OPTIONS,
    isFiltering = false,
    onToggleTag = () => {},
    onClearFilters = () => {}
  }: Props = $props();

  const translatedSortOptions = $derived(
    sortOptions.map((option) => ({ value: option.value, label: $t(option.label) }))
  );

  const hasActiveFilters = $derived(
    sortKey !== DEFAULT_COURSE_SORT || selectedOrder !== DEFAULT_SORT_ORDER || selectedTags.length > 0
  );

  function isTagSelected(tagSlug: string) {
    return selectedTags.includes(tagSlug);
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
      <p class="ui:text-muted-foreground text-xs font-semibold uppercase">{$t('courses.tag_filters.tags')}</p>
      {#if tagGroups.length === 0}
        <p class="ui:text-muted-foreground text-sm">{$t('courses.tag_filters.empty_tags')}</p>
      {:else}
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
                      <span class="ui:text-muted-foreground text-xs">{tag.courseCount}</span>
                    </label>
                  {/each}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  {/snippet}
</SortPopover>
