<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import { Badge } from '@cio/ui/base/badge';
  import * as Select from '@cio/ui/base/select';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import type { Tutor } from './types';

  interface Props {
    tutors: Tutor[];
    selectedIds: string[];
    isLoading: boolean;
  }

  let { tutors, selectedIds = $bindable(), isLoading }: Props = $props();

  const selectedTutors = $derived(tutors.filter((t) => selectedIds.includes(t.id.toString())));
</script>

<div class="rounded-md border p-4">
  <p class="mb-2 text-base font-semibold">{$t('course.navItem.people.invite_modal.invite')}</p>

  <Select.Root type="multiple" bind:value={selectedIds} disabled={isLoading}>
    <Select.Trigger class="w-full">
      <div>
        {#if selectedTutors.length > 0}
          <div class="flex flex-wrap gap-1">
            {#each selectedTutors as tutor}
              <Badge variant="secondary" class="flex items-center gap-1">
                {tutor.text}
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onclick={(e) => {
                    e.stopPropagation();
                    selectedIds = selectedIds.filter((id) => id !== tutor.id.toString());
                  }}
                  class="h-5 w-5 rounded-sm hover:bg-gray-200"
                  aria-label={`Remove ${tutor.text}`}
                >
                  <XIcon size={14} />
                </Button>
              </Badge>
            {/each}
          </div>
        {:else}
          {$t('course.navItem.people.invite_modal.select')}
        {/if}
      </div>
    </Select.Trigger>
    <Select.Content>
      {#each tutors as tutor}
        <Select.Item value={tutor.id.toString()}>
          {tutor.text}
        </Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
  {#if isLoading}
    <div class="mt-2 flex items-center gap-2">
      <Spinner class="h-4 w-4" />
      <span class="text-sm">{$t('course.navItem.people.invite_modal.loading')}</span>
    </div>
  {:else}
    <span class="mt-2 block text-sm">
      {$t('course.navItem.people.invite_modal.to_add')}
      <a href={`/org/${$currentOrg.siteName}/settings/teams`} class="ui:text-primary underline">
        {$t('course.navItem.people.invite_modal.go_to')}
      </a>
    </span>
  {/if}
</div>
