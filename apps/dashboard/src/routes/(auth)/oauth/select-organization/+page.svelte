<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { AuthUI } from '$features/ui';
  import { oauthApi } from '$features/oauth/api/oauth.svelte';
  import { getOAuthQuery, getOAuthResource } from '$features/oauth/utils/oauth-scopes';
  import { t } from '$lib/utils/functions/translations';
  import * as Avatar from '@cio/ui/base/avatar';
  import { Button } from '@cio/ui/base/button';
  import { Skeleton } from '@cio/ui/base/skeleton';

  let isLoadingWorkspaces = $state(true);
  let selectedOrganizationId = $state<string | null>(null);

  const oauthQuery = $derived(getOAuthQuery(page.url.search));
  const clientName = $derived(oauthApi.client?.client_name || t.get('oauth.consent.unknown_client'));
  const hasOrganizations = $derived((oauthApi.organizations?.length ?? 0) > 0);
  const eligibleOrganizations = $derived(
    (oauthApi.organizations ?? []).filter((organization) => organization.eligible)
  );
  const hasEligibleOrganizations = $derived(eligibleOrganizations.length > 0);
  const isBusy = $derived(isLoadingWorkspaces || selectedOrganizationId !== null || oauthApi.isLoading);

  async function chooseOrganization(organizationId: string): Promise<boolean> {
    selectedOrganizationId = organizationId;
    const selection = await oauthApi.selectOrganization(organizationId);

    if (!selection) {
      selectedOrganizationId = null;

      return false;
    }

    const redirected = await oauthApi.continueAfterOrganization(oauthQuery);

    if (!redirected) {
      selectedOrganizationId = null;

      return false;
    }

    return true;
  }

  onMount(async () => {
    const clientId = page.url.searchParams.get('client_id');
    const resource = getOAuthResource(page.url.searchParams);

    await Promise.all([
      clientId ? oauthApi.loadClient(clientId) : Promise.resolve(),
      oauthApi.listOrganizations(resource)
    ]);

    if (!oauthApi.organizations) {
      oauthApi.error = 'oauth.error.generic';
      isLoadingWorkspaces = false;

      return;
    }

    if (oauthApi.organizations.length === 1 && eligibleOrganizations.length === 1) {
      const redirected = await chooseOrganization(eligibleOrganizations[0].id);

      if (!redirected) {
        isLoadingWorkspaces = false;
      }

      return;
    }

    isLoadingWorkspaces = false;
  });
</script>

<svelte:head><title>{$t('oauth.select_organization.title')}</title></svelte:head>

<AuthUI showOnlyContent showLogo isLoading={isBusy}>
  <div class="flex flex-col gap-6">
    <div class="space-y-1 text-center">
      <h1 class="text-2xl font-normal">{$t('oauth.select_organization.title')}</h1>
      {#if isLoadingWorkspaces}
        <Skeleton class="mx-auto h-4 w-56" />
      {:else if hasOrganizations}
        <p class="ui:text-muted-foreground text-sm">
          {$t('oauth.select_organization.subtitle', { client: clientName })}
        </p>
      {/if}
    </div>

    {#if isLoadingWorkspaces}
      <div class="flex flex-col gap-2">
        <Skeleton class="h-14 w-full rounded-md" />
        <Skeleton class="h-14 w-full rounded-md" />
      </div>
    {:else if oauthApi.organizations && !hasOrganizations}
      <div class="space-y-1 text-center">
        <p class="font-medium">{$t('oauth.select_organization.empty_title')}</p>
        <p class="ui:text-muted-foreground text-sm">{$t('oauth.select_organization.empty_description')}</p>
      </div>
    {:else if oauthApi.organizations && !hasEligibleOrganizations}
      <div class="space-y-1 text-center">
        <p class="font-medium">{$t('oauth.select_organization.no_eligible_title')}</p>
        <p class="ui:text-muted-foreground text-sm">{$t('oauth.select_organization.no_eligible_description')}</p>
      </div>
    {:else if oauthApi.error}
      <p class="ui:text-destructive text-center text-sm">{$t('oauth.error.generic')}</p>
    {:else}
      <div class="flex flex-col gap-2">
        {#each oauthApi.organizations ?? [] as organization (organization.id)}
          <Button
            type="button"
            variant="outline"
            class="h-auto justify-start gap-3 py-3"
            loading={selectedOrganizationId === organization.id}
            disabled={isBusy || !organization.eligible}
            onclick={() => chooseOrganization(organization.id)}
            testId="oauth-select-organization-{organization.id}"
          >
            <Avatar.Root>
              <Avatar.Image src={organization.avatarUrl ?? '/logo-192.png'} alt={organization.name} />
              <Avatar.Fallback>{organization.name.slice(0, 2)}</Avatar.Fallback>
            </Avatar.Root>
            <span class="flex flex-col items-start">
              <span class="font-medium">{organization.name}</span>
              {#if organization.reason === 'plan'}
                <span class="ui:text-muted-foreground text-xs">{$t('oauth.select_organization.plan_required')}</span>
              {/if}
            </span>
          </Button>
        {/each}
      </div>
    {/if}
  </div>
</AuthUI>
