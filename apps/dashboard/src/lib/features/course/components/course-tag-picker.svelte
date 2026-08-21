<script lang="ts">
  import { ActionPopover } from '@cio/ui/custom/action-popover';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import type { OrganizationTagGroups } from '$features/tag/utils/types';
  import TagFormModal from '$features/tag/components/tag-form-modal.svelte';
  import { PlusIcon } from '@lucide/svelte';

  interface Props {
    tagGroups?: OrganizationTagGroups;
    selectedTagIds?: string[];
    open?: boolean;
    onTagToggle?: (tagId: string) => void;
    onTagCreated?: (tagId: string) => void;
  }

  let {
    tagGroups = [],
    selectedTagIds = [],
    open = $bindable(false),
    onTagToggle = () => {},
    onTagCreated
  }: Props = $props();

  let isTagModalOpen = $state(false);
  let searchQuery = $state('');

  const hasNoTags = $derived(tagGroups.length > 0 && tagGroups.every((group) => group.tags.length === 0));

  const filteredTagGroups = $derived.by(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return tagGroups;
    }

    return tagGroups
      .map((group) => {
        const matchingTags = group.tags.filter((tag) => tag.name.toLowerCase().includes(query));

        return {
          ...group,
          tags: matchingTags
        };
      })
      .filter((group) => group.tags.length > 0);
  });

  const hasNoMatchingTags = $derived(searchQuery.trim().length > 0 && filteredTagGroups.length === 0);
</script>

<ActionPopover
  bind:open
  searchPlaceholder={$t('course.navItem.settings.tags.search_placeholder')}
  bind:searchQuery
  buttonText={$t('course.navItem.settings.tags.create_tag')}
  onAction={() => {
    isTagModalOpen = true;
  }}
>
  {#if !tagGroups.length}
    <p class="ui:text-muted-foreground text-sm">
      {$t('course.navItem.settings.tags.empty_groups')}
    </p>
  {:else if hasNoTags}
    <div class="space-y-2">
      <p class="ui:text-muted-foreground text-xs">No Tags found</p>
    </div>
  {:else if hasNoMatchingTags}
    <div class="space-y-2">
      <p class="ui:text-muted-foreground text-xs">{$t('course.navItem.settings.tags.no_results')}</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each filteredTagGroups as group (group.id)}
        {#if group.tags.length > 0}
          <div class="space-y-2">
            <p class="ui:text-muted-foreground text-xs font-semibold uppercase">
              {group.name}
            </p>
            <div class="flex flex-wrap gap-2">
              {#each group.tags as tag (tag.id)}
                <Button
                  size="xs"
                  variant={selectedTagIds.includes(tag.id) ? 'secondary' : 'outline'}
                  onclick={() => onTagToggle(tag.id)}
                >
                  <PlusIcon />
                  <span>{tag.name}</span>
                </Button>
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</ActionPopover>

<TagFormModal bind:open={isTagModalOpen} onCreated={(tag) => onTagCreated?.(tag.id)} />
