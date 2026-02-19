<script lang="ts">
  import * as Popover from '@cio/ui/base/popover';
  import { Button } from '@cio/ui/base/button';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { t } from '$lib/utils/functions/translations';
  import type { OrganizationTagGroups } from '$features/tag/utils/types';

  interface Props {
    tagGroups?: OrganizationTagGroups;
    selectedTagIds?: string[];
    open?: boolean;
    onTagToggle?: (tagId: string) => void;
  }

  let { tagGroups = [], selectedTagIds = [], open = $bindable(false), onTagToggle = () => {} }: Props = $props();
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        type="button"
        variant="outline"
        size="icon"
        aria-label={$t('course.navItem.settings.tags.add')}
      >
        <PlusIcon size={16} />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content align="start" class="w-[420px] p-3">
    <div class="space-y-4">
      <p class="text-sm font-semibold">{$t('course.navItem.settings.tags.popover_title')}</p>
      {#if !tagGroups.length}
        <p class="ui:text-muted-foreground text-sm">{$t('course.navItem.settings.tags.empty_groups')}</p>
      {:else}
        {#each tagGroups as group (group.id)}
          {#if group.tags.length > 0}
            <div class="space-y-2">
              <p class="ui:text-muted-foreground text-xs font-semibold uppercase">{group.name}</p>
              <div class="flex flex-wrap gap-2">
                {#each group.tags as tag (tag.id)}
                  <Button
                    size="sm"
                    variant={selectedTagIds.includes(tag.id) ? 'secondary' : 'outline'}
                    onclick={() => onTagToggle(tag.id)}
                  >
                    <span
                      class="inline-block h-2 w-2 rounded-full border"
                      style={`background-color: ${tag.color}`}
                      aria-hidden="true"
                    ></span>
                    <span>{tag.name}</span>
                  </Button>
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      {/if}
    </div>
  </Popover.Content>
</Popover.Root>
