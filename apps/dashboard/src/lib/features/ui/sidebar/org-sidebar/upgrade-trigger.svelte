<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { CircularProgress } from '@cio/ui/custom/circular-progress';
  import { t } from '$lib/utils/functions/translations';
  import { openUpgradeModal } from '$lib/utils/store/upgrade-modal';
  import { currentOrgMaxAudience, isFreePlan, studentUsage } from '$lib/utils/store/org';

  const USAGE_WARNING_PERCENT = 80;

  const studentCount = $derived($studentUsage?.used ?? 0);
  const studentLimit = $derived($studentUsage?.limit ?? $currentOrgMaxAudience);
  const usagePercent = $derived.by(() => {
    if (!(studentLimit > 0) || !Number.isFinite(studentLimit)) return 0;

    return Math.min(100, (studentCount / studentLimit) * 100);
  });
  const isNearLimit = $derived(usagePercent >= USAGE_WARNING_PERCENT);
  const progressClass = $derived(isNearLimit ? 'stroke-red-500' : 'stroke-black dark:stroke-white');
  const countClass = $derived(isNearLimit ? 'text-red-500' : 'text-black dark:text-white');
  const upgradeLabel = $derived($t('org_navigation.upgrade_label'));
  const upgradeCount = $derived($t('org_navigation.upgrade_count', { studentCount, studentLimit }));
</script>

{#if $isFreePlan}

  <Sidebar.Menu>
    <Sidebar.MenuItem>
      <Sidebar.MenuButton
        data-sidebar="upgrade-trigger"
        data-slot="upgrade-trigger"
        data-testid="org-sidebar-upgrade"
        type="button"
        tooltipContent="{upgradeLabel} {upgradeCount}"
        class="h-10 rounded-full ui:bg-background px-3 shadow-sm"
        onclick={openUpgradeModal}
      >
        <CircularProgress
          value={usagePercent}
          size={16}
          strokeWidth={2}
          {progressClass}
          trackClass="stroke-black/15 dark:stroke-white/20"
        />
        <span class="truncate font-medium ui:group-data-[collapsible=icon]:hidden">{upgradeLabel}</span>
        <span class={['ml-auto tabular-nums text-xs font-medium ui:group-data-[collapsible=icon]:hidden', countClass]}>
          {upgradeCount}
        </span>
      </Sidebar.MenuButton>
    </Sidebar.MenuItem>
  </Sidebar.Menu>
{/if}
