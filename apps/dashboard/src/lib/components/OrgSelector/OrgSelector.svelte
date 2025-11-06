<script lang="ts">
  import { goto } from '$app/navigation';
  import * as Popover from '@cio/ui/base/popover';
  import * as Command from '@cio/ui/base/command';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';

  import { newOrgModal } from '../Org/store';
  import { PLAN_NAMES } from '@cio/utils/plans';
  import { setTheme } from '$lib/utils/functions/theme';
  import type { CurrentOrg } from '$lib/utils/types/org';
  import { currentOrg, orgs, currentOrgPath, currentOrgPlan } from '$lib/utils/store/org';

  import Plan from '$lib/components/Chip/Plan.svelte';
  import TextChip from '$lib/components/Chip/Text.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import OrgSelectorItem from './OrgSelectorItem.svelte';

  interface Props {
    canAddOrg?: boolean;
  }

  let { canAddOrg = true }: Props = $props();

  let open = $state(false);

  function handleAddOrg() {
    open = false;
    $newOrgModal.open = true;
  }

  function onClick(org: CurrentOrg) {
    localStorage.setItem('classroomio_org_sitename', org.siteName);
    currentOrg.set(org);

    setTheme(org.theme);
    goto($currentOrgPath);

    open = false;
  }

  // todo: set command shortcuts
</script>

<div class="flex w-full items-center">
  <Popover.Root bind:open>
    <Popover.Trigger class="w-full rounded-md p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-800">
      {#if $currentOrg.name}
        <button
          class="flex w-full items-center justify-between gap-2"
          onclick={(e) => {
            e.stopPropagation();
            open = !open;
          }}
        >
          {#if $currentOrg.avatar_url && $currentOrg.name}
            <Avatar
              src={$currentOrg.avatar_url}
              name={$currentOrg.name}
              shape="rounded-md"
              width="w-10"
              height="h-10"
            />
          {:else if $currentOrg.shortName}
            <TextChip size="md" value={$currentOrg.shortName} className="bg-primary-200 dark:text-black font-medium" />
          {/if}
          <div class="flex w-full max-w-[219px] cursor-pointer items-center justify-between">
            <div class="flex flex-col items-start">
              <p class="mb-1 truncate whitespace-nowrap text-sm font-medium dark:text-white">
                {$currentOrg.name}
              </p>

              <Plan name={$currentOrgPlan ? PLAN_NAMES[$currentOrgPlan.plan_name] : PLAN_NAMES.BASIC} />
            </div>

            <ChevronsUpDownIcon size={16} />
          </div>
        </button>
      {:else}
        <div class="h-[30px] w-[219px]">
          <Skeleton class="h-full w-full" />
        </div>
      {/if}
    </Popover.Trigger>

    {#if canAddOrg}
      <Popover.Content class="w-[200px] p-0" side="right" align="start">
        <Command.Root>
          <Command.List>
            <Command.Group heading="Teams">
              <div class="">
                {#each $orgs as org}
                  <OrgSelectorItem
                    size="md"
                    active={$currentOrg.id === org.id}
                    avatar={org.avatar_url}
                    avatarText={org.shortName}
                    text={org.name}
                    hasDivider={true}
                    onClick={() => onClick(org)}
                  />
                {/each}

                <OrgSelectorItem disabled={true} size="" text="Add Team" onClick={handleAddOrg} />
              </div>
            </Command.Group>
          </Command.List>
        </Command.Root>
      </Popover.Content>
    {/if}
  </Popover.Root>
</div>
