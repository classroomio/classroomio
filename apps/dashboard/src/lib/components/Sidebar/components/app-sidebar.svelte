<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Button } from '$src/base/button';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';

  import type { AppSidebar } from './types';
  import { isFreePlan } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { useSidebar } from '@cio/ui/base/sidebar';

  import NavMain from './nav-main.svelte';
  import NavUser from './nav-user.svelte';
  import OrgSwitcher from './org-switcher.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { openUpgradeModal } from '$lib/utils/functions/org';

  let { data, canAddOrg = true, ref = $bindable(null), collapsible = 'icon', ...restProps }: AppSidebar = $props();

  const sidebar = useSidebar();
</script>

<Sidebar.Root {collapsible} {...restProps} class="ui:inset-y-12 h-[calc(100vh-48px)]">
  <Sidebar.Header>
    <OrgSwitcher {canAddOrg} />
  </Sidebar.Header>

  <Sidebar.Content>
    <NavMain items={data.navMain} />
  </Sidebar.Content>

  {#if $isFreePlan}
    <Sidebar.Content>
      {#if sidebar.open || sidebar.isMobile}
        <div
          class="border-primary-700 mx-4 mt-2 flex flex-col items-center justify-center gap-4 rounded-md border px-2 py-6 text-center transition-all ease-in-out hover:scale-95"
        >
          <Button
            data-sidebar="upgrade-trigger"
            data-slot="upgrade-trigger"
            variant="ghost"
            size="icon"
            class=" w-full text-center"
            type="button"
            onclick={openUpgradeModal}
          >
            <SparklesIcon class="size-6" />
            <span class="sr-only">{$t('org_navigation.upgrade')}</span>
          </Button>
          <span class="flex flex-col gap-1">
            <p class="text-base font-semibold">{$t('org_navigation.early_adopter')}</p>
            <p class="text-xs">{$t('org_navigation.unlock')}</p>
          </span>
          <PrimaryButton label={$t('org_navigation.upgrade')} onClick={openUpgradeModal} className="font-normal" />
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
          <SparklesIcon class="size-4" />
          <span class="sr-only">{$t('org_navigation.upgrade')}</span>
        </Button>
      {/if}
    </Sidebar.Content>
  {/if}

  {#if data.user}
    <Sidebar.Footer>
      <NavUser user={data.user} />
    </Sidebar.Footer>
  {/if}

  <Sidebar.Rail />
</Sidebar.Root>
