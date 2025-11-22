<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Button } from '$src/base/button';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import { t } from '$lib/utils/functions/translations';
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import { isFreePlan } from '$lib/utils/store/org';
  import { useSidebar } from '@cio/ui/base/sidebar';

  const sidebar = useSidebar();
</script>

{#if $isFreePlan}
  <Sidebar.Content>
    {#if sidebar.open || sidebar.isMobile}
      <div
        class="mx-4 mt-2 flex flex-col items-center justify-center gap-4 rounded-md border border-blue-600 px-2 py-6 text-center transition-all ease-in-out hover:border-blue-800"
      >
        <SparklesIcon class="my-3 size-6" />
        <span class="flex flex-col gap-1">
          <p class="text-base font-semibold">{$t('org_navigation.early_adopter')}</p>
          <p class="text-xs">{$t('org_navigation.unlock')}</p>
        </span>
        <Button
          data-sidebar="upgrade-trigger"
          data-slot="upgrade-trigger"
          class="font-normal"
          type="button"
          onclick={openUpgradeModal}
        >
          <SparklesIcon class="custom size-4" />
          {$t('org_navigation.upgrade')}
        </Button>
      </div>
    {:else}
      <Button
        data-sidebar="upgrade-trigger"
        data-slot="upgrade-trigger"
        variant="ghost"
        size="icon"
        class=" flex w-full items-center justify-center"
        type="button"
        onclick={openUpgradeModal}
      >
        <SparklesIcon class="custom size-4" />
        <span class="sr-only">{$t('org_navigation.upgrade')}</span>
      </Button>
    {/if}
  </Sidebar.Content>
{/if}
