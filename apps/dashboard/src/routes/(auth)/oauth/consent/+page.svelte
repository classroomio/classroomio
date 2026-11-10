<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { AuthUI } from '$features/ui';
  import { oauthApi } from '$features/oauth/api/oauth.svelte';
  import {
    getOAuthQuery,
    hasOfflineAccess,
    isOAuthAuthorizationQuery,
    parseOAuthScopeParam,
    summarizeOAuthScopes
  } from '$features/oauth/utils/oauth-scopes';
  import { t } from '$lib/utils/functions/translations';
  import * as Avatar from '@cio/ui/base/avatar';
  import { Button } from '@cio/ui/base/button';
  import * as Select from '@cio/ui/base/select';
  import CheckIcon from '@lucide/svelte/icons/check';

  let isReady = $state(false);
  let selectedOrganizationId = $state('');

  const oauthQuery = $derived(getOAuthQuery(page.url.search));
  const isValidRequest = $derived(isOAuthAuthorizationQuery(page.url.searchParams));
  const scopes = $derived(parseOAuthScopeParam(page.url.searchParams.get('scope')));
  const scopeSummaries = $derived(summarizeOAuthScopes(scopes));
  const clientName = $derived(oauthApi.client?.client_name || t.get('oauth.consent.unknown_client'));
  const selectedOrganization = $derived(
    oauthApi.selectedOrganization?.id === selectedOrganizationId ? oauthApi.selectedOrganization : null
  );
  const hasWorkspaces = $derived((oauthApi.organizations?.length ?? 0) > 0);
  const redirectHost = $derived.by(() => {
    try {
      return new URL(page.url.searchParams.get('redirect_uri') ?? '').host;
    } catch {
      return '';
    }
  });

  async function respond(accept: boolean) {
    const redirectUrl = await oauthApi.submitConsent(accept, oauthQuery);
    if (redirectUrl) window.location.href = redirectUrl;
  }

  onMount(async () => {
    const clientId = page.url.searchParams.get('client_id');

    try {
      if (clientId) {
        await Promise.all([
          oauthApi.loadClient(clientId),
          oauthApi.listOrganizations(),
          oauthApi.loadSelectedOrganization()
        ]);
      }

      const organizations = oauthApi.organizations ?? [];
      const savedOrganisation = oauthApi.selectedOrganization;
      const savedOrganisationIsEligible = organizations.some(
        (organization) => organization.id === savedOrganisation?.id
      );
      const nextSelection = savedOrganisationIsEligible ? savedOrganisation!.id : (organizations[0]?.id ?? '');

      selectedOrganizationId = nextSelection;

      if (nextSelection) await oauthApi.selectOrganization(nextSelection);
    } finally {
      isReady = true;
    }
  });
</script>

<svelte:head><title>{$t('oauth.consent.page_title')}</title></svelte:head>

<AuthUI showOnlyContent showLogo isLoading={oauthApi.isLoading} handleSubmit={() => respond(true)}>
  {#if isReady && !isValidRequest}
    <div class="space-y-1 text-center">
      <h1 class="text-xl font-medium">{$t('oauth.consent.error_title')}</h1>
      <p class="ui:text-muted-foreground text-sm">{$t('oauth.consent.error_description')}</p>
    </div>
  {:else if isReady && !hasWorkspaces}
    <div class="space-y-1 text-center">
      <h1 class="text-2xl font-normal">{$t('oauth.consent.title', { client: clientName })}</h1>
      <p class="pt-4 text-lg font-medium">{$t('oauth.consent.no_workspaces_title')}</p>
      <p class="ui:text-muted-foreground text-sm">{$t('oauth.consent.no_workspaces_description')}</p>
    </div>
  {:else if isReady}
    <div class="flex flex-col gap-6">
      <div class="space-y-1 text-center">
        <h1 class="text-2xl font-normal">{$t('oauth.consent.title', { client: clientName })}</h1>
        <p class="ui:text-muted-foreground text-sm">
          {$t('oauth.consent.subtitle', { client: clientName })}
        </p>
      </div>

      <div class="space-y-2 text-left">
        <p class="text-sm font-medium">{$t('oauth.consent.workspace_label')}</p>
        <Select.Root
          type="single"
          bind:value={selectedOrganizationId}
          onValueChange={(organizationId) => oauthApi.selectOrganization(organizationId)}
          disabled={oauthApi.isLoading}
        >
          <Select.Trigger class="w-full" data-testid="oauth-consent-workspace-select">
            <div class="flex min-w-0 items-center gap-2">
              <Avatar.Root class="size-5 shrink-0">
                <Avatar.Image
                  src={selectedOrganization?.avatarUrl ?? '/logo-192.png'}
                  alt={selectedOrganization?.name}
                />
                <Avatar.Fallback>{selectedOrganization?.name.slice(0, 2)}</Avatar.Fallback>
              </Avatar.Root>
              <span class="truncate font-medium">{selectedOrganization?.name}</span>
            </div>
          </Select.Trigger>
          <Select.Content>
            {#each oauthApi.organizations ?? [] as organization (organization.id)}
              <Select.Item value={organization.id}>
                <div class="flex items-center gap-2">
                  <Avatar.Root class="size-5 shrink-0">
                    <Avatar.Image src={organization.avatarUrl ?? '/logo-192.png'} alt={organization.name} />
                    <Avatar.Fallback>{organization.name.slice(0, 2)}</Avatar.Fallback>
                  </Avatar.Root>
                  <span class="truncate">{organization.name}</span>
                </div>
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="space-y-3">
        <p class="text-sm font-medium">{$t('oauth.consent.permissions_heading', { client: clientName })}</p>
        <ul class="space-y-2">
          {#each scopeSummaries as summary (summary.group)}
            <li class="flex items-start gap-2 text-sm">
              <CheckIcon class="ui:text-primary mt-0.5 size-4 shrink-0" />
              <span>{$t(`oauth.scope_group.${summary.group}.${summary.access}`)}</span>
            </li>
          {/each}
          {#if hasOfflineAccess(scopes)}
            <li class="flex items-start gap-2 text-sm">
              <CheckIcon class="ui:text-primary mt-0.5 size-4 shrink-0" />
              <span>{$t('oauth.consent.stay_connected')}</span>
            </li>
          {/if}
        </ul>
      </div>

      <div class="ui:text-muted-foreground space-y-1 text-xs">
        <p>{$t('oauth.consent.admin_note')}</p>
        {#if redirectHost}
          <p>{$t('oauth.consent.redirect_note', { host: redirectHost })}</p>
        {/if}
      </div>

      {#if oauthApi.error}
        <p class="ui:text-destructive text-sm">{$t('oauth.error.generic')}</p>
      {/if}

      <div class="flex gap-3">
        <Button
          type="button"
          variant="outline"
          class="flex-1"
          disabled={oauthApi.isLoading}
          onclick={() => respond(false)}
          testId="oauth-consent-deny"
        >
          {$t('oauth.consent.deny')}
        </Button>
        <Button type="submit" class="flex-1" loading={oauthApi.isLoading} testId="oauth-consent-allow">
          {$t('oauth.consent.allow')}
        </Button>
      </div>
    </div>
  {/if}
</AuthUI>
