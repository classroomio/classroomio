<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import RocketIcon from '@lucide/svelte/icons/rocket';
  import { t } from '$lib/utils/functions/translations';
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import { isFreePlan } from '$lib/utils/store/org';
  import { useSidebar } from '@cio/ui/base/sidebar';

  const sidebar = useSidebar();
</script>

{#if $isFreePlan}
  <div class="animate-icon">
    {#if sidebar.open && !sidebar.isMobile}
      <div
        class="animate-gradient-border mx-2 flex flex-col items-center justify-center gap-4 rounded-md px-2 py-6 text-center transition-all ease-in-out"
      >
        <RocketIcon class="rocket-launch my-3 size-6" color="var(--primary)" />
        <span class="flex flex-col gap-1">
          <p class="text-base font-medium">{$t('org_navigation.early_adopter')}</p>
          <p class="ui:text-muted-foreground text-xs">{$t('org_navigation.unlock')}</p>
        </span>
        <Button data-sidebar="upgrade-trigger" data-slot="upgrade-trigger" type="button" onclick={openUpgradeModal}>
          <RocketIcon class="rocket-launch custom size-4" />
          {$t('org_navigation.upgrade')}
        </Button>
      </div>
    {:else}
      <Button
        data-sidebar="upgrade-trigger"
        data-slot="upgrade-trigger"
        variant="ghost"
        size="icon"
        class="rocket-launch"
        type="button"
        onclick={openUpgradeModal}
      >
        <RocketIcon class="custom size-4" />
        <span class="sr-only">{$t('org_navigation.upgrade')}</span>
      </Button>
    {/if}
  </div>
{/if}
