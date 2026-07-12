<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Progress } from '@cio/ui/base/progress';
  import RocketIcon from '@lucide/svelte/icons/rocket';
  import { t } from '$lib/utils/functions/translations';
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import { currentOrgMaxAudience, isFreePlan, studentUsage } from '$lib/utils/store/org';
  import { useSidebar } from '@cio/ui/base/sidebar';

  const sidebar = useSidebar();

  const studentCount = $derived($studentUsage?.used ?? 0);
  const studentLimit = $derived($studentUsage?.limit ?? $currentOrgMaxAudience);
  const studentsLeft = $derived(Math.max(0, studentLimit - studentCount));
</script>

{#if $isFreePlan}
  <div class="animate-icon">
    {#if sidebar.open && !sidebar.isMobile}
      <div class="animate-gradient-border mx-2 flex flex-col gap-3 rounded-md p-3 transition-all ease-in-out">
        <div class="flex items-center gap-2">
          <span class="ui:bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full">
            <RocketIcon class="rocket-launch size-4" color="var(--primary)" />
          </span>
          <p class="text-sm">{$t('org_navigation.early_adopter')}</p>
        </div>

        <Progress value={studentCount} max={studentLimit} variant="default" />

        <div class="flex items-center justify-between">
          <span class="ui:text-muted-foreground text-xs">
            {$t('org_navigation.upgrade_students', { studentCount, studentLimit })}
          </span>
          <span class="ui:text-muted-foreground text-xs">
            {$t('org_navigation.upgrade_left', { count: studentsLeft })}
          </span>
        </div>

        <Button
          data-sidebar="upgrade-trigger"
          data-slot="upgrade-trigger"
          variant="outline"
          class="w-full"
          type="button"
          onclick={openUpgradeModal}
        >
          {$t('org_navigation.upgrade_now')}
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
