<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { AuthUI } from '$features/ui';
  import { oauthApi } from '$features/oauth/api/oauth.svelte';
  import { getOAuthQuery } from '$features/oauth/utils/oauth-scopes';
  import { t } from '$lib/utils/functions/translations';
  import * as Avatar from '@cio/ui/base/avatar';
  import { Button } from '@cio/ui/base/button';

  const oauthQuery = $derived(getOAuthQuery(page.url.search));
  const clientName = $derived(oauthApi.client?.client_name || t.get('oauth.consent.unknown_client'));
  const hasOrganizations = $derived((oauthApi.organizations?.length ?? 0) > 0);

  async function chooseOrganization(organizationId: string) {
    const selection = await oauthApi.selectOrganization(organizationId);
    if (!selection) return;

    const nextUrl = await oauthApi.continueAfterOrganization(oauthQuery);
    if (nextUrl) window.location.href = nextUrl;
  }

  onMount(async () => {
    const clientId = page.url.searchParams.get('client_id');
    if (clientId) await oauthApi.loadClient(clientId);

    await oauthApi.listOrganizations();

    if (oauthApi.organizations?.length === 1) {
      await chooseOrganization(oauthApi.organizations[0].id);
    }
  });
</script>

<svelte:head><title>{$t('oauth.select_organization.title')}</title></svelte:head>

<AuthUI showOnlyContent showLogo isLoading={oauthApi.isLoading}>
  <div class="flex flex-col gap-6">
    <div class="space-y-1 text-center">
      <h1 class="text-2xl font-normal">{$t('oauth.select_organization.title')}</h1>
      {#if hasOrganizations}
        <p class="ui:text-muted-foreground text-sm">
          {$t('oauth.select_organization.subtitle', { client: clientName })}
        </p>
      {/if}
    </div>

    {#if oauthApi.organizations && !hasOrganizations}
      <div class="space-y-1 text-center">
        <p class="font-medium">{$t('oauth.select_organization.empty_title')}</p>
        <p class="ui:text-muted-foreground text-sm">{$t('oauth.select_organization.empty_description')}</p>
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
            disabled={oauthApi.isLoading}
            onclick={() => chooseOrganization(organization.id)}
            testId="oauth-select-organization-{organization.id}"
          >
            <Avatar.Root>
              <Avatar.Image src={organization.avatarUrl ?? '/logo-192.png'} alt={organization.name} />
              <Avatar.Fallback>{organization.name.slice(0, 2)}</Avatar.Fallback>
            </Avatar.Root>
            <span class="font-medium">{organization.name}</span>
          </Button>
        {/each}
      </div>
    {/if}
  </div>
</AuthUI>
