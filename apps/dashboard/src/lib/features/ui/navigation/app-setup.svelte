<script lang="ts">
  import * as HoverCard from '@cio/ui/base/hover-card';
  import { Button } from '@cio/ui/base/button';
  import RefreshCcwIcon from '@lucide/svelte/icons/refresh-ccw';
  import CircleIcon from '@lucide/svelte/icons/circle';
  import SetupProgress from '$features/setup/components/setup-progress.svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
  import { calculateProgress, setupProgressApi } from '$features/setup/api/setup-progress.svelte';

  function handleRefresh() {
    if ($currentOrg.siteName) {
      setupProgressApi.fetchSetupProgress($currentOrg.siteName);
    }
  }

  const setupList = $derived(
    setupProgressApi.setupList.map((item) => {
      if (item.id === 'profile') {
        return {
          ...item,
          is_completed: !$profile.avatarUrl?.includes('avatars/avatar.png')
        };
      }
      return item;
    })
  );
  const progressPercentage = $derived(calculateProgress(setupList));
</script>

{#if progressPercentage < 100}
  <HoverCard.Root openDelay={200}>
    <HoverCard.Trigger class="hidden md:block">
      <SetupProgress size="small" setupItems={setupList} />
    </HoverCard.Trigger>
    <HoverCard.Content class="hidden w-80 md:block">
      {#if $currentOrg.id}
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold">{$t('setup.your_checklist')}</h4>

            <Button variant="secondary" size="icon" onclick={handleRefresh} disabled={setupProgressApi.isLoading}>
              <RefreshCcwIcon class="size-3 {setupProgressApi.isLoading ? 'animate-spin' : ''}" />
            </Button>
          </div>

          {#each setupList as item}
            <div class="flex items-center gap-2 text-sm">
              {#if item.is_completed}
                <BadgeCheckIcon class="custom text-green-600! size-4 shrink-0 opacity-50" />
                <span class="text-muted-foreground line-through opacity-50">{$t(item.title)}</span>
              {:else}
                <CircleIcon class="size-4 shrink-0 text-gray-400" />
                <span>{$t(item.title)}</span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </HoverCard.Content>
  </HoverCard.Root>
{/if}
