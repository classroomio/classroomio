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
  import { canOAuthScopesChangeData, getReadOnlyOAuthScopes } from '@cio/utils/constants/oauth-scopes';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { Switch } from '@cio/ui/base/switch';
  import CheckIcon from '@lucide/svelte/icons/check';

  let isReady = $state(false);
  let pendingDecision = $state<'allow' | 'deny' | null>(null);
  let allowChanges = $state(true);

  const oauthQuery = $derived(getOAuthQuery(page.url.search));
  const isValidRequest = $derived(isOAuthAuthorizationQuery(page.url.searchParams));
  const scopes = $derived(parseOAuthScopeParam(page.url.searchParams.get('scope')));
  const canRequestChanges = $derived(canOAuthScopesChangeData(scopes));
  const grantedScopes = $derived(allowChanges ? scopes : getReadOnlyOAuthScopes(scopes));
  const scopeSummaries = $derived(summarizeOAuthScopes(grantedScopes));
  const clientName = $derived(oauthApi.client?.client_name || t.get('oauth.consent.unknown_client'));
  const redirectHost = $derived.by(() => {
    try {
      return new URL(page.url.searchParams.get('redirect_uri') ?? '').host;
    } catch {
      return '';
    }
  });
  // The server owns the selected workspace; a transient failure reading it back must not block a
  // consent request the authorization server can still complete.
  const canRespond = $derived(isValidRequest);
  const isSubmitting = $derived(pendingDecision !== null || oauthApi.isLoading);

  async function respond(accept: boolean) {
    if (isSubmitting) return;

    pendingDecision = accept ? 'allow' : 'deny';
    const narrowedScopes = accept && !allowChanges ? grantedScopes : undefined;
    const redirected = await oauthApi.submitConsent(accept, oauthQuery, narrowedScopes);

    if (!redirected) {
      pendingDecision = null;
    }
  }

  onMount(async () => {
    const clientId = page.url.searchParams.get('client_id');

    try {
      if (clientId) {
        await Promise.all([
          oauthApi.loadClient(clientId),
          oauthApi.loadClientTrust(clientId),
          oauthApi.loadSelectedOrganization()
        ]);
      }
    } finally {
      isReady = true;
    }
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
  {:else if !canRespond}
    <div class="space-y-1 text-center">
      <h1 class="text-xl font-medium">{$t('oauth.consent.error_title')}</h1>
      <p class="ui:text-muted-foreground text-sm">{$t('oauth.consent.error_description')}</p>
    </div>
  {:else}
    <div class="flex flex-col gap-6">
      <div class="space-y-1 text-center">
        <h1 class="text-2xl font-normal">{$t('oauth.consent.title', { client: clientName })}</h1>
        {#if oauthApi.clientTrust?.trusted}
          <Badge variant="secondary" class="mx-auto">{$t('oauth.consent.verified')}</Badge>
        {/if}
        {#if oauthApi.selectedOrganization}
          <p class="ui:text-muted-foreground text-sm">
            {$t('oauth.consent.workspace', { workspace: oauthApi.selectedOrganization.name })}
          </p>
        {/if}
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

      {#if canRequestChanges}
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
          disabled={isSubmitting}
          testId="oauth-consent-allow"
        >
          {$t('oauth.consent.allow')}
        </Button>
      </div>
    </div>
  {/if}
</AuthUI>
