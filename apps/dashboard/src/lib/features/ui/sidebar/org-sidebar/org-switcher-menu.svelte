<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import CheckIcon from '@lucide/svelte/icons/check';
  import PlusIcon from '@lucide/svelte/icons/plus';

  import type { AccountOrg } from '$features/app/types';
  import { groupOrgMemberships } from '$features/org/utils/org-memberships';
  import { getOrgSiteHost, openLearnerOrg, switchToManagedOrg } from '$features/org/utils/org-navigation';
  import ComingSoon from '$features/ui/coming-soon.svelte';
  import { shortenName } from '$lib/utils/functions/string';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, managedOrgs, orgs } from '$lib/utils/store/org';

  function rootIdFor(org: Pick<AccountOrg, 'id' | 'parentOrganizationId'>): string {
    return org.parentOrganizationId ?? org.id;
  }

  const accountRootId = $derived(rootIdFor($currentOrg));
  const accountWorkspaces = $derived($managedOrgs.filter((org) => rootIdFor(org) === accountRootId));
  const otherOrgs = $derived($managedOrgs.filter((org) => rootIdFor(org) !== accountRootId));
  const learningOrgs = $derived(groupOrgMemberships($orgs).learning);

  function selectManagedOrg(org: AccountOrg) {
    if (org.id === $currentOrg.id) return;

    switchToManagedOrg(org);
  }

  function selectLearnerOrg(org: AccountOrg) {
    void openLearnerOrg(org).catch((error) => {
      console.error('openLearnerOrg error:', error);
    });
  }
</script>

{#snippet managedOrgItem(org: AccountOrg)}
  <DropdownMenu.Item
    onSelect={() => selectManagedOrg(org)}
    class="gap-2 p-2"
    data-testid="org-switcher-item-{org.siteName}"
  >
    <Avatar.Root class="flex size-8 items-center justify-center rounded-lg">
      <Avatar.Image src={org.avatarUrl} alt={org.name} />
      <Avatar.Fallback class="rounded-lg">{shortenName(org.name)}</Avatar.Fallback>
    </Avatar.Root>

    <span class="flex-1 truncate">{org.name}</span>

    {#if org.id === $currentOrg.id}
      <CheckIcon class="size-4" aria-label={$t('account.switcher.current')} />
    {/if}
  </DropdownMenu.Item>
{/snippet}

<DropdownMenu.Label class="ui:text-muted-foreground text-xs">{$t('account.switcher.your_account')}</DropdownMenu.Label>

{#each accountWorkspaces as org (org.id)}
  {@render managedOrgItem(org)}
{/each}

{#if otherOrgs.length > 0}
  <DropdownMenu.Separator />
  <DropdownMenu.Label class="ui:text-muted-foreground text-xs">
    {$t('account.switcher.other_organizations')}
  </DropdownMenu.Label>
  {#each otherOrgs as org (org.id)}
    {@render managedOrgItem(org)}
  {/each}
{/if}

{#if learningOrgs.length > 0}
  <DropdownMenu.Separator />
  <DropdownMenu.Label class="ui:text-muted-foreground text-xs">{$t('account.switcher.learning')}</DropdownMenu.Label>
  {#each learningOrgs as org (org.id)}
    {@const host = getOrgSiteHost(org)}
    <DropdownMenu.Item
      onSelect={() => selectLearnerOrg(org)}
      class="gap-2 p-2"
      aria-label={$t('org_chooser.open_academy', { name: org.name, host })}
      data-testid="org-switcher-learning-{org.siteName}"
    >
      <Avatar.Root class="flex size-8 items-center justify-center rounded-lg">
        <Avatar.Image src={org.avatarUrl} alt={org.name} />
        <Avatar.Fallback class="rounded-lg">{shortenName(org.name)}</Avatar.Fallback>
      </Avatar.Root>

      <span class="grid flex-1 leading-tight">
        <span class="truncate">{org.name}</span>
        <span class="ui:text-muted-foreground truncate text-xs">{host}</span>
      </span>

      <ArrowUpRightIcon class="ui:text-muted-foreground size-4" aria-hidden="true" />
    </DropdownMenu.Item>
  {/each}
{/if}

<DropdownMenu.Separator />

<DropdownMenu.Item class="cursor-not-allowed gap-2 p-2 opacity-50">
  <div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
    <PlusIcon class="size-4" />
  </div>
  <div class="ui:text-muted-foreground font-normal">{$t('account.switcher.add_organization')}</div>

  <ComingSoon />
</DropdownMenu.Item>
