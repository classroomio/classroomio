<script lang="ts">
  import { COURSE_SORT_OPTIONS } from '../utils/constants';
  import * as Popover from '@cio/ui/base/popover';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import FilterIcon from '@lucide/svelte/icons/filter';
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
    selectedId?: string;
    selectedTags?: string[];
    tagGroups?: FilterTagGroup[];
    sortOptions?: readonly SortOption[];
    isFiltering?: boolean;
    onToggleTag?: (tagSlug: string, checked: boolean) => void;
    onClearFilters?: () => void | Promise<void>;
  }

  let {
    selectedId = $bindable('0'),
    selectedTags = [],
    tagGroups = [],
    sortOptions = COURSE_SORT_OPTIONS,
    isFiltering = false,
    onToggleTag = () => {},
    onClearFilters = () => {}
  }: Props = $props();

  let isOpen = $state(false);

  const hasActiveFilters = $derived(selectedId !== '0' || selectedTags.length > 0);
  const hasActiveTagFilters = $derived(selectedTags.length > 0);

  function isTagSelected(tagSlug: string) {
    return selectedTags.includes(tagSlug);
  }
</script>

<Popover.Root bind:open={isOpen}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <div class="relative">
        <IconButton {...props} aria-label={$t('courses.tag_filters.filter')} tooltip={$t('courses.tag_filters.filter')}>
          {#if isFiltering}
            <Spinner class="size-4" />
          {:else}
            <FilterIcon size={16} />
          {/if}
        </IconButton>
        {#if hasActiveTagFilters}
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
        <p class="text-sm font-semibold">{$t('courses.tag_filters.popover_title')}</p>
        <Button variant="link" class="h-auto p-0" onclick={onClearFilters} disabled={!hasActiveFilters}>
          {$t('courses.tag_filters.clear_all')}
        </Button>
      </div>

      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">
          {$t('courses.tag_filters.sort')}
        </p>
        <div class="flex flex-wrap gap-2">
          {#each sortOptions as option (option.value)}
            <Button
              type="button"
              size="sm"
              variant={selectedId === option.value ? 'secondary' : 'outline'}
              onclick={() => (selectedId = option.value)}
            >
              {$t(option.label)}
            </Button>
          {/each}
        </div>
      </div>

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
    </div>
  </Popover.Content>
</Popover.Root>
