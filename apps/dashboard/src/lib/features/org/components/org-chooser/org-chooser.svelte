<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as Avatar from '@cio/ui/base/avatar';
  import { Button } from '@cio/ui/base/button';
  import * as Card from '@cio/ui/base/card';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { MachineTrainingLine } from '@cio/ui/custom/animation';
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import PlusIcon from '@lucide/svelte/icons/plus';

  import type { AccountOrg } from '$features/app/types';
  import { appInitApi } from '$features/app/init.svelte';
  import { pendingInvitesApi } from '$features/invite/api/pending-invites.svelte';
  import type { PendingOrgInviteItem } from '$features/invite/utils/types';
  import { ROLE_LABEL } from '$lib/utils/constants/roles';
  import { ROUTE } from '$lib/utils/constants/routes';
  import { logout } from '$lib/utils/functions/logout';
  import { shortenName } from '$lib/utils/functions/string';
  import { t } from '$lib/utils/functions/translations';
  import { authClient } from '$lib/utils/services/auth/client';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { profile } from '$lib/utils/store/user';

  import { groupOrgMemberships } from '../../utils/org-memberships';
  import {
    getOrgSiteHost,
    invalidatePendingHandoff,
    openLearnerOrg,
    switchToManagedOrg
  } from '../../utils/org-navigation';
  import OrgChooserRow from './org-chooser-row.svelte';

  const SKELETON_ROWS = [0, 1, 2];

  const organizations = $derived(appInitApi.data?.success ? appInitApi.data.organizations : []);
  const memberships = $derived(groupOrgMemberships(organizations));
  const isReady = $derived(appInitApi.isInitializedAndReady);
  const canCreateOrg = $derived(isReady && memberships.managed.length === 0);
  const pendingInvites = $derived(pendingInvitesApi.invites);

  let openingOrgId = $state<string | null>(null);

  onMount(() => {
    void pendingInvitesApi.fetchOnce();
  });

  function roleLabel(roleId?: number | null): string {
    const key = ROLE_LABEL[roleId as keyof typeof ROLE_LABEL];

    return key ? $t(key) : '';
  }

  function openManagedOrg(org: AccountOrg) {
    capturePosthogEvent('org_chooser_selected', { role: 'manager' });
    switchToManagedOrg(org);
  }

  async function openAcademy(org: AccountOrg) {
    capturePosthogEvent('org_chooser_selected', { role: 'learner' });
    openingOrgId = org.id;

    try {
      await openLearnerOrg(org);
    } finally {
      openingOrgId = null;
    }
  }

  async function acceptInvite(invite: PendingOrgInviteItem) {
    invalidatePendingHandoff();
    await pendingInvitesApi.acceptInvite(invite.id);

    const isStillPending = pendingInvitesApi.invites.some((pending) => pending.id === invite.id);
    if (isStillPending) return;

    try {
      await authClient.getSession({ query: { disableCookieCache: true } });
    } catch (error) {
      console.error('refreshing session after invite accept error:', error);
    }

    await appInitApi.refreshAccountData();
  }

  function createOrganization() {
    invalidatePendingHandoff();
    capturePosthogEvent('org_chooser_create_clicked');
    goto(resolve('/onboarding', {}));
  }

  async function useDifferentAccount() {
    invalidatePendingHandoff();

    try {
      await logout();
    } catch (error) {
      console.error('logout error:', error);
    }
  }
</script>

<div
  class="auth-ui-background ui:bg-background relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4"
>
  <div class="absolute inset-0 z-0 hidden translate-x-[16%] md:block" style:--machine-face="var(--background)">
    <MachineTrainingLine />
  </div>
  <div
    class="relative z-10 w-full max-w-[400px] drop-shadow-[0_10px_20px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
    data-testid="org-chooser"
  >
    <Card.Root class="ui:notch-cutout w-full shadow-none">
      <Card.Header class="flex flex-col items-center gap-4">
        <a href={resolve(ROUTE.HOME, {})} class="inline-flex" aria-label="ClassroomIO">
          <Avatar.Root>
            <Avatar.Image src="/logo-192.png" alt="ClassroomIO" />
            <Avatar.Fallback>ClassroomIO</Avatar.Fallback>
          </Avatar.Root>
        </a>

        <Card.Title class="text-2xl font-normal!">{$t('org_chooser.title')}</Card.Title>
        <Card.Description class="text-center">{$t('org_chooser.subtitle')}</Card.Description>
        {#if $profile.email}
          <p class="ui:text-muted-foreground text-xs">{$t('org_chooser.signed_in_as', { email: $profile.email })}</p>
        {/if}
      </Card.Header>

      <Card.Content>
        {#if !isReady}
          <ResourceListRow.Group class="ui:bg-card">
            {#each SKELETON_ROWS as row (row)}
              <div class="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
                <Skeleton class="size-10 rounded-lg" />
                <div class="flex flex-1 flex-col gap-2">
                  <Skeleton class="h-4 w-40" />
                  <Skeleton class="h-3 w-28" />
                </div>
              </div>
            {/each}
          </ResourceListRow.Group>
        {:else}
          <div class="flex flex-col gap-6">
            {#if memberships.managed.length > 0}
              <section class="flex flex-col gap-2">
                <h2 class="ui:text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {$t('org_chooser.managed_heading')}
                </h2>
                <ResourceListRow.Group class="ui:bg-card">
                  {#each memberships.managed as org (org.id)}
                    <OrgChooserRow
                      name={org.name}
                      avatarUrl={org.avatarUrl}
                      roleLabel={roleLabel(org.roleId)}
                      ariaLabel={$t('org_chooser.open_dashboard', { name: org.name })}
                      testId="org-chooser-managed-{org.siteName}"
                      onSelect={() => openManagedOrg(org)}
                    />
                  {/each}
                </ResourceListRow.Group>
              </section>
            {/if}

            {#if memberships.learning.length > 0}
              <section class="flex flex-col gap-2">
                <h2 class="ui:text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {$t('org_chooser.learning_heading')}
                </h2>
                <ResourceListRow.Group class="ui:bg-card">
                  {#each memberships.learning as org (org.id)}
                    {@const host = getOrgSiteHost(org)}
                    <OrgChooserRow
                      name={org.name}
                      avatarUrl={org.avatarUrl}
                      roleLabel={roleLabel(org.roleId)}
                      subtitle={host}
                      ariaLabel={$t('org_chooser.open_academy', { name: org.name, host })}
                      leavesDashboard
                      busy={openingOrgId === org.id}
                      disabled={openingOrgId !== null}
                      testId="org-chooser-learning-{org.siteName}"
                      onSelect={() => openAcademy(org)}
                    />
                  {/each}
                </ResourceListRow.Group>
              </section>
            {/if}

            {#if pendingInvites.length > 0}
              <section class="flex flex-col gap-2">
                <h2 class="ui:text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {$t('org_chooser.invites_heading')}
                </h2>
                <ResourceListRow.Group class="ui:bg-card">
                  {#each pendingInvites as invite (invite.id)}
                    <ResourceListRow.Root variant="default" size="sm" class="px-4! py-3!">
                      <ResourceListRow.Lead>
                        <Avatar.Root class="size-10 rounded-lg">
                          <Avatar.Image src={invite.organization.avatarUrl} alt={invite.organization.name} />
                          <Avatar.Fallback class="rounded-lg">{shortenName(invite.organization.name)}</Avatar.Fallback>
                        </Avatar.Root>
                      </ResourceListRow.Lead>
                      <ResourceListRow.Main>
                        <span class="truncate text-sm font-medium">{invite.organization.name}</span>
                        <span class="ui:text-muted-foreground truncate text-xs">
                          {$t('org_chooser.invited_as', { role: roleLabel(invite.roleId) })}
                        </span>
                      </ResourceListRow.Main>
                      <ResourceListRow.End>
                        <Button
                          size="sm"
                          loading={pendingInvitesApi.acceptingInviteId === invite.id}
                          disabled={pendingInvitesApi.acceptingInviteId !== null}
                          testId="org-chooser-accept-invite"
                          onclick={() => acceptInvite(invite)}
                        >
                          {$t('org_chooser.accept_invite')}
                        </Button>
                      </ResourceListRow.End>
                    </ResourceListRow.Root>
                  {/each}
                </ResourceListRow.Group>
              </section>
            {:else if pendingInvitesApi.hasLoaded && pendingInvitesApi.lastError}
              <section class="flex flex-col gap-2">
                <h2 class="ui:text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {$t('org_chooser.invites_heading')}
                </h2>
                <div class="ui:bg-card flex flex-col items-start gap-3 rounded-lg p-4">
                  <p class="ui:text-muted-foreground text-sm">{$t('org_chooser.invites_error')}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    testId="org-chooser-invites-retry"
                    onclick={() => pendingInvitesApi.fetchPendingInvites()}
                  >
                    {$t('org_chooser.invites_retry')}
                  </Button>
                </div>
              </section>
            {/if}

            {#if canCreateOrg}
              <div class="ui:bg-muted/40 flex flex-col gap-3 rounded-lg p-4">
                <div class="flex flex-col gap-1">
                  <p class="text-sm font-medium">{$t('org_chooser.create_heading')}</p>
                  <p class="ui:text-muted-foreground text-sm">{$t('org_chooser.create_description')}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  class="w-full"
                  testId="org-chooser-create"
                  onclick={createOrganization}
                >
                  <PlusIcon class="size-4" />
                  {$t('org_chooser.create_cta')}
                </Button>
              </div>
            {/if}
          </div>
        {/if}
      </Card.Content>

      <Card.Footer class="flex-col gap-2 border-t pt-6">
        <p class="ui:text-muted-foreground text-center text-sm">
          {$t('org_chooser.different_account')}
          <Button
            variant="link"
            size="sm"
            class="h-auto p-0"
            testId="org-chooser-switch-account"
            onclick={useDifferentAccount}
          >
            {$t('org_chooser.different_account_cta')}
          </Button>
        </p>
      </Card.Footer>
    </Card.Root>
  </div>
</div>
