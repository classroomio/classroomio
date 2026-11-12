<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { AuthUI } from '$features/ui';
  import { oauthApi } from '$features/oauth/api/oauth.svelte';
  import {
    getOAuthConsentPageQuery,
    getOAuthQuery,
    getOAuthResource,
    hasOfflineAccess,
    isOAuthAuthorizationQuery,
    parseOAuthScopeParam,
    summarizeOAuthScopes
  } from '$features/oauth/utils/oauth-scopes';
  import { t } from '$lib/utils/functions/translations';
  import { canOAuthScopesChangeData, getReadOnlyOAuthScopes } from '@cio/utils/constants/oauth-scopes';
  import * as Avatar from '@cio/ui/base/avatar';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import * as Select from '@cio/ui/base/select';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { Switch } from '@cio/ui/base/switch';
  import CheckIcon from '@lucide/svelte/icons/check';

  let isReady = $state(false);
  let isOrganizationsLoaded = $state(false);
  let selectionReadFailed = $state(false);
  let clientLoadFailed = $state(false);
  let pendingDecision = $state<'allow' | 'deny' | null>(null);
  let allowChanges = $state(true);

  let selectedOrganizationId = $state('');

  /**
   * `undefined` means unknown (read failed), `null` means the server has
   * nothing saved yet, and a string is the last confirmed saved selection.
   */
  let savedOrganizationId = $state<string | null | undefined>(undefined);

  const oauthQuery = $derived(getOAuthQuery(page.url.search));
  const isValidRequest = $derived(isOAuthAuthorizationQuery(page.url.searchParams));
  const scopes = $derived(parseOAuthScopeParam(page.url.searchParams.get('scope')));
  const canRequestChanges = $derived(canOAuthScopesChangeData(scopes));
  const readOnlyScopes = $derived(getReadOnlyOAuthScopes(scopes));
  const grantedScopes = $derived(allowChanges ? scopes : readOnlyScopes);
  const canNarrowScopes = $derived(canRequestChanges && readOnlyScopes.length > 0);
  const scopeSummaries = $derived(summarizeOAuthScopes(grantedScopes));
  const clientName = $derived(oauthApi.client?.client_name || t.get('oauth.consent.unknown_client'));
  const selectedOrganization = $derived(
    oauthApi.selectedOrganization?.id === selectedOrganizationId ? oauthApi.selectedOrganization : null
  );
  const hasWorkspaces = $derived((oauthApi.organizations?.length ?? 0) > 0);
  const eligibleOrganizations = $derived(
    (oauthApi.organizations ?? []).filter((organization) => organization.eligible)
  );
  const hasEligibleWorkspaces = $derived(eligibleOrganizations.length > 0);
  const isSubmitting = $derived(pendingDecision !== null || oauthApi.isLoading);
  const canApprove = $derived(Boolean(savedOrganizationId) && savedOrganizationId === selectedOrganizationId);
  const redirectHost = $derived.by(() => {
    try {
      return new URL(page.url.searchParams.get('redirect_uri') ?? '').host;
    } catch {
      return '';
    }
  });

  function getClientId(): string | null {
    return page.url.searchParams.get('client_id');
  }

  async function reloadClient() {
    const clientId = getClientId();

    if (!clientId) return;

    clientLoadFailed = !(await oauthApi.loadClient(clientId));
  }

  async function resolveWorkspaceSelection() {
    if (savedOrganizationId) {
      selectedOrganizationId = savedOrganizationId;

      return;
    }

    if (selectionReadFailed || !isOrganizationsLoaded) return;

    const firstEligibleId = eligibleOrganizations[0]?.id ?? '';

    if (!firstEligibleId) return;

    selectedOrganizationId = firstEligibleId;

    const saved = await oauthApi.selectOrganization(firstEligibleId);

    if (!saved) {
      selectedOrganizationId = '';
      savedOrganizationId = null;

      return;
    }

    savedOrganizationId = firstEligibleId;
  }

  async function reloadOrganizations() {
    const clientId = getClientId();

    if (!clientId) return;

    const resource = getOAuthResource(page.url.searchParams);
    const result = await oauthApi.listOrganizations(resource);
    const loaded = Boolean(result);

    isOrganizationsLoaded = loaded;

    if (loaded) await resolveWorkspaceSelection();
  }

  async function handleWorkspaceChange(organizationId: string) {
    selectedOrganizationId = organizationId;

    const saved = await oauthApi.selectOrganization(organizationId);

    if (saved) {
      savedOrganizationId = organizationId;

      return;
    }

    selectedOrganizationId = savedOrganizationId ?? '';
  }

  async function respond(accept: boolean) {
    if (isSubmitting) return;
    if (accept && grantedScopes.length === 0) return;

    pendingDecision = accept ? 'allow' : 'deny';

    if (!accept) {
      const deniedUrl = await oauthApi.submitConsent(false, oauthQuery);

      if (deniedUrl) {
        window.location.href = deniedUrl;

        return;
      }

      pendingDecision = null;

      return;
    }

    await clearPostLoginGate();
  }

  async function clearPostLoginGate() {
    if (selectedOrganizationId) {
      await oauthApi.selectOrganization(selectedOrganizationId);
    }

    const nextUrl = await oauthApi.continueAfterOrganization(oauthQuery);

    if (!nextUrl) {
      pendingDecision = null;

      return;
    }

    const consentPageQuery = getOAuthConsentPageQuery(nextUrl, window.location.origin);

    if (consentPageQuery === null) {
      if (!allowChanges && grantedScopes.length > 0) {
        const redirectUrl = await oauthApi.submitConsent(true, oauthQuery, grantedScopes);

        if (!redirectUrl) {
          pendingDecision = null;

          return;
        }

        window.location.href = redirectUrl;

        return;
      }

      window.location.href = nextUrl;

      return;
    }

    const narrowedScopes = allowChanges ? undefined : grantedScopes;
    const redirectUrl = await oauthApi.submitConsent(true, consentPageQuery, narrowedScopes);

    if (!redirectUrl) {
      pendingDecision = null;

      return;
    }

    window.location.href = redirectUrl;
  }

  async function initialize() {
    const clientId = getClientId();

    if (!clientId) {
      isReady = true;

      return;
    }

    selectedOrganizationId = '';
    savedOrganizationId = undefined;
    selectionReadFailed = false;
    clientLoadFailed = false;

    const resource = getOAuthResource(page.url.searchParams);

    try {
      const [clientLoaded, organizationsLoaded, selectionResponse] = await Promise.all([
        oauthApi.loadClient(clientId),
        oauthApi.listOrganizations(resource),
        oauthApi.loadSelectedOrganization(),
        oauthApi.loadClientTrust(clientId)
      ]);

      clientLoadFailed = !clientLoaded;
      isOrganizationsLoaded = Boolean(organizationsLoaded);
      selectionReadFailed = selectionResponse === undefined;

      if (selectionResponse) {
        savedOrganizationId = oauthApi.selectedOrganization?.id ?? null;
      } else {
        savedOrganizationId = undefined;
      }
    } finally {
      isReady = true;
    }

    await resolveWorkspaceSelection();
  }

  onMount(() => {
    void initialize();
  });
</script>

<svelte:head><title>{$t('oauth.consent.page_title')}</title></svelte:head>

<AuthUI showOnlyContent showLogo isLoading={isSubmitting} handleSubmit={() => respond(true)}>
  {#if !isReady}
    <div class="flex flex-col gap-6">
      <div class="space-y-2 text-center">
        <Skeleton class="mx-auto h-7 w-3/4" />
        <Skeleton class="mx-auto h-4 w-44" />
      </div>

      <div class="space-y-3">
        <Skeleton class="h-4 w-40" />
        <div class="space-y-2">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-5/6" />
          <Skeleton class="h-4 w-4/6" />
        </div>
      </div>

      <div class="flex gap-3">
        <Skeleton class="h-9 flex-1 rounded-md" />
        <Skeleton class="h-9 flex-1 rounded-md" />
      </div>
    </div>
  {:else if !isValidRequest}
    <div class="space-y-1 text-center">
      <h1 class="text-xl font-medium">{$t('oauth.consent.error_title')}</h1>
      <p class="ui:text-muted-foreground text-sm">{$t('oauth.consent.error_description')}</p>
    </div>
  {:else if clientLoadFailed}
    <div class="flex flex-col gap-3">
      <h1 class="text-2xl font-normal">{$t('oauth.consent.title', { client: clientName })}</h1>
      <p class="ui:text-destructive text-sm">{$t('oauth.error.generic')}</p>
      <Button type="button" variant="outline" onclick={reloadClient} class="mx-auto">
        {$t('oauth.error.retry')}
      </Button>
    </div>
  {:else if !isOrganizationsLoaded}
    <div class="flex flex-col gap-3">
      <p class="ui:text-destructive text-center text-sm">{$t('oauth.error.generic')}</p>
      <Button type="button" variant="outline" onclick={reloadOrganizations} class="mx-auto">
        {$t('oauth.error.retry')}
      </Button>
    </div>
  {:else if !hasWorkspaces}
    <div class="space-y-1 text-center">
      <h1 class="text-2xl font-normal">{$t('oauth.consent.title', { client: clientName })}</h1>
      <p class="pt-4 text-lg font-medium">{$t('oauth.consent.no_workspaces_title')}</p>
      <p class="ui:text-muted-foreground text-sm">{$t('oauth.consent.no_workspaces_description')}</p>
    </div>
  {:else if !hasEligibleWorkspaces}
    <div class="space-y-1 text-center">
      <h1 class="text-2xl font-normal">{$t('oauth.consent.title', { client: clientName })}</h1>
      <p class="pt-4 text-lg font-medium">{$t('oauth.consent.no_eligible_title')}</p>
      <p class="ui:text-muted-foreground text-sm">{$t('oauth.consent.no_eligible_description')}</p>
    </div>
  {:else}
    <div class="flex flex-col gap-6">
      <div class="space-y-1 text-center">
        <h1 class="text-2xl font-normal">{$t('oauth.consent.title', { client: clientName })}</h1>
        {#if oauthApi.clientTrust?.trusted}
          <Badge variant="secondary" class="mx-auto">{$t('oauth.consent.verified')}</Badge>
        {/if}
        <p class="ui:text-muted-foreground text-sm">
          {$t('oauth.consent.subtitle', { client: clientName })}
        </p>
      </div>

      <div class="space-y-2 text-left">
        <p class="text-sm font-medium">{$t('oauth.consent.workspace_label')}</p>
        <Select.Root
          type="single"
          bind:value={selectedOrganizationId}
          onValueChange={handleWorkspaceChange}
          disabled={isSubmitting}
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
              <Select.Item value={organization.id} disabled={!organization.eligible}>
                <div class="flex items-center gap-2">
                  <Avatar.Root class="size-5 shrink-0">
                    <Avatar.Image src={organization.avatarUrl ?? '/logo-192.png'} alt={organization.name} />
                    <Avatar.Fallback>{organization.name.slice(0, 2)}</Avatar.Fallback>
                  </Avatar.Root>
                  <span class="flex min-w-0 flex-col items-start">
                    <span class="truncate">{organization.name}</span>
                    {#if organization.reason === 'plan'}
                      <span class="ui:text-muted-foreground text-xs">{$t('oauth.consent.plan_required')}</span>
                    {/if}
                  </span>
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

      {#if canNarrowScopes}
        <Field.Field orientation="horizontal">
          <Switch id="oauth-consent-allow-changes" bind:checked={allowChanges} disabled={isSubmitting} />
          <div class="space-y-0.5">
            <Field.Label for="oauth-consent-allow-changes">
              {$t('oauth.consent.allow_changes.label', { client: clientName })}
            </Field.Label>
            <Field.Description>
              {$t('oauth.consent.allow_changes.description', { client: clientName })}
            </Field.Description>
          </div>
        </Field.Field>
      {/if}

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
          loading={pendingDecision === 'deny'}
          disabled={isSubmitting}
          onclick={() => respond(false)}
          testId="oauth-consent-deny"
        >
          {$t('oauth.consent.deny')}
        </Button>
        <Button
          type="submit"
          class="flex-1"
          loading={pendingDecision === 'allow'}
          disabled={!canApprove || isSubmitting || grantedScopes.length === 0}
          testId="oauth-consent-allow"
        >
          {$t('oauth.consent.allow')}
        </Button>
      </div>
    </div>
  {/if}
</AuthUI>
